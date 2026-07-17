import React, { useState, useEffect } from 'react';
import Settings from './Settings';

// Helper para converter Markdown simples em HTML
function renderSimpleMarkdown(md) {
  if (!md) return '';
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Títulos
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-white mt-4 mb-2">$1</h1>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mt-4 mb-2 border-b border-white/5 pb-1">$1</h2>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-white mt-3 mb-1">$1</h3>');
  
  // Negrito
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  
  // Itálico
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  
  // Listas
  html = html.replace(/^\- (.*$)/gim, '<li class="ml-4 list-disc text-slate-300">$1</li>');
  
  // Parágrafos e quebras de linha
  html = html.split('\n\n').map(p => {
    if (p.trim().startsWith('<h') || p.trim().startsWith('<li') || p.trim().startsWith('<ul')) {
      return p;
    }
    return `<p class="mb-3 text-slate-300 text-sm leading-relaxed">${p}</p>`;
  }).join('\n');
  
  return html;
}

export default function Dashboard({ produto, onBack }) {
  const [activeTab, setActiveTab] = useState('chat'); // chat, skills, memory, db, settings
  const [skills, setSkills] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [skillFormData, setSkillFormData] = useState({});
  const [toneMatrix, setToneMatrix] = useState('persuasivo');
  const [simpleLanguage, setSimpleLanguage] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Dados de Memória e Database
  const [memoryContent, setMemoryContent] = useState('');
  const [dbFacts, setDbFacts] = useState([]);
  const [dbEpisodes, setDbEpisodes] = useState([]);
  const [dbSearchQuery, setDbSearchQuery] = useState('');

  // Carregar dados na inicialização
  useEffect(() => {
    loadSkillsAndAgents();
    loadMemoryData();
  }, [produto]);

  const loadSkillsAndAgents = async () => {
    if (window.api) {
      const allSkills = await window.api.getSkills();
      const allAgents = await window.api.getAgents();
      setSkills(allSkills || []);
      setAgents(allAgents || []);
      if (allAgents && allAgents.length > 0) {
        setSelectedAgent(allAgents[0]); // Seleciona o primeiro agente por padrão
      }
    }
  };

  const loadMemoryData = async () => {
    if (window.api) {
      // 1. Carregar fatos e episódios do SQLite
      const facts = await window.api.getFacts(produto.id);
      const episodes = await window.api.getEpisodes(produto.id);
      setDbFacts(facts || []);
      setDbEpisodes(episodes || []);

      // 2. Carregar arquivo MEMORY.md físico
      const mdContent = await window.api.readMemoryFile(produto.nome);
      setMemoryContent(mdContent || '# Memória não sincronizada ou vazia.');
    }
  };

  const handleSyncSkills = async () => {
    if (window.api && window.api.syncSkills) {
      const res = await window.api.syncSkills();
      if (res && res.success) {
        setSkills(res.skills || []);
        setAgents(res.agents || []);
        alert('Habilidades e Agentes sincronizados com sucesso!');
      }
    }
  };

  // Enviar prompt do chat
  const handleSendChat = async () => {
    if (!chatInput.trim() || isGenerating) return;

    const userMsg = { role: 'user', content: chatInput, date: new Date().toLocaleTimeString() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsGenerating(true);

    const assistantMsg = { role: 'assistant', content: '', date: new Date().toLocaleTimeString() };
    setChatMessages(prev => [...prev, assistantMsg]);

    // Ponte para o Stream da IA
    if (window.api && window.api.sendChatMessage) {
      // Preparar cancelamento de stream anterior se houver
      const unsubscribe = window.api.onChatStream((chunk) => {
        setChatMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === 'assistant') {
            last.content += chunk;
          }
          return updated;
        });
      });

      // Simulação ou chamada real
      window.api.sendChatMessage({
        produtoId: produto.id,
        agentId: selectedAgent?.id,
        message: userMsg.content,
        chatHistory: chatMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        tone: toneMatrix,
        simpleLanguage
      });

      // Para fechar o listener no final
      setTimeout(() => {
        unsubscribe();
        setIsGenerating(false);
        loadMemoryData(); // Recarrega para obter novas conversas no db
      }, 5000); // Exemplo de tempo limite ou aguardar o evento de fim
    } else {
      // Mock se fora do Electron
      setTimeout(() => {
        setChatMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) {
            last.content = `Olá! Sou o ${selectedAgent?.name || 'Assistente'}. Em ambiente fora do Electron, estou simulando o alinhamento em tom ${toneMatrix}. ${simpleLanguage ? 'Estou escrevendo sem termos difíceis em inglês.' : ''}`;
          }
          return updated;
        });
        setIsGenerating(false);
      }, 1500);
    }
  };

  // Executar uma Habilidade (Skill)
  const handleExecuteSkill = async () => {
    if (!selectedSkill) return;
    setIsGenerating(true);

    if (window.api && window.api.runSkill) {
      const res = await window.api.runSkill({
        produtoId: produto.id,
        skillId: selectedSkill.id,
        inputs: skillFormData,
        tone: toneMatrix,
        simpleLanguage
      });

      if (res && res.success) {
        alert(`Resultado Gerado pela Habilidade:\n\n${res.result}`);
        setSelectedSkill(null);
        setSkillFormData({});
      } else {
        alert(`Erro ao gerar resultado: ${res?.error || 'Erro desconhecido'}`);
      }
      setIsGenerating(false);
      loadMemoryData();
    } else {
      // Mock se fora do Electron
      setTimeout(() => {
        alert(`[Mock] Skill "${selectedSkill.name}" executada com tom ${toneMatrix}!`);
        setIsGenerating(false);
        setSelectedSkill(null);
        setSkillFormData({});
        loadMemoryData();
      }, 1500);
    }
  };


  return (
    <div className="w-full h-full max-w-6xl max-h-[85vh] glass-panel glow-indigo rounded-2xl flex overflow-hidden drag-region">
      
      {/* Sidebar */}
      <div className="w-64 bg-slate-950/40 border-r border-white/5 flex flex-col no-drag-region">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl mr-2">{produto?.avatar}</span>
            <span className="font-semibold text-sm truncate max-w-[120px] text-white">{produto?.nome}</span>
          </div>
          <button 
            onClick={onBack}
            className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5 border border-white/10 transition-colors"
          >
            Voltar
          </button>
        </div>

        {/* Abas */}
        <div className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar">
          <button 
            onClick={() => { setActiveTab('chat'); setSelectedSkill(null); }}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'chat' ? 'bg-indigo-600/30 border border-indigo-500/25 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            💬 Chat com Agentes
          </button>
          
          <button 
            onClick={() => { setActiveTab('skills'); setSelectedSkill(null); }}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'skills' ? 'bg-indigo-600/30 border border-indigo-500/25 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            ⚡ Habilidades de Marketing
          </button>
          
          <button 
            onClick={() => { setActiveTab('memory'); loadMemoryData(); }}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'memory' ? 'bg-indigo-600/30 border border-indigo-500/25 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            🧠 Memória (MEMORY.md)
          </button>
          
          <button 
            onClick={() => { setActiveTab('db'); loadMemoryData(); }}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'db' ? 'bg-indigo-600/30 border border-indigo-500/25 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            🗄️ Banco de Dados (state.db)
          </button>
          
          <button 
            onClick={() => { setActiveTab('settings'); setSelectedSkill(null); }}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'settings' ? 'bg-indigo-600/30 border border-indigo-500/25 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            ⚙️ Configurações (BYOK)
          </button>
        </div>

        {/* Sync Button */}
        <div className="p-3 border-t border-white/5 flex flex-col gap-2">
          <button
            onClick={handleSyncSkills}
            className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg py-2 text-[10px] font-semibold transition-all"
          >
            🔄 Sincronizar Habilidades
          </button>
          <div className="text-center text-[9px] text-slate-500">
            Zéfiro local marketing copilot v1.0.0
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-slate-900/10 no-drag-region overflow-hidden">
        
        {/* Top Control Bar (Common for Chat & Skills) */}
        {(activeTab === 'chat' || (activeTab === 'skills' && selectedSkill)) && (
          <div className="px-6 py-3 bg-white/5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Tone Matrix</label>
                <select
                  value={toneMatrix}
                  onChange={(e) => setToneMatrix(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="persuasivo">Resposta Direta Persuasiva</option>
                  <option value="amigavel">Conversacional Amigável</option>
                  <option value="complacente">Conformidade / Black Suave</option>
                  <option value="agressivo">Nicho Black Agressivo</option>
                  <option value="neutro">Neutro e Informativo</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="simple-lang"
                  checked={simpleLanguage}
                  onChange={(e) => setSimpleLanguage(e.target.checked)}
                  className="rounded border-white/10 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="simple-lang" className="text-xs text-slate-400 select-none cursor-pointer">Linguagem Simples</label>
              </div>
            </div>
            
            {activeTab === 'chat' && (
              <div className="flex items-center gap-2">
                <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Agente:</label>
                <select
                  value={selectedAgent?.id || ''}
                  onChange={(e) => setSelectedAgent(agents.find(a => a.id === e.target.value))}
                  className="bg-slate-950 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.avatar} {a.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          
          {/* TAB: CHAT */}
          {activeTab === 'chat' && (
            <div className="h-full flex flex-col justify-between">
              {chatMessages.length === 0 ? (
                <div className="text-center my-auto p-6 max-w-md mx-auto">
                  <span className="text-4xl block mb-4">{selectedAgent?.avatar || '🤖'}</span>
                  <h4 className="font-bold text-white text-base">Conversar com {selectedAgent?.name || 'Agente'}</h4>
                  <p className="text-slate-400 text-xs mt-2">
                    Ele assume o papel de **{selectedAgent?.role}** e lerá as memórias de posicionamento do seu produto para dar respostas ultra direcionadas e diretas.
                  </p>
                </div>
              ) : (
                <div className="flex-1 space-y-4 mb-4 overflow-y-auto custom-scrollbar pr-2">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] text-slate-500 mb-1">{msg.date} • {msg.role === 'user' ? 'Você' : selectedAgent?.name}</span>
                      <div className={`p-3 rounded-xl text-xs max-w-lg leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-none whitespace-pre-wrap'}`}>
                        {msg.content || (
                          <span className="flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2 mt-auto">
                <input
                  type="text"
                  placeholder={`Pergunte ao ${selectedAgent?.name || 'agente'}...`}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  className="w-full bg-transparent text-white focus:outline-none px-3 py-1.5 text-xs placeholder-slate-400"
                  disabled={isGenerating}
                />
                <button
                  onClick={handleSendChat}
                  disabled={isGenerating || !chatInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                >
                  Enviar
                </button>
              </div>
            </div>
          )}

          {/* TAB: SKILLS LIST */}
          {activeTab === 'skills' && !selectedSkill && (
            <div>
              <h3 className="text-base font-bold text-white mb-4">Habilidades de Copywriting e Vendas</h3>
              {skills.length === 0 ? (
                <div className="text-center p-6 border border-dashed border-white/10 rounded-2xl text-xs text-slate-400">
                  Nenhuma Skill encontrada na pasta `/skills`. Certifique-se de adicionar arquivos `SKILL.md` lá.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {skills.map(sk => (
                    <div 
                      key={sk.id}
                      onClick={() => { setSelectedSkill(sk); setSkillFormData({}); }}
                      className="p-4 rounded-xl border border-white/5 bg-white/5 hover:border-indigo-500/30 hover:bg-white/10 transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase block mb-1">{sk.category}</span>
                        <h4 className="font-bold text-white text-sm">{sk.name}</h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{sk.description}</p>
                      </div>
                      <span className="text-[10px] text-indigo-400 font-semibold mt-4 align-self-end">Executar Habilidade →</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: RUN SKILL FORM */}
          {activeTab === 'skills' && selectedSkill && (
            <div className="max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <button 
                  onClick={() => setSelectedSkill(null)}
                  className="text-xs text-indigo-400 hover:underline"
                >
                  ← Voltar para lista
                </button>
              </div>
              <h3 className="text-base font-bold text-white">{selectedSkill.name}</h3>
              <p className="text-xs text-slate-400 mt-1 mb-6">{selectedSkill.description}</p>

              {/* Dynamic Inputs Form */}
              <div className="space-y-4 mb-6">
                {(selectedSkill.inputs || []).map(input => (
                  <div key={input.name}>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">{input.label}</label>
                    {input.type === 'textarea' ? (
                      <textarea
                        placeholder={input.placeholder || ''}
                        value={skillFormData[input.name] || ''}
                        onChange={(e) => setSkillFormData({ ...skillFormData, [input.name]: e.target.value })}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                        rows={3}
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder={input.placeholder || ''}
                        value={skillFormData[input.name] || ''}
                        onChange={(e) => setSkillFormData({ ...skillFormData, [input.name]: e.target.value })}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleExecuteSkill}
                disabled={isGenerating}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-xs font-bold transition-all w-full flex items-center justify-center gap-2"
              >
                {isGenerating ? 'Processando IA...' : 'Gerar Resultado ✨'}
              </button>
            </div>
          )}

          {/* TAB: MEMORY VIEWER */}
          {activeTab === 'memory' && (
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <h3 className="text-base font-bold text-white">🧠 Espelho da Memória do Produto</h3>
                <span className="text-[10px] text-slate-500 font-mono">Caminho: produtos/{produto.nome.toLowerCase()}/.assistant/MEMORY.md</span>
              </div>
              <div 
                className="p-6 rounded-xl border border-white/5 bg-slate-950/30 font-sans custom-scrollbar leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(memoryContent) }}
              />
            </div>
          )}

          {/* TAB: DATABASE VIEWER */}
          {activeTab === 'db' && (
            <div>
              <h3 className="text-base font-bold text-white mb-2">🗄️ Dados Estruturados (SQLite state.db)</h3>
              <p className="text-xs text-slate-400 mb-6">
                Consulte diretamente as tabelas indexadas que alimentam a memória léxica FTS5 do assistente.
              </p>

              {/* Busca FTS5 */}
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  placeholder="Pesquisar fatos ou diálogos via FTS5..."
                  value={dbSearchQuery}
                  onChange={(e) => setDbSearchQuery(e.target.value)}
                  className="flex-1 bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-6">
                {/* Tabela Facts */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tabela: facts (Memória Semântica)</h4>
                  <div className="border border-white/5 rounded-xl overflow-hidden bg-slate-950/40 text-xs">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-white/5 text-slate-400 text-left">
                          <th className="p-3 font-semibold border-b border-white/5">ID</th>
                          <th className="p-3 font-semibold border-b border-white/5">Fato Consolidado</th>
                          <th className="p-3 font-semibold border-b border-white/5">Data</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbFacts
                          .filter(f => !dbSearchQuery || f.fato.toLowerCase().includes(dbSearchQuery.toLowerCase()))
                          .map(f => (
                            <tr key={f.id} className="border-b border-white/5 hover:bg-white/5">
                              <td className="p-3 text-slate-500">{f.id}</td>
                              <td className="p-3 text-slate-200">{f.fato}</td>
                              <td className="p-3 text-slate-400">{new Date(f.data_criacao).toLocaleDateString()}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tabela Episodes */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tabela: episodes (Histórico de Conversas)</h4>
                  <div className="border border-white/5 rounded-xl overflow-hidden bg-slate-950/40 text-xs">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-white/5 text-slate-400 text-left">
                          <th className="p-3 font-semibold border-b border-white/5">ID</th>
                          <th className="p-3 font-semibold border-b border-white/5">Sessão</th>
                          <th className="p-3 font-semibold border-b border-white/5">Entrada Usuário</th>
                          <th className="p-3 font-semibold border-b border-white/5">Resposta IA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dbEpisodes
                          .filter(e => !dbSearchQuery || e.input_usuario.toLowerCase().includes(dbSearchQuery.toLowerCase()) || e.resposta_ia.toLowerCase().includes(dbSearchQuery.toLowerCase()))
                          .map(e => (
                            <tr key={e.id} className="border-b border-white/5 hover:bg-white/5">
                              <td className="p-3 text-slate-500">{e.id}</td>
                              <td className="p-3 font-mono text-slate-400">{e.sessao_id.substring(0, 8)}</td>
                              <td className="p-3 text-slate-200 truncate max-w-xs">{e.input_usuario}</td>
                              <td className="p-3 text-slate-300 truncate max-w-xs">{e.resposta_ia}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && <Settings />}

        </div>
      </div>
    </div>
  );
}
