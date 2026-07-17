import React from 'react';
import { translateSkill, CATEGORY_MAP } from '../utils/marketingUtils';

export default function LeftPanel({
  skills,
  filteredSkills,
  skillsSearchQuery,
  setSkillsSearchQuery,
  activeCategoryFilter,
  setActiveCategoryFilter,
  selectedSkill,
  setSelectedSkill,
  centerView,
  setCenterView,
  setSkillFormData,
  leftPanelExpanded,
  setLeftPanelExpanded,
  handleSyncSkills
}) {
  if (!leftPanelExpanded) {
    return (
      <div className="w-12 border-r border-white/5 flex flex-col items-center py-4 bg-[#11131a] transition-all duration-300">
        <button
          onClick={() => setLeftPanelExpanded(true)}
          className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all no-drag-region mb-6"
          title="Mostrar aba de Fontes"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-indigo-400">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" />
            <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" />
          </svg>
        </button>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase origin-center -rotate-90 whitespace-nowrap">
            ⚡ Habilidades
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-white/5 flex flex-col p-4 bg-[#11131a] transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-white tracking-wide uppercase">Fontes</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncSkills}
            title="Sincronizar habilidades"
            className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white transition-all text-xs no-drag-region"
          >
            🔄
          </button>
          <button
            onClick={() => setLeftPanelExpanded(false)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all no-drag-region"
            title="Esconder aba de Fontes"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400 hover:text-white">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" />
              <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      <button
        onClick={() => { setSelectedSkill(null); setCenterView('chat'); }}
        className="w-full mb-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-2.5 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-1 no-drag-region"
      >
        <span>+ Adicionar Ferramentas</span>
      </button>

      {/* Search bar */}
      <div className="mb-3">
        <div className="flex items-center bg-slate-900 border border-white/5 rounded-xl px-3 py-2">
          <span className="text-xs mr-2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Pesquisar habilidades (ferramentas)..."
            value={skillsSearchQuery}
            onChange={(e) => setSkillsSearchQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-2 mb-3 -mx-1 px-1 whitespace-nowrap no-drag-region">
        <button
          onClick={() => setActiveCategoryFilter('all')}
          className={`px-2 py-0.5 rounded-lg text-[8px] font-bold transition-all border ${activeCategoryFilter === 'all' ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'}`}
        >
          Todas
        </button>
        {Object.keys(CATEGORY_MAP).map(key => {
          const label = CATEGORY_MAP[key];
          const count = skills.filter(sk => (sk.category || '').toLowerCase() === key).length;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setActiveCategoryFilter(key)}
              className={`px-2 py-0.5 rounded-lg text-[8px] font-bold transition-all border ${activeCategoryFilter === key ? 'bg-indigo-600 border-indigo-500 text-white shadow-md' : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'}`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Habilidades List Grouped by Category */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-4">
        {filteredSkills.length === 0 ? (
          <div className="text-center py-8 text-[11px] text-slate-500 border border-dashed border-white/5 rounded-2xl">
            Nenhuma Skill correspondente encontrada.
          </div>
        ) : (
          (() => {
            const groups = {};
            filteredSkills.forEach(sk => {
              const rawCat = sk.category || 'Geral';
              const cleanCat = CATEGORY_MAP[rawCat.toLowerCase()] || rawCat;
              if (!groups[cleanCat]) {
                groups[cleanCat] = [];
              }
              groups[cleanCat].push(sk);
            });

            return Object.keys(groups).map(catName => (
              <div key={catName} className="mb-4">
                <div className="flex items-center justify-between mb-2 px-1 border-b border-white/5 pb-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{catName}</span>
                  <span className="text-[8px] bg-white/5 text-slate-400 px-1.5 py-0.2 rounded font-mono font-bold">
                    {groups[catName].length}
                  </span>
                </div>
                <div className="space-y-2">
                  {groups[catName].map(sk => {
                    const translated = translateSkill(sk);
                    const isSelected = selectedSkill?.id === sk.id && centerView === 'skill';
                    const inputsText = "Texto";
                    const acceptsPhoto = ['ad-creative', 'paid-advertising', 'page-cro', 'copy-editing', 'analytics'].some(kw => sk.id.toLowerCase().includes(kw));
                    const acceptsAudio = ['copywriting', 'offers', 'email-sequence', 'content'].some(kw => sk.id.toLowerCase().includes(kw));

                    return (
                      <div
                        key={sk.id}
                        onClick={() => { setSelectedSkill(sk); setCenterView('skill'); setSkillFormData({}); }}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${isSelected ? 'bg-indigo-600/15 border-indigo-500/50 shadow-md shadow-indigo-600/5' : 'bg-[#151722]/50 border-white/5 hover:border-indigo-500/20 hover:bg-[#151722]'}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-base mt-0.5">📄</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-white text-xs truncate leading-snug">{translated.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{translated.description}</p>

                            {/* Tags de Inputs Aceitos */}
                            <div className="flex gap-1.5 mt-2.5 flex-wrap">
                              <span className="text-[8px] font-semibold bg-slate-900 border border-white/10 text-slate-300 px-1.5 py-0.5 rounded">
                                📝 {inputsText}
                              </span>
                              {acceptsPhoto && (
                                <span className="text-[8px] font-semibold bg-indigo-950 border border-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded">
                                  🖼️ Foto
                                </span>
                              )}
                              {acceptsAudio && (
                                <span className="text-[8px] font-semibold bg-violet-950 border border-violet-500/30 text-violet-300 px-1.5 py-0.5 rounded">
                                  🎙️ Áudio
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()
        )}
      </div>
    </div>
  );
}
