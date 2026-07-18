const Database = require('better-sqlite3');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

let db;

function getDbPath() {
  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return path.join(dbDir, 'state.db');
}

function dbInit() {
  const dbPath = getDbPath();
  db = new Database(dbPath);
  
  // Habilitar chaves estrangeiras
  db.pragma('foreign_keys = ON');

  // 1. Tabela de Produtos
  db.exec(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE,
      avatar TEXT DEFAULT '🚀',
      promessa TEXT,
      dor_latente TEXT,
      avatar_details TEXT,
      mecanismo_unico TEXT,
      objecoes TEXT,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Tabela de Fatos (Memória Semântica)
  db.exec(`
    CREATE TABLE IF NOT EXISTS facts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL,
      fato TEXT NOT NULL,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
    )
  `);

  // 3. Tabela de Episódios (Memória Episódica / Histórico)
  db.exec(`
    CREATE TABLE IF NOT EXISTS episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id INTEGER NOT NULL,
      sessao_id TEXT NOT NULL,
      input_usuario TEXT NOT NULL,
      resposta_ia TEXT NOT NULL,
      data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
    )
  `);

  // --- Tabelas Virtuais FTS5 para busca léxica de alta velocidade ---

  // 4. FTS5 para fatos
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS facts_fts USING fts5(
      fato,
      content='facts',
      content_rowid='id'
    )
  `);

  // Triggers de Sincronização para fatos
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS facts_ai AFTER INSERT ON facts BEGIN
      INSERT INTO facts_fts(rowid, fato) VALUES (new.id, new.fato);
    END;
    CREATE TRIGGER IF NOT EXISTS facts_ad AFTER DELETE ON facts BEGIN
      INSERT INTO facts_fts(facts_fts, rowid, fato) VALUES ('delete', old.id, old.fato);
    END;
    CREATE TRIGGER IF NOT EXISTS facts_au AFTER UPDATE ON facts BEGIN
      INSERT INTO facts_fts(facts_fts, rowid, fato) VALUES ('delete', old.id, old.fato);
      INSERT INTO facts_fts(rowid, fato) VALUES (new.id, new.fato);
    END;
  `);

  // 5. FTS5 para episódios/conversas
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS episodes_fts USING fts5(
      input_usuario,
      resposta_ia,
      content='episodes',
      content_rowid='id'
    )
  `);

  // Triggers de Sincronização para episódios
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS episodes_ai AFTER INSERT ON episodes BEGIN
      INSERT INTO episodes_fts(rowid, input_usuario, resposta_ia) VALUES (new.id, new.input_usuario, new.resposta_ia);
    END;
    CREATE TRIGGER IF NOT EXISTS episodes_ad AFTER DELETE ON episodes BEGIN
      INSERT INTO episodes_fts(episodes_fts, rowid, input_usuario, resposta_ia) VALUES ('delete', old.id, old.input_usuario, old.resposta_ia);
    END;
    CREATE TRIGGER IF NOT EXISTS episodes_au AFTER UPDATE ON episodes BEGIN
      INSERT INTO episodes_fts(episodes_fts, rowid, input_usuario, resposta_ia) VALUES ('delete', old.id, old.input_usuario, old.resposta_ia);
      INSERT INTO episodes_fts(rowid, input_usuario, resposta_ia) VALUES (new.id, new.input_usuario, new.resposta_ia);
    END;
  `);
}

// --- Métodos de Leitura/Escrita de Dados ---

function getProdutos() {
  const stmt = db.prepare('SELECT * FROM produtos ORDER BY data_criacao DESC');
  return stmt.all();
}

