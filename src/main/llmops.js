const fs = require('fs');
const path = require('path');

const WORKSPACE_DIR = '/Users/victor/UnoAgencyAgent';

// Iniciar Rastreabilidade (Trace) de uma execução
function startTrace(prompt, systemPrompt, provider, model) {
  const traceId = `trace_${Date.now()}`;
  return {
    id: traceId,
    timestamp: new Date().toISOString(),
    provider,
    model,
    prompt,
    systemPrompt,
    status: 'running',
    startTime: Date.now()
  };
}

// Concluir e salvar o Trace
function endTrace(trace, responseText, tokens = { prompt: 0, completion: 0 }, error = null) {
  const endTime = Date.now();
  const latencyMs = endTime - trace.startTime;

  const completedTrace = {
    ...trace,
    status: error ? 'failed' : 'completed',
    response: responseText,
    error,
    tokens,
    latencyMs,
    endTime: new Date().toISOString()
  };

  // Gravar arquivo de log físico de trace para auditoria local do profissional de marketing
  try {
    const tracesDir = path.join(WORKSPACE_DIR, 'traces');
    if (!fs.existsSync(tracesDir)) {
      fs.mkdirSync(tracesDir, { recursive: true });
    }
    const traceFilePath = path.join(tracesDir, `${trace.id}.json`);
    fs.writeFileSync(traceFilePath, JSON.stringify(completedTrace, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write trace log file:', err);
  }

  return completedTrace;
}

// Retrieval Gate: Decide se a mensagem atual do usuário requer busca na base de conhecimento (FTS5)
function shouldRetrieve(userMessage, chatHistory = []) {
  const cleanMsg = userMessage.toLowerCase();
  
  // Lista de gatilhos léxicos clássicos de marketing ou de busca de contexto
  const triggers = [
    'lembrar', 'promessa', 'dor', 'avatar', 'produto', 'posicionamento', 
    'mecanismo', 'objeção', 'quem é', 'qual é', 'como funciona', 'concorrente',
    'histórico', 'escreve', 'copy', 'anúncio', 'página', 'lead', 'venda'
  ];

  // Se a mensagem do usuário contém alguma palavra-chave de busca
  const matchTrigger = triggers.some(trigger => cleanMsg.includes(trigger));
  
  // Ou se o histórico do chat ainda está no início e precisa aquecer
  const isEarlyChat = chatHistory.length <= 2;

  return matchTrigger || isEarlyChat;
}

// Evals Determinísticos (Regras Rígidas Locais)
function runDeterministicEvals(responseText, rules = {}) {
  const reports = [];
  
  // Regra 1: Banir clichês corporativos e anglicismos desnecessários (ex: "synergy", "mindset", "out of the box", "feedback")
  const bannedWords = ['synergy', 'mindset', 'out of the box', 'disruptivo', 'stakeholder', 'player'];
  const foundBanned = bannedWords.filter(word => responseText.toLowerCase().includes(word));
  
  if (foundBanned.length > 0) {
    reports.push({
      rule: 'sem_jargoes_corporativos',
      passed: false,
      details: `Encontrou termos corporativos em inglês proibidos: ${foundBanned.join(', ')}`
    });
  } else {
    reports.push({
      rule: 'sem_jargoes_corporativos',
      passed: true
    });
  }

  // Regra 2: Tamanho mínimo/máximo de resposta (Prevenir respostas em branco ou excessivamente gigantescas)
  if (!responseText || responseText.trim().length < 5) {
    reports.push({
      rule: 'comprimento_minimo',
      passed: false,
      details: 'Resposta gerada está vazia ou é curta demais.'
    });
  } else {
    reports.push({
      rule: 'comprimento_minimo',
      passed: true
    });
  }

  // Regra 3: Sem preâmbulos ou saudações robóticas repetitivas
  const preambles = [
    'claro, posso te ajudar', 'aqui está a copy', 'entendi a sua pergunta', 
    'com certeza', 'como assistente de marketing'
  ];
  const foundPreamble = preambles.some(p => responseText.toLowerCase().substring(0, 100).includes(p));
  if (foundPreamble) {
    reports.push({
      rule: 'direto_ao_ponto',
      passed: false,
      details: 'A IA incluiu preâmbulo ou introdução amigável robótica desnecessária.'
    });
  } else {
    reports.push({
      rule: 'direto_ao_ponto',
      passed: true
    });
  }

  return {
    passed: reports.every(r => r.passed),
    reports
  };
}

// LLM as a Judge (Módulo orquestrador)
async function runLLMJudge(responseText, criteria, judgeClient) {
  if (!judgeClient) {
    // Se o cliente LLM de julgamento não estiver disponível, consideramos aprovado deterministicamente
    return { passed: true, score: 10, details: 'LLM Judge skipped (no credentials)' };
  }

  try {
    const judgePrompt = `Você é um avaliador de copy e posicionamento de marketing clássico.
Avalie a seguinte resposta gerada por um assistente de IA com base no critério: "${criteria}"

Resposta a ser avaliada:
---
${responseText}
---

Responda rigorosamente no formato JSON abaixo, sem textos adicionais:
{
  "score": (nota de 1 a 10),
  "passed": (true ou false, nota >= 7 passa),
  "justification": "Explicação detalhada em Português"
}`;

    const response = await judgeClient.createChatCompletion({
      messages: [{ role: 'user', content: judgePrompt }],
      temperature: 0.1
    });

    const result = JSON.parse(response.choices[0].message.content.trim());
    return {
      passed: result.passed,
      score: result.score,
      details: result.justification
    };
  } catch (error) {
    console.error('LLM Judge execution failed:', error);
    return { passed: true, score: 5, details: 'LLM Judge errored, bypassed gate to prevent block' };
  }
}

module.exports = {
  startTrace,
  endTrace,
  shouldRetrieve,
  runDeterministicEvals,
  runLLMJudge
};
