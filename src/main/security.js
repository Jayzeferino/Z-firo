const { safeStorage } = require('electron');
const Database = require('better-sqlite3');
const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// Helper para abrir o banco diretamente para configurações rápidas
function getDbConnection() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'database', 'state.db');
  return new Database(dbPath);
}

// Inicializa a tabela de chaves se não existir
function initKeysTable() {
  const db = getDbConnection();
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      provider TEXT PRIMARY KEY,
      key_encrypted TEXT NOT NULL,
      data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.close();
}

function saveKey(provider, plainTextKey) {
  initKeysTable();
  
  if (!plainTextKey) {
    // Se a chave for vazia, removemos o registro
    const db = getDbConnection();
    const stmt = db.prepare('DELETE FROM api_keys WHERE provider = ?');
    stmt.run(provider);
    db.close();
    return true;
  }

  let encryptedValue;

  // Tentar criptografia oficial via safeStorage
  if (safeStorage.isEncryptionAvailable()) {
    const encryptedBuffer = safeStorage.encryptString(plainTextKey);
    encryptedValue = encryptedBuffer.toString('hex');
  } else {
    // Fallback básico se não disponível (ex: ambiente de teste docker/linux headless)
    console.warn('safeStorage encryption not available. Falling back to base64 encoding.');
    encryptedValue = Buffer.from(plainTextKey).toString('base64');
  }

  const db = getDbConnection();
  const stmt = db.prepare(`
    INSERT INTO api_keys (provider, key_encrypted, data_atualizacao)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(provider) DO UPDATE SET
      key_encrypted = excluded.key_encrypted,
      data_atualizacao = CURRENT_TIMESTAMP
  `);
  stmt.run(provider, encryptedValue);
  db.close();
  return true;
}

function getKey(provider) {
  initKeysTable();
  
  const db = getDbConnection();
  const stmt = db.prepare('SELECT key_encrypted FROM api_keys WHERE provider = ?');
  const row = stmt.get(provider);
  db.close();

  if (!row) return '';

  try {
    if (safeStorage.isEncryptionAvailable()) {
      const encryptedBuffer = Buffer.from(row.key_encrypted, 'hex');
      return safeStorage.decryptString(encryptedBuffer);
    } else {
      // Fallback base64
      return Buffer.from(row.key_encrypted, 'base64').toString('utf-8');
    }
  } catch (error) {
    console.error(`Failed to decrypt key for provider ${provider}:`, error);
    return '';
  }
}

module.exports = {
  saveKey,
  getKey
};