function saveProduto(produto) {
  const { id, nome, avatar, promessa, dor_latente, avatar_details, mecanismo_unico, objecoes } = produto;
  
  if (id && id !== 'new') {
    const stmt = db.prepare(`
      UPDATE produtos 
      SET nome = ?, avatar = ?, promessa = ?, dor_latente = ?, avatar_details = ?, mecanismo_unico = ?, objecoes = ?
      WHERE id = ?
    `);
    stmt.run(nome, avatar, promessa, dor_latente, avatar_details, mecanismo_unico, objecoes, id);
    return id;
  } else {
    const stmt = db.prepare(`
      INSERT INTO produtos (nome, avatar, promessa, dor_latente, avatar_details, mecanismo_unico, objecoes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(nome, avatar || '🚀', promessa || '', dor_latente || '', avatar_details || '', mecanismo_unico || '', objecoes || '');
    return info.lastInsertRowid;
  }
}

function getFacts(produtoId) {
  const stmt = db.prepare('SELECT * FROM facts WHERE produto_id = ? ORDER BY data_criacao DESC');
  return stmt.all(produtoId);
}

function addFact(produtoId, fato) {
  const stmt = db.prepare('INSERT INTO facts (produto_id, fato) VALUES (?, ?)');
  const info = stmt.run(produtoId, fato);
  return info.lastInsertRowid;
}

function deleteFact(id) {
  const stmt = db.prepare('DELETE FROM facts WHERE id = ?');
  stmt.run(id);
}

function getEpisodes(produtoId) {
  const stmt = db.prepare('SELECT * FROM episodes WHERE produto_id = ? ORDER BY data_criacao ASC');
  return stmt.all(produtoId);
}

function addEpisode(produtoId, sessaoId, inputUsuario, respostaIa) {
  const stmt = db.prepare('INSERT INTO episodes (produto_id, sessao_id, input_usuario, resposta_ia) VALUES (?, ?, ?, ?)');
  const info = stmt.run(produtoId, sessaoId, inputUsuario, respostaIa);
  return info.lastInsertRowid;
}

function getLastActiveSession(produtoId) {
  const stmt = db.prepare('SELECT sessao_id FROM episodes WHERE produto_id = ? ORDER BY data_criacao DESC LIMIT 1');
  const row = stmt.get(produtoId);
  return row ? row.sessao_id : null;
}

function getEpisodesBySession(produtoId, sessaoId) {
  const stmt = db.prepare('SELECT * FROM episodes WHERE produto_id = ? AND sessao_id = ? ORDER BY data_criacao ASC');
  return stmt.all(produtoId, sessaoId);
}

// Busca FTS5 combinada
function searchMemory(produtoId, query) {
  // Sanetizar query de caracteres especiais do FTS5 (mantendo apenas letras, números e espaços)
  const sanitizedQuery = (query || '')
    .replace(/[^\w\s\u00C0-\u00FF]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Buscar nos Fatos
  const factsStmt = db.prepare(`
    SELECT f.id, f.fato, f.data_criacao, bm25(facts_fts) as rank
    FROM facts f
    JOIN facts_fts fts ON f.id = fts.rowid
    WHERE f.produto_id = ? AND facts_fts MATCH ?
    ORDER BY rank ASC
    LIMIT 10
  `);
  
  // 2. Buscar nas Conversas
  const episodesStmt = db.prepare(`
    SELECT e.id, e.sessao_id, e.input_usuario, e.resposta_ia, e.data_criacao, bm25(episodes_fts) as rank
    FROM episodes e
    JOIN episodes_fts fts ON e.id = fts.rowid
    WHERE e.produto_id = ? AND episodes_fts MATCH ?
    ORDER BY rank ASC
    LIMIT 10
  `);

  try {
    const queryToUse = sanitizedQuery || query; // fallback para original se ficou vazia
    const matchedFacts = factsStmt.all(produtoId, queryToUse);
    const matchedEpisodes = episodesStmt.all(produtoId, queryToUse);
    return { facts: matchedFacts, episodes: matchedEpisodes };
  } catch (error) {
    console.error('FTS5 search error:', error);
    // Fallback de pesquisa simples por LIKE se houver sintaxe inválida no MATCH
    const fallbackFacts = db.prepare("SELECT * FROM facts WHERE produto_id = ? AND fato LIKE ? LIMIT 10").all(produtoId, `%${query}%`);
    const fallbackEpisodes = db.prepare("SELECT * FROM episodes WHERE produto_id = ? AND (input_usuario LIKE ? OR resposta_ia LIKE ?) LIMIT 10").all(produtoId, `%${query}%`, `%${query}%`);
    return { facts: fallbackFacts, episodes: fallbackEpisodes };
  }
}

module.exports = {
  dbInit,
  getProdutos,
  saveProduto,
  getFacts,
  addFact,
  deleteFact,
  getEpisodes,
  addEpisode,
  getLastActiveSession,
  getEpisodesBySession,
  searchMemory
};
