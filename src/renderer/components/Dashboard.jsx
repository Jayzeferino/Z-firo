import React, { useState, useEffect, useRef } from 'react';
import Settings from './Settings';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import AgentWelcomeCard from './AgentWelcomeCard';
import { translateSkill, translateRole, CATEGORY_MAP } from '../utils/marketingUtils';

// Helper para converter Markdown simples em HTML
function renderSimpleMarkdown(md) {
  if (!md) return '';
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Títulos
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-xl font-bold text-white mt-4 mb-2">$1</h1>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-bold text-white mt-4 mb-2 border-b border-white/5 pb-1">$1</h2>');
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-bold text-white mt-3 mb-1">$1</h3>');

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
    return `<p class="mb-3 text-slate-300 text-xs leading-relaxed">${p}</p>`;
  }).join('\n');

  return html;
}

export default function Dashboard({ produto, onBack, isMaximized }) {
  const [centerView, setCenterView] = useState('chat'); // chat, skill, memory, db, settings
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
  const [skillsSearchQuery, setSkillsSearchQuery] = useState('');

  // Panel collapse states
  const [leftPanelExpanded, setLeftPanelExpanded] = useState(true);
  const [rightPanelExpanded, setRightPanelExpanded] = useState(true);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');

  // Multimodal attachments state
  const [attachments, setAttachments] = useState([]); // Array of { type: 'image' | 'audio', data: base64, mimeType: string, previewUrl: string }
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);
  const chatEndRef = useRef(null);

  // Carregar dados na inicialização
  useEffect(() => {
    loadSkillsAndAgents();
    loadMemoryData();
  }, [produto]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

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
      const facts = await window.api.getFacts(produto.id);
      const episodes = await window.api.getEpisodes(produto.id);
      setDbFacts(facts || []);
      setDbEpisodes(episodes || []);

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
    if ((!chatInput.trim() && attachments.length === 0) || isGenerating) return;

    const userMsg = {
      role: 'user',
      content: chatInput,
      date: new Date().toLocaleTimeString(),
      attachments: attachments.map(att => ({ type: att.type, previewUrl: att.previewUrl }))
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsGenerating(true);

    const assistantMsg = { role: 'assistant', content: '', date: new Date().toLocaleTimeString() };
    setChatMessages(prev => [...prev, assistantMsg]);

    const payloadAttachments = attachments.map(att => ({
      data: att.data,
      mimeType: att.mimeType
    }));

    setAttachments([]); // Limpar anexos enviados

    // Ponte para o Stream da IA
    if (window.api && window.api.sendChatMessage) {
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

      window.api.sendChatMessage({
        produtoId: produto.id,
        agentId: selectedAgent?.id,
        message: userMsg.content,
        chatHistory: chatMessages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        tone: toneMatrix,
        simpleLanguage,
        attachments: payloadAttachments
      });

      setTimeout(() => {
        unsubscribe();
        setIsGenerating(false);
        loadMemoryData(); // Recarrega para obter novas conversas no db
      }, 5000);
    } else {
      // Mock se fora do Electron
      setTimeout(() => {
        setChatMessages(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) {
            last.content = `Olá! Sou o ${selectedAgent?.name || 'Assistente'}. [Mock] Recebi seu input com ${payloadAttachments.length} anexo(s) em tom ${toneMatrix}.`;
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
        setCenterView('chat');
        setSelectedSkill(null);
        setSkillFormData({});
      } else {
        alert(`Erro ao gerar resultado: ${res?.error || 'Erro desconhecido'}`);
      }
      setIsGenerating(false);
      loadMemoryData();
    } else {
      setTimeout(() => {
        alert(`[Mock] Skill "${selectedSkill.name}" executada com tom ${toneMatrix}!`);
        setIsGenerating(false);
        setCenterView('chat');
        setSelectedSkill(null);
        setSkillFormData({});
        loadMemoryData();
      }, 1500);
    }
  };

  // Áudio - Gravar via Microfone (MediaRecorder)
  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1];
          setAttachments(prev => [
            ...prev,
            {
              type: 'audio',
              data: base64data,
              mimeType: 'audio/webm',
              previewUrl: URL.createObjectURL(blob)
            }
          ]);
        };
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Falha ao gravar áudio:', error);
      alert('Erro ao acessar o microfone. Por favor, forneça as permissões necessárias.');
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // Upload de Foto
  const triggerPhotoUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result.split(',')[1];
          setAttachments(prev => [
            ...prev,
            {
              type: 'image',
              data: base64,
              mimeType: file.type,
              previewUrl: reader.result
            }
          ]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  // Suporte para colar imagens diretamente no chat (Ctrl+V)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            setAttachments(prev => [
              ...prev,
              {
                type: 'image',
                data: base64,
                mimeType: file.type,
                previewUrl: reader.result
              }
            ]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  // Captura de Tela (Screenshot)
  const handleCaptureScreenshot = async () => {
    if (window.api && window.api.captureWindow) {
      const dataUrl = await window.api.captureWindow();
      if (dataUrl) {
        const base64data = dataUrl.split(',')[1];
        const mimeType = dataUrl.split(';')[0].split(':')[1] || 'image/png';
        setAttachments(prev => [
          ...prev,
          {
            type: 'image',
            data: base64data,
            mimeType,
            previewUrl: dataUrl
          }
        ]);
      } else {
        alert("Erro ao realizar captura de tela.");
      }
    } else {
      // Fallback desenvolvimento fora do Electron
      alert("[Mock] Captura de tela realizada!");
      const mockBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      setAttachments(prev => [
        ...prev,
        {
          type: 'image',
          data: mockBase64,
          mimeType: 'image/png',
          previewUrl: `data:image/png;base64,${mockBase64}`
        }
      ]);
    }
  };

  // Filtro de Skills
  const filteredSkills = skills.filter(sk => {
    const matchesSearch =
      sk.name.toLowerCase().includes(skillsSearchQuery.toLowerCase()) ||
      sk.description.toLowerCase().includes(skillsSearchQuery.toLowerCase()) ||
      (sk.category || '').toLowerCase().includes(skillsSearchQuery.toLowerCase());

    const matchesCategory =
      activeCategoryFilter === 'all' ||
      (sk.category || '').toLowerCase().trim() === activeCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`w-full h-full ${isMaximized ? 'max-w-none max-h-screen rounded-none' : 'max-w-7xl max-h-[92vh] rounded-3xl'} glass-panel glow-indigo-subtle flex flex-col overflow-hidden drag-region text-white`}>

      {/* Top Header Bar (Google NotebookLM Style) */}
      <div 
        onDoubleClick={() => {
          if (window.api && window.api.maximizeWindow) {
            window.api.maximizeWindow();
          }
        }}
        className="px-6 py-3 bg-[#11131a] border-b border-white/5 flex items-center justify-between no-drag-region cursor-default"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🍃</span>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Produto Ativo</span>
            <h1 className="text-sm font-bold text-white leading-tight flex items-center gap-1.5">
              <span>{produto?.avatar || '🚀'}</span>
              <span>{produto?.nome}</span>
            </h1>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 no-drag-region"
          >
            <span>+ Novo Produto</span>
          </button>

          <button
            onClick={() => setCenterView(centerView === 'settings' ? 'chat' : 'settings')}
            className={`flex items-center gap-1 px-3 py-1.5 border rounded-xl text-[10px] font-bold transition-all active:scale-95 no-drag-region ${centerView === 'settings' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'}`}
          >
            <span>Configurações</span>
            <span className="text-[7px] px-1 py-0.2 bg-indigo-500/30 text-indigo-300 rounded font-semibold">PRO</span>
          </button>

          <button
            onClick={() => {
              if (window.api && window.api.maximizeWindow) {
                window.api.maximizeWindow();
              }
            }}
            className="flex items-center justify-center p-1.5 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all active:scale-95 no-drag-region"
            title={isMaximized ? "Restaurar tamanho" : "Maximizar"}
          >
            {isMaximized ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 4v4H4M16 4v4h4M4 16h4v4M20 16h-4v4" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4M16 4h4v4M4 16v4h4M16 20h4v-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden no-drag-region bg-[#0e1015]">
        {/* COLUMN 1: Ferramentas / SKILLS (Left) */}
        <LeftPanel
          skills={skills}
          filteredSkills={filteredSkills}
          skillsSearchQuery={skillsSearchQuery}
          setSkillsSearchQuery={setSkillsSearchQuery}
          activeCategoryFilter={activeCategoryFilter}
          setActiveCategoryFilter={setActiveCategoryFilter}
          selectedSkill={selectedSkill}
          setSelectedSkill={setSelectedSkill}
          centerView={centerView}
          setCenterView={setCenterView}
          setSkillFormData={setSkillFormData}
          leftPanelExpanded={leftPanelExpanded}
          setLeftPanelExpanded={setLeftPanelExpanded}
          handleSyncSkills={handleSyncSkills}
        />

        {/* COLUMN 2: CONVERSA / VIEWER (Center, 50%) */}
        <div className="flex-1 flex flex-col bg-[#0e1015]">

          {/* Subheader do Meio (Dropdown de Tom de Voz) */}
          {(centerView === 'chat' || centerView === 'skill') && (
            <div className="px-6 py-2.5 bg-[#11131a]/40 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Tom de Voz:</span>
                  <select
                    value={toneMatrix}
                    onChange={(e) => setToneMatrix(e.target.value)}
                    className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="persuasivo">Resposta Direta Persuasiva</option>
                    <option value="amigavel">Conversacional Amigável</option>
                    <option value="complacente">Conformidade / Black Suave</option>
                    <option value="agressivo">Nicho Black Agressivo</option>
                    <option value="neutro">Neutro e Informativo</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="simple-lang"
                    checked={simpleLanguage}
                    onChange={(e) => setSimpleLanguage(e.target.checked)}
                    className="rounded border-white/10 bg-slate-900 text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                  />
                  <label htmlFor="simple-lang" className="text-xs text-slate-400 select-none cursor-pointer">Linguagem Simples</label>
                </div>
              </div>

              {centerView === 'chat' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Agente:</span>
                  <span className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 px-2 py-0.5 rounded-lg font-medium">
                    {selectedAgent ? `${selectedAgent.avatar} ${selectedAgent.name}` : 'Nenhum'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* MAIN CENTER PANEL VIEWS */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col justify-between">

            {/* VIEW: CHAT */}
            {centerView === 'chat' && (
              <div className="h-full flex flex-col justify-between">

                {/* Chat History */}
                {chatMessages.length === 0 ? (
                  <AgentWelcomeCard selectedAgent={selectedAgent} />
                ) : (
                  <div className="flex-1 space-y-4 mb-4 overflow-y-auto custom-scrollbar pr-2">
                    {chatMessages.map((msg, i) => {
                      const isUser = msg.role === 'user';
                      return (
                        <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                          <span className="text-[9px] text-slate-500 mb-1">
                            {msg.date} • {isUser ? 'Você' : selectedAgent?.name}
                          </span>
                          <div className={`p-3 rounded-2xl text-xs max-w-lg leading-relaxed ${isUser ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-[#151722] border border-white/5 text-slate-200 rounded-tl-none whitespace-pre-wrap shadow-md'}`}>
                            {msg.content || (
                              <span className="flex gap-1 items-center py-1">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                              </span>
                            )}

                            {/* Mostrar Anexos no Histórico */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="flex gap-2 mt-2 flex-wrap border-t border-white/10 pt-2">
                                {msg.attachments.map((att, idx) => (
                                  <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center">
                                    {att.type === 'image' ? (
                                      <img src={att.previewUrl} alt="Anexo" className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-xl">🎙️</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>
                )}

                {/* Multimodal Chat Input Area */}
                <div className="mt-auto flex flex-col bg-[#11131a] border border-white/10 rounded-2xl overflow-hidden shadow-lg">

                  {/* File/Media input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  {/* Preview de Anexos antes do envio */}
                  {attachments.length > 0 && (
                    <div className="flex gap-2 p-3 bg-black/30 border-b border-white/5 flex-wrap">
                      {attachments.map((att, index) => (
                        <div key={index} className="relative group w-14 h-14 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center bg-slate-900 shadow">
                          {att.type === 'image' ? (
                            <img src={att.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-[9px] text-indigo-400">
                              <span>🎙️ Áudio</span>
                              <span className="text-[7px] text-slate-500">Pronto</span>
                            </div>
                          )}
                          <button
                            onClick={() => {
                              setAttachments(prev => prev.filter((_, i) => i !== index));
                            }}
                            className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-red-600 text-white rounded-full p-0.5 text-[8px] transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input controls and box */}
                  <div className="flex items-center gap-2 p-2">

                    {/* Media buttons */}
                    <div className="flex items-center gap-1.5 px-2 border-r border-white/5">

                      {/* Microfone */}
                      <button
                        onClick={isRecording ? stopAudioRecording : startAudioRecording}
                        className={`p-2 rounded-xl text-sm transition-all hover:bg-white/5 ${isRecording ? 'text-red-500 animate-pulse bg-red-500/10' : 'text-slate-400 hover:text-white'}`}
                        title={isRecording ? `Gravando (${recordingTime}s) - Clique para parar` : 'Gravar áudio do microfone'}
                      >
                        🎙️
                      </button>

                      {/* Upload de Foto */}
                      <button
                        onClick={triggerPhotoUpload}
                        className="p-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-all"
                        title="Upload de foto"
                      >
                        🖼️
                      </button>

                    </div>

                    {/* Text Input */}
                    <input
                      type="text"
                      placeholder={isRecording ? `Gravando áudio... (${recordingTime}s)` : `Pergunte ao ${selectedAgent?.name || 'agente'}...`}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                      onPaste={handlePaste}
                      className="w-full bg-transparent text-white focus:outline-none px-3 py-2 text-xs placeholder-slate-500 disabled:opacity-50"
                      disabled={isGenerating || isRecording}
                    />

                    {/* Botão de Enviar */}
                    <button
                      onClick={handleSendChat}
                      disabled={isGenerating || isRecording || (!chatInput.trim() && attachments.length === 0)}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl p-2 text-xs font-semibold transition-colors flex items-center justify-center"
                    >
                      ➔
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW: EXECUTE SKILL FORM */}
            {centerView === 'skill' && selectedSkill && (
              <div className="max-w-xl flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => { setSelectedSkill(null); setCenterView('chat'); }}
                      className="text-xs text-indigo-400 hover:underline"
                    >
                      ← Voltar para Conversa
                    </button>
                  </div>

                  {(() => {
                    const translated = translateSkill(selectedSkill);
                    const cleanCat = CATEGORY_MAP[(selectedSkill.category || '').toLowerCase()] || selectedSkill.category;
                    return (
                      <>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                          Habilidade: {cleanCat}
                        </span>
                        <h3 className="text-lg font-bold text-white">{translated.name}</h3>
                        <p className="text-xs text-slate-400 mt-1 mb-6 leading-relaxed">{translated.description}</p>
                      </>
                    );
                  })()}

                  {/* Dynamic Inputs Form */}
                  <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 mb-6">
                    {(selectedSkill.inputs || []).map(input => (
                      <div key={input.name}>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">{input.label}</label>
                        {input.type === 'textarea' ? (
                          <textarea
                            placeholder={input.placeholder || ''}
                            value={skillFormData[input.name] || ''}
                            onChange={(e) => setSkillFormData({ ...skillFormData, [input.name]: e.target.value })}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors custom-scrollbar resize-none"
                            rows={3}
                          />
                        ) : (
                          <input
                            type="text"
                            placeholder={input.placeholder || ''}
                            value={skillFormData[input.name] || ''}
                            onChange={(e) => setSkillFormData({ ...skillFormData, [input.name]: e.target.value })}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleExecuteSkill}
                  disabled={isGenerating}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-3 rounded-xl text-xs font-bold transition-all w-full flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
                >
                  {isGenerating ? 'Processando IA...' : 'Gerar Resultado ✨'}
                </button>
              </div>
            )}

            {/* VIEW: MEMORY VIEWER */}
            {centerView === 'memory' && (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCenterView('chat')}
                      className="text-xs text-indigo-400 hover:underline mr-2"
                    >
                      ← Voltar
                    </button>
                    <h3 className="text-sm font-bold text-white">🧠 Espelho da Memória do Produto</h3>
                  </div>
                  <span className="text-[8px] text-slate-500 font-mono">produtos/{produto.nome.toLowerCase()}/.assistant/MEMORY.md</span>
                </div>
                <div
                  className="flex-1 p-6 rounded-2xl border border-white/5 bg-[#11131a] font-sans custom-scrollbar overflow-y-auto leading-relaxed shadow-inner"
                  dangerouslySetInnerHTML={{ __html: renderSimpleMarkdown(memoryContent) }}
                />
              </div>
            )}

            {/* VIEW: DATABASE VIEWER */}
            {centerView === 'db' && (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCenterView('chat')}
                      className="text-xs text-indigo-400 hover:underline mr-2"
                    >
                      ← Voltar
                    </button>
                    <h3 className="text-sm font-bold text-white">🗄️ Dados Estruturados (SQLite state.db)</h3>
                  </div>
                  <span className="text-[8px] text-slate-500 font-mono">SQLite (FTS5)</span>
                </div>

                {/* Busca FTS5 */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Pesquisar fatos ou diálogos via FTS5..."
                    value={dbSearchQuery}
                    onChange={(e) => setDbSearchQuery(e.target.value)}
                    className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                  {/* Tabela Facts */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tabela: facts (Memória Semântica)</h4>
                    <div className="border border-white/5 rounded-xl overflow-hidden bg-slate-900/40 text-xs">
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
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tabela: episodes (Histórico de Conversas)</h4>
                    <div className="border border-white/5 rounded-xl overflow-hidden bg-slate-900/40 text-xs">
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

            {/* VIEW: SETTINGS */}
            {centerView === 'settings' && (
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => setCenterView('chat')}
                      className="text-xs text-indigo-400 hover:underline mr-2"
                    >
                      ← Voltar para Conversa
                    </button>
                  </div>
                  <Settings />
                </div>
              </div>
            )}

          </div>
        </div>

        {/* COLUMN 3: AGENTES / AGENTES (Right) */}
        <RightPanel
          agents={agents}
          selectedAgent={selectedAgent}
          setSelectedAgent={setSelectedAgent}
          rightPanelExpanded={rightPanelExpanded}
          setRightPanelExpanded={setRightPanelExpanded}
          centerView={centerView}
          setCenterView={setCenterView}
          produto={produto}
        />

      </div>

    </div>
  );
}
