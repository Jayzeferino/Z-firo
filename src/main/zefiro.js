const db = require('./db');
const memory = require('./memory');
const security = require('./security');
const llmops = require('./llmops');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

class Zefiro {
  constructor(produtoId) {
    this.produtoId = Number(produtoId);
    this.produto = db.getProdutos().find(p => p.id === this.produtoId);
    if (!this.produto) {
      throw new Error(`Produto com ID ${produtoId} não encontrado.`);
    }
  }

  // Monta as instruções do Sistema (System Prompt) com as restrições de tom e SOUL.md
  buildSystemPrompt(agentProfile, tone, simpleLanguage) {
    let prompt = '';

    // 1. Injetar a "Alma" do assistente vinda de SOUL.md
    try {
      const soulPath = path.join(__dirname, '..', '..', 'SOUL.md');
      if (fs.existsSync(soulPath)) {
        const soulContent = fs.readFileSync(soulPath, 'utf-8');
        prompt += `INSTRUÇÕES GERAIS DE PERSONALIDADE E COMPORTAMENTO (SOUL.md):\n${soulContent}\n\n`;
      }
    } catch (error) {
      console.error('Failed to read SOUL.md in buildSystemPrompt:', error);
    }

    prompt += `Você é ${agentProfile.name || 'Zéfiro'}, atuando como um especialista de marketing no papel de ${agentProfile.role || 'Assistente'}.\n`;
    
    if (agentProfile.system_prompt) {
      prompt += `Diretrizes do seu perfil:\n${agentProfile.system_prompt}\n\n`;
    }

    prompt += `INFORMAÇÕES DO PRODUTO DO USUÁRIO:\n`;
    prompt += `- Nome: ${this.produto.nome}\n`;
    prompt += `- Promessa Única: ${this.produto.promessa || 'A definir'}\n`;
    prompt += `- Dor Latente do Avatar: ${this.produto.dor_latente || 'A definir'}\n`;
    prompt += `- Avatar Detalhado: ${this.produto.avatar_details || 'A definir'}\n`;
    prompt += `- Mecanismo Único: ${this.produto.mecanismo_unico || 'A definir'}\n`;
    prompt += `- Objeções Comuns: ${this.produto.objecoes || 'A definir'}\n\n`;

    // Matriz de Tom (Tone Matrices)
    prompt += `DIRETRIZES DE ESTILO DE ESCRITA (TONE MATRIX):\n`;
    if (tone === 'persuasivo') {
      prompt += `- Use técnicas clássicas de escrita de vendas e copy de resposta direta.\n- Foco em benefícios claros, gatilhos de escassez e apelo forte à ação (CTA).\n`;
    } else if (tone === 'amigavel') {
      prompt += `- Use um tom leve, amigável e conversacional.\n- Perfeito para nichos "white", focando em conexões de longo prazo e relacionamento.\n`;
    } else if (tone === 'complacente') {
      prompt += `- Evite termos excessivamente fortes que possam violar as políticas do Facebook/Google Ads (compliance).\n- Linguagem persuasiva, porém suave e segura.\n`;
    } else if (tone === 'agressivo') {
      prompt += `- Foco em promessas muito fortes, urgência máxima e senso de perda iminente.\n- Estilo clássico de nicho black agressivo.\n`;
    } else if (tone === 'neutro') {
      prompt += `- Tom corporativo, direto, informativo e analítico.\n- Foco em B2B, estatísticas e relatórios de mercado.\n`;
    }

    // Chave de Linguagem Simples (para terceira idade, etc.)
    if (simpleLanguage) {
      prompt += `\nCRITICAL: Adapte a resposta para marcas cujo público final pertence à terceira idade.
- Remova termos complexos, estrangeirismos e anglicismos (ex: use "desempenho" em vez de "performance", "método" em vez de "framework", "ideia" em vez de "insights").
- Simplifique sentenças e seja altamente direto.\n`;
    }

    // Restrição de TOKEN e formatação inegociável
    prompt += `\nRESTRICÕES INEGOCIÁVEIS DE FORMATO:
- Vá direto ao ponto. Não dê saudações, preâmbulos, comentários introdutórios do tipo "Aqui está o que você pediu" ou agradecimentos.
- Não repita a pergunta do usuário e evite introduções amigáveis robotizadas. Economize tokens.\n`;

    return prompt;
  }

