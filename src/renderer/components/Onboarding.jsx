import React, { useState } from 'react';

const STEPS = [
  {
    key: 'nome',
    question: 'Para começar, qual é o nome do produto ou infoproduto que vamos promover?',
    placeholder: 'Ex: Método Copiloto de Marketing, Mentoria High Ticket, etc.',
    description: 'Este nome será usado para organizar todas as suas habilidades, copys e agentes.'
  },
  {
    key: 'promessa',
    question: 'Qual é a Promessa Única de Valor (a transformação principal) do seu produto?',
    placeholder: 'Ex: Fature R$ 10k em 30 dias trabalhando apenas 2 horas por dia com IA.',
    description: 'O que o seu cliente ganha de forma tangível ao comprar o seu produto.'
  },
  {
    key: 'dor_latente',
    question: 'Qual é a maior Dor Latente do seu público-alvo (o que tira o sono deles)?',
    placeholder: 'Ex: Falta de tempo para criar conteúdo consistente ou medo de ser ultrapassado pela concorrência.',
    description: 'A dor emocional profunda que faz a pessoa querer comprar uma solução imediatamente.'
  },
  {
    key: 'avatar_details',
    question: 'Descreva em detalhes quem é o seu Avatar (Perfil do cliente ideal)?',
    placeholder: 'Ex: Profissionais liberais, entre 30 e 45 anos, que trabalham por conta própria mas não entendem de marketing.',
    description: 'Idade, ocupação, nível de conhecimento, frustrações e desejos.'
  },
  {
    key: 'mecanismo_unico',
    question: 'Qual é o Mecanismo Único do seu produto? Como ele resolve a dor de forma inovadora?',
    placeholder: 'Ex: O método 3S de automação de fluxo de funis utilizando agentes locais de inteligência artificial.',
    description: 'O método, tecnologia ou técnica secreta que torna a sua promessa crível e única no mercado.'
  },
  {
    key: 'objecoes',
    question: 'Quais são as principais Objeções de Compra que os seus leads costumam dar?',
    placeholder: 'Ex: "Não tenho tempo", "Não sei se serve para o meu nicho", "Achei caro".',
    description: 'As barreiras mentais que impedem os leads de comprar na página de vendas.'
  }
];

export default function Onboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    nome: '',
    avatar: '🚀',
    promessa: '',
    dor_latente: '',
    avatar_details: '',
    mecanismo_unico: '',
    objecoes: ''
  });
  const [error, setError] = useState('');

  const handleNext = () => {
    const activeKey = STEPS[currentStep].key;
    if (!formData[activeKey].trim()) {
      setError('Por favor, preencha este campo para continuar.');
      return;
    }
    
    setError('');
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Concluir alinhamento
      handleSave();
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    if (window.api && window.api.saveProduto) {
      const res = await window.api.saveProduto(formData);
      if (res && res.success) {
        onComplete({ ...formData, id: res.id });
      } else {
        setError('Erro ao salvar o produto no banco de dados local.');
      }
    } else {
      // Fallback desenvolvimento fora do Electron
      onComplete({ ...formData, id: Date.now() });
    }
  };

  const activeStep = STEPS[currentStep];

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-slate-950/30 border border-white/5 rounded-2xl glow-indigo-subtle flex flex-col justify-between min-h-[380px]">
      <div>
        {/* Progress Bar */}
        <div className="flex gap-1 mb-6">
          {STEPS.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= currentStep ? 'bg-indigo-500' : 'bg-white/10'}`}
            />
          ))}
        </div>

        {/* Question Header */}
        <div className="mb-6">
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block mb-1">
            Passo {currentStep + 1} de {STEPS.length} • Alinhamento do Avatar
          </span>
          <h4 className="text-lg font-bold text-white leading-snug">
            {activeStep.question}
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            {activeStep.description}
          </p>
        </div>

        {/* Inputs */}
        <div className="mb-4">
          {activeStep.key === 'nome' ? (
            <div className="space-y-4">
              <input
                type="text"
                placeholder={activeStep.placeholder}
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                autoFocus
              />
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Selecione o Emoji Representativo do Produto</label>
                <div className="flex gap-3">
                  {['🚀', '💎', '📈', '🎓', '💰', '🎯', '🔥'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setFormData({ ...formData, avatar: emoji })}
                      className={`text-xl p-2 rounded-xl border transition-all ${formData.avatar === emoji ? 'bg-indigo-600/35 border-indigo-500 scale-110' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <textarea
              placeholder={activeStep.placeholder}
              value={formData[activeStep.key]}
              onChange={(e) => setFormData({ ...formData, [activeStep.key]: e.target.value })}
              rows={4}
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors custom-scrollbar resize-none"
              autoFocus
            />
          )}

          {error && (
            <p className="text-red-400 text-xs mt-2 font-medium">⚠️ {error}</p>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${currentStep === 0 ? 'opacity-40 border-transparent text-slate-500 cursor-not-allowed' : 'border-white/10 text-slate-300 hover:bg-white/5'}`}
        >
          ← Voltar
        </button>

        <button
          onClick={handleNext}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
        >
          {currentStep === STEPS.length - 1 ? 'Finalizar Alinhamento 🎉' : 'Continuar →'}
        </button>
      </div>
    </div>
  );
}
