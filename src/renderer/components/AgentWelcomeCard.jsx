import React from 'react';
import { translateRole, translateSkill, parseAgentDetails } from '../utils/marketingUtils';

export default function AgentWelcomeCard({ selectedAgent }) {
  const details = parseAgentDetails(selectedAgent);
  if (!details) return null;

  const translatedNeeds = details.needs.map(n => {
    const dummySkill = { id: n, name: n, description: '' };
    const translated = translateSkill(dummySkill);
    return translated ? translated.name : n;
  });

  return (
    <div className="my-auto p-6 max-w-xl mx-auto bg-slate-900/60 border border-white/5 rounded-2xl shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-3.5 mb-5 border-b border-white/5 pb-4">
        <span className="text-4xl p-2.5 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">{selectedAgent?.avatar || '🤖'}</span>
        <div>
          <span className="text-[9px] font-mono text-indigo-400 uppercase tracking-widest block mb-0.5">Agente Ativo</span>
          <h4 className="font-bold text-white text-base leading-none">{selectedAgent?.name || 'Agente'}</h4>
          <span className="text-[10px] text-slate-400 mt-1 block font-medium">{translateRole(selectedAgent?.role)}</span>
        </div>
      </div>

      <div className="space-y-4 text-xs text-left">
        <div>
          <span className="font-bold text-slate-300 block mb-1">🎯 Para que serve:</span>
          <p className="text-slate-400 leading-relaxed text-[11px] bg-white/2 px-3 py-2 rounded-xl border border-white/5">
            {details.servesFor}
          </p>
        </div>
        <div>
          <span className="font-bold text-slate-300 block mb-1">⚡ O que ela faz:</span>
          <p className="text-slate-400 leading-relaxed text-[11px] bg-white/2 px-3 py-2 rounded-xl border border-white/5">
            {details.whatItDoes}
          </p>
        </div>
        <div>
          <span className="font-bold text-slate-300 block mb-1.5">🛠️ Habilidades ativadas (O que precisa):</span>
          <div className="flex flex-wrap gap-1.5">
            {translatedNeeds.map((need, idx) => (
              <span key={idx} className="text-[9px] font-semibold bg-indigo-950 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-lg shadow-sm">
                {need}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
