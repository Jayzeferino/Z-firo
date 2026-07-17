const fs = require('fs');
const path = require('path');
const db = require('./db');
const Zefiro = require('./zefiro');

// Auxiliar para extrair o prompt da skill ignorando frontmatter
function readSkillPromptBody(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const frontmatterRegex = /^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/;
    const match = fileContent.match(frontmatterRegex);
    return match ? match[2] : fileContent;
  } catch (e) {
    console.error('Error reading skill prompt body:', e);
    return '';
  }
}

// Gateway: Chat Conversacional de Agentes
async function handleChatStream(event, payload) {
  const { produtoId, agentId, message, chatHistory, tone, simpleLanguage, sessaoId, attachments } = payload;
  const webContents = event.sender;

  try {
    // 1. Instanciar o orquestrador Zéfiro para o produto ativo
    const zefiro = new Zefiro(produtoId);

    // 2. Obter perfil do agente a partir do diretório
    const agents = await require('./scanner').scanAgents();
    const agentProfile = agents.find(a => a.id === agentId) || { name: 'Zéfiro Assistant', role: 'Copiloto de Marketing' };

    // 3. Executar o turno completo de IA
    await zefiro.respond(message, {
      agentProfile,
      chatHistory,
      tone,
      simpleLanguage,
      sessaoId,
      webContents,
      attachments
    });

  } catch (error) {
    console.error('Gateway handleChatStream failed:', error);
    webContents.send('chat:stream', `\n⚠️ Ocorreu um erro no Gateway: ${error.message}`);
  }
}

// Gateway: Execução de Skills estruturadas
async function executeSkill(payload) {
  const { produtoId, skillId, inputs, tone, simpleLanguage } = payload;

  try {
    // 1. Localizar e ler o arquivo físico da Skill (Procedural Memory)
    const skillPath = path.join(__dirname, '..', '..', 'skills', skillId);
    if (!fs.existsSync(skillPath)) {
      throw new Error(`Arquivo da Habilidade não encontrado: ${skillPath}`);
    }

    let promptBody = readSkillPromptBody(skillPath);

    // Substituir placeholders do formulário no corpo da instrução da Skill
    if (inputs) {
      Object.keys(inputs).forEach(key => {
        const val = inputs[key] || '';
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        promptBody = promptBody.replace(regex, val);
      });
    }

    // 2. Instanciar a inteligência do Zéfiro
    const zefiro = new Zefiro(produtoId);

    // 3. Executar a Habilidade de forma unificada no respond
    const res = await zefiro.respond(promptBody, {
      agentProfile: { name: 'Zéfiro Engine', role: `Execução da Habilidade: ${skillId}` },
      tone,
      simpleLanguage,
      sessaoId: 'geracao_skill'
    });

    if (res.success) {
      return { success: true, result: res.reply };
    } else {
      return { success: false, error: res.error };
    }

  } catch (error) {
    console.error('Gateway executeSkill failed:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  handleChatStream,
  executeSkill
};