  // Executa um turno completo de IA: monta Working Memory -> executa loop de chamada -> salva e espelha em MD
  async respond(userMessage, options = {}) {
    const { agentProfile, chatHistory = [], tone = 'persuasivo', simpleLanguage = false, sessaoId = `session_${Date.now()}`, webContents, attachments = [] } = options;

    // 1. Retrieval Gate: Decidir se a rodada requer consulta ao SQLite FTS5 (BM25)
    let contextMemory = '';
    if (llmops.shouldRetrieve(userMessage, chatHistory)) {
      const matched = db.searchMemory(this.produtoId, userMessage);
      if (matched.facts && matched.facts.length > 0) {
        contextMemory += `\nFatos adicionais recuperados da memória:\n` + matched.facts.map(f => `- ${f.fato}`).join('\n');
      }
    }

    // 2. Montar Prompt de Sistema com chaves e memórias
    const systemPrompt = this.buildSystemPrompt(agentProfile, tone, simpleLanguage) + contextMemory;

    // 3. Iniciar trace de execução
    const trace = llmops.startTrace(userMessage, systemPrompt, 'Zefiro Engine', 'Auto-Select');

    // 4. Selecionar Provedor de IA ativo
    let provider = '';
    let apiKey = '';
    for (const prov of ['openai', 'groq', 'gemini', 'deepseek', 'openrouter']) {
      const key = security.getKey(prov);
      if (key) {
        provider = prov;
        apiKey = key;
        break;
      }
    }

    if (!provider) {
      const errorMsg = 'Erro: Nenhuma chave de API configurada no painel de configurações.';
      if (webContents) {
        webContents.send('chat:stream', errorMsg);
      }
      llmops.endTrace(trace, '', { prompt: 0, completion: 0 }, 'No API keys configured');
      return { success: false, error: 'No API keys configured' };
    }

    let finalResponseText = '';

    try {
      if (provider === 'openai') {
        const openai = new OpenAI({ apiKey });
        const userContent = [{ type: 'text', text: userMessage }];
        if (attachments && attachments.length > 0) {
          attachments.forEach(att => {
            if (att.mimeType.startsWith('image/')) {
              userContent.push({
                type: 'image_url',
                image_url: {
                  url: `data:${att.mimeType};base64,${att.data}`
                }
              });
            } else if (att.mimeType.startsWith('audio/')) {
              userContent.push({
                type: 'text',
                text: `[Áudio anexo: ${att.mimeType}]`
              });
            }
          });
        }

        const stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            ...chatHistory,
            { role: 'user', content: userContent.length === 1 ? userMessage : userContent }
          ],
          stream: true,
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            finalResponseText += text;
            if (webContents) webContents.send('chat:stream', text);
          }
        }
      } 
      else if (provider === 'groq') {
        const groq = new Groq({ apiKey });
        const stream = await groq.chat.completions.create({
          model: 'llama3-8b-8192',
          messages: [
            { role: 'system', content: systemPrompt },
            ...chatHistory,
            { role: 'user', content: userMessage }
          ],
          stream: true,
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            finalResponseText += text;
            if (webContents) webContents.send('chat:stream', text);
          }
        }
      } 
      else if (provider === 'gemini') {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const contents = [
          { role: 'user', parts: [{ text: `INSTRUÇÕES DO SISTEMA:\n${systemPrompt}` }] }
        ];
        chatHistory.forEach(h => {
          contents.push({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.content }] });
        });

        const userParts = [];
        if (attachments && attachments.length > 0) {
          attachments.forEach(att => {
            userParts.push({
              inlineData: {
                data: att.data,
                mimeType: att.mimeType
              }
            });
          });
        }
        userParts.push({ text: userMessage });
        contents.push({ role: 'user', parts: userParts });

        const result = await model.generateContentStream({ contents });
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            finalResponseText += text;
            if (webContents) webContents.send('chat:stream', text);
          }
        }
      } 
      else if (provider === 'deepseek') {
        const client = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com/v1' });
        const stream = await client.chat.completions.create({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            ...chatHistory,
            { role: 'user', content: userMessage }
          ],
          stream: true,
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            finalResponseText += text;
            if (webContents) webContents.send('chat:stream', text);
          }
        }
      }
      else if (provider === 'openrouter') {
        const client = new OpenAI({
          apiKey,
          baseURL: 'https://openrouter.ai/api/v1',
          defaultHeaders: {
            'HTTP-Referer': 'https://zefiro.ai',
            'X-Title': 'Zefiro'
          }
        });
        const userContent = [{ type: 'text', text: userMessage }];
        if (attachments && attachments.length > 0) {
          attachments.forEach(att => {
            if (att.mimeType.startsWith('image/')) {
              userContent.push({
                type: 'image_url',
                image_url: {
                  url: `data:${att.mimeType};base64,${att.data}`
                }
              });
            } else if (att.mimeType.startsWith('audio/')) {
              userContent.push({
                type: 'text',
                text: `[Áudio anexo: ${att.mimeType}]`
              });
            }
          });
        }

        const stream = await client.chat.completions.create({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            ...chatHistory,
            { role: 'user', content: userContent.length === 1 ? userMessage : userContent }
          ],
          stream: true,
        });

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || '';
          if (text) {
            finalResponseText += text;
            if (webContents) webContents.send('chat:stream', text);
          }
        }
      }

      // 5. Salvar no Banco de Dados (Episódios / Histórico)
      db.addEpisode(this.produtoId, sessaoId, userMessage, finalResponseText);

      // 6. Evals de Controle de Saída
      const evalResult = llmops.runDeterministicEvals(finalResponseText);
      if (!evalResult.passed) {
        console.warn('Trace gate warnings generated by output validation:', evalResult.reports);
      }

      // 7. Sincronizar o espelho físico de memória (.assistant/MEMORY.md)
      memory.regenerateMemoryFile(this.produtoId);

      // 8. Concluir o trace de execução
      llmops.endTrace(trace, finalResponseText);

      return { success: true, result: finalResponseText };

    } catch (error) {
      console.error('AI execution errored:', error);
      if (webContents) {
        webContents.send('chat:stream', `\n⚠️ Ocorreu um erro no processamento do modelo local: ${error.message}`);
      }
      llmops.endTrace(trace, finalResponseText, { prompt: 0, completion: 0 }, error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = Zefiro;
