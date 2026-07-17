import React, { useState, useEffect } from 'react';

export default function Settings() {
  const [keys, setKeys] = useState({
    openai: '',
    gemini: '',
    groq: '',
    deepseek: '',
    openrouter: ''
  });
  const [status, setStatus] = useState('');

  // Carregar chaves salvas (mas não expor o valor real completo na UI por segurança, apenas mostrar se está configurado ou vazio)
  useEffect(() => {
    const loadKeysStatus = async () => {
      if (window.api && window.api.getApiKey) {
        const loadedKeys = {};
        for (const provider of ['openai', 'gemini', 'groq', 'deepseek', 'openrouter']) {
          const key = await window.api.getApiKey(provider);
          loadedKeys[provider] = key ? '••••••••••••••••••••' : '';
        }
        setKeys(loadedKeys);
      }
    };
    loadKeysStatus();
  }, []);

  const handleSave = async (provider) => {
    if (window.api && window.api.saveApiKey) {
      const keyToSave = keys[provider] === '••••••••••••••••••••' ? null : keys[provider];
      
      // Se não houver alteração (continua oculto), não salvamos por cima
      if (keyToSave === null) {
        setStatus(`Chave ${provider.toUpperCase()} não foi alterada.`);
        setTimeout(() => setStatus(''), 3000);
        return;
      }

      const success = await window.api.saveApiKey(provider, keyToSave);
      if (success) {
        setStatus(`Chave de API do ${provider.toUpperCase()} salva com sucesso!`);
        setKeys(prev => ({
          ...prev,
          [provider]: keyToSave ? '••••••••••••••••••••' : ''
        }));
      } else {
        setStatus(`Erro ao salvar chave do ${provider.toUpperCase()}.`);
      }
      setTimeout(() => setStatus(''), 3000);
    }
  };

  return (
    <div className="max-w-2xl">
      <h3 className="text-xl font-bold text-white mb-2">Configurações do Provedor de IA (BYOK)</h3>
      <p className="text-sm text-slate-400 mb-6">
        Insira suas credenciais de API privadas. Suas chaves serão criptografadas localmente via sistema operacional e não serão transmitidas para nenhum servidor externo.
      </p>

      {status && (
        <div className="mb-4 p-3 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-xs text-indigo-300">
          {status}
        </div>
      )}

      <div className="space-y-6">
        {[
          { id: 'openai', name: 'OpenAI API Key', placeholder: 'sk-proj-...' },
          { id: 'gemini', name: 'Google Gemini API Key', placeholder: 'AIzaSy...' },
          { id: 'groq', name: 'Groq API Key', placeholder: 'gsk_...' },
          { id: 'deepseek', name: 'DeepSeek API Key', placeholder: 'sk-...' },
          { id: 'openrouter', name: 'OpenRouter API Key', placeholder: 'sk-or-v1-...' },
        ].map(provider => (
          <div key={provider.id} className="p-4 rounded-xl border border-white/5 bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{provider.name}</label>
              <input
                type="password"
                placeholder={provider.placeholder}
                value={keys[provider.id]}
                onChange={(e) => setKeys({ ...keys, [provider.id]: e.target.value })}
                className="w-full bg-slate-950/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => handleSave(provider.id)}
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
              >
                Salvar Chave
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
