const fs = require('fs');
const path = require('path');
const db = require('./db');

// O diretório do workspace do usuário
const WORKSPACE_DIR = '/Users/victor/UnoAgencyAgent';

// Helper para converter o nome do produto em um nome de pasta seguro
function sanitizeFolderName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9-_]/g, '_') // Substitui caracteres especiais por underline
    .substring(0, 50);
}

function regenerateMemoryFile(produtoId) {
  // 1. Obter informações completas do produto do banco de dados
  const produtos = db.getProdutos();
  const produto = produtos.find(p => p.id === Number(produtoId));
  if (!produto) return;

  const folderName = sanitizeFolderName(produto.nome);
  const produtoDir = path.join(WORKSPACE_DIR, 'produtos', folderName);
  const assistantDir = path.join(produtoDir, '.assistant');

  // Criar as pastas se não existirem
  if (!fs.existsSync(assistantDir)) {
    fs.mkdirSync(assistantDir, { recursive: true });
  }

  // 2. Obter fatos e episódios associados
  const facts = db.getFacts(produtoId);
  const episodes = db.getEpisodes(produtoId);

  // 3. Montar o conteúdo do arquivo MEMORY.md
  let markdown = `# Memória de Marketing - ${produto.nome}\n\n`;
  
  markdown += `*Este é o arquivo de memória sincronizado do Zéfiro. Você pode editá-lo diretamente ou consultá-lo pelo dashboard da aplicação.*\n\n`;
  
  markdown += `## 📋 Perfil de Posicionamento (Ficha Técnica)\n\n`;
  markdown += `- **Avatar Principal**: ${produto.avatar || '🚀'}\n`;
  markdown += `- **Promessa Única de Valor (Core)**: ${produto.promessa || '*Não definida*'}\n`;
  markdown += `- **Dor Latente do Cliente**: ${produto.dor_latente || '*Não definida*'}\n`;
  markdown += `- **Avatar Detalhado (Público Alvo)**: ${produto.avatar_details || '*Não definido*'}\n`;
  markdown += `- **Mecanismo Único**: ${produto.mecanismo_unico || '*Não definido*'}\n`;
  markdown += `- **Objeções Mapeadas**: ${produto.objecoes || '*Nenhuma objeção mapeada*'}\n\n`;

  markdown += `## 🧠 Memória Semântica (Fatos Consolidados)\n\n`;
  if (facts.length === 0) {
    markdown += `*Nenhum fato consolidado mapeado para este produto ainda.*\n`;
  } else {
    facts.forEach(f => {
      const date = new Date(f.data_criacao).toLocaleDateString('pt-BR');
      markdown += `- [${date}] ${f.fato}\n`;
    });
  }
  markdown += `\n`;

  markdown += `## 💬 Memória Episódica (Diálogos Recentes)\n\n`;
  if (episodes.length === 0) {
    markdown += `*Nenhum histórico de conversa registrado para este produto ainda.*\n`;
  } else {
    // Agrupar episódios por sessão
    const sessions = {};
    episodes.forEach(e => {
      if (!sessions[e.sessao_id]) {
        sessions[e.sessao_id] = [];
      }
      sessions[e.sessao_id].push(e);
    });

    Object.keys(sessions).forEach(sessaoId => {
      markdown += `### Sessão: \`${sessaoId.substring(0, 8)}\`\n\n`;
      sessions[sessaoId].forEach(e => {
        const date = new Date(e.data_criacao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        markdown += `**[${date}] Profissional**: ${e.input_usuario}\n\n`;
        markdown += `**[${date}] Zéfiro**: ${e.resposta_ia}\n\n`;
        markdown += `---\n\n`;
      });
    });
  }

  // 4. Salvar os arquivos Markdown físicos
  const memoryFilePath = path.join(assistantDir, 'MEMORY.md');
  fs.writeFileSync(memoryFilePath, markdown, 'utf-8');

  // Adicionalmente, salvar o posicionamento e histórico como arquivos limpos
  const posicionamentoFilePath = path.join(produtoDir, 'posicionamento.md');
  let posicionamentoMd = `# Posicionamento de Marketing - ${produto.nome}\n\n`;
  posicionamentoMd += `### Promessa Única\n${produto.promessa || '*Não definida*'}\n\n`;
  posicionamentoMd += `### Dor Latente\n${produto.dor_latente || '*Não definida*'}\n\n`;
  posicionamentoMd += `### Mecanismo Único\n${produto.mecanismo_unico || '*Não definido*'}\n\n`;
  posicionamentoMd += `### Objeções\n${produto.objecoes || '*Nenhuma*'}\n`;
  fs.writeFileSync(posicionamentoFilePath, posicionamentoMd, 'utf-8');

  return {
    memoryPath: memoryFilePath,
    posicionamentoPath: posicionamentoFilePath
  };
}

module.exports = {
  regenerateMemoryFile
};
