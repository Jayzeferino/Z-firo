import React from 'react';
import { translateRole } from '../utils/marketingUtils';

export default function RightPanel({
  agents,
  selectedAgent,
  setSelectedAgent,
  rightPanelExpanded,
  setRightPanelExpanded,
  centerView,
  setCenterView,
  produto
}) {
  if (!rightPanelExpanded) {
    return (
      <div className="w-12 border-l border-white/5 flex flex-col items-center py-4 bg-[#11131a] transition-all duration-300">
        <button
          onClick={() => setRightPanelExpanded(true)}
          className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all no-drag-region mb-6"
          title="Mostrar aba do AGENTES"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-indigo-400">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" />
            <line x1="15" y1="3" x2="15" y2="21" stroke="currentColor" />
          </svg>
        </button>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase origin-center rotate-90 whitespace-nowrap">
            🎨 AGENTES
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-l border-white/5 flex flex-col p-4 bg-[#11131a] overflow-y-auto custom-scrollbar transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white tracking-wide uppercase">AGENTES</h2>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 px-1.5 py-0.5 rounded font-bold">AGENTS</span>
          <button
            onClick={() => setRightPanelExpanded(false)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all no-drag-region"
            title="Esconder aba do AGENTES"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400 hover:text-white">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" />
              <line x1="15" y1="3" x2="15" y2="21" stroke="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      {/* Grid de Agentes (NotebookLM-like shortcut cards) */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {agents.map(a => {
          const isSelected = selectedAgent?.id === a.id && centerView === 'chat';
          return (
            <button
              key={a.id}
              onClick={() => { 
                if (isSelected) {
                  setSelectedAgent(null); 
                } else {
                  setSelectedAgent(a); 
                  setCenterView('chat'); 
                }
              }}
              title={isSelected ? "Clique para desativar esta ação" : `Ativar ${a.name} para realizar esta ação no próximo envio`}
              className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[85px] w-full min-w-0 no-drag-region ${isSelected ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-lg shadow-indigo-600/10 scale-[0.98]' : 'bg-slate-900/60 border-white/5 hover:border-white/10 hover:bg-white/5 text-slate-400 hover:-translate-y-0.5'}`}
            >
              <div className="flex items-start justify-between w-full min-w-0 mb-1">
                <span className="text-[10px] font-bold block truncate text-white leading-tight pr-1 flex-1 min-w-0">{a.name}</span>
                <span className="text-[9px] opacity-60 flex-shrink-0">{isSelected ? '⚡' : '→'}</span>
              </div>
              <span className="text-[8px] block opacity-75 mt-auto leading-normal line-clamp-2 min-w-0 break-words">{translateRole(a.role)}</span>
            </button>
          );
        })}
      </div>

      {/* Notes & Memory section (like NotebookLM notes) */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Notas & Conhecimento</span>
        <div className="space-y-2">

          {/* Note: Memory.md */}
          <div
            onClick={() => setCenterView('memory')}
            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between no-drag-region ${centerView === 'memory' ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-900/40 border-white/5 hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base text-amber-400">🧠</span>
              <div>
                <span className="text-xs font-bold text-white block">Espelho de Memória</span>
                <span className="text-[8px] text-slate-500 font-mono">MEMORY.md</span>
              </div>
            </div>
            <span className="text-xs text-slate-500">→</span>
          </div>

          {/* Note: SQLite DB */}
          <div
            onClick={() => setCenterView('db')}
            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between no-drag-region ${centerView === 'db' ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-900/40 border-white/5 hover:bg-white/5'}`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base text-cyan-400">🗄️</span>
              <div>
                <span className="text-xs font-bold text-white block">Banco SQLite</span>
                <span className="text-[8px] text-slate-500 font-mono">state.db (FTS5)</span>
              </div>
            </div>
            <span className="text-xs text-slate-500">→</span>
          </div>
        </div>
      </div>

      {/* Sincronizador de Habilidades */}
      <div className="mt-auto pt-4 flex flex-col gap-2">
        <button
          onClick={() => {
            alert("Para criar uma nova nota, edite diretamente o arquivo MEMORY.md ou utilize o chat com os agentes.");
          }}
          className="w-full bg-[#151722] hover:bg-[#1a1c29] text-white border border-white/5 rounded-xl py-2.5 text-[10px] font-bold transition-all flex items-center justify-center gap-1 shadow-sm no-drag-region"
        >
          <span>+ Adicionar nota</span>
        </button>
        <div className="text-center text-[8px] text-slate-500">
          Zéfiro Copilot v1.0.0
        </div>
      </div>
    </div>
  );
}
