import React, { useState, useEffect } from 'react';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';

export default function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [produtos, setProdutos] = useState([]);
  const [filteredProdutos, setFilteredProdutos] = useState([]);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (window.api && window.api.onMaximizedChange) {
      const unsubscribe = window.api.onMaximizedChange((val) => {
        setIsMaximized(val);
      });
      return unsubscribe;
    }
  }, []);

  // Carregar produtos da base de dados local na inicialização
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    if (window.api && window.api.getProdutos) {
      const res = await window.api.getProdutos();
      setProdutos(res || []);
    } else {
      // Mocks para ambiente de teste web/desenvolvimento
      setProdutos([
        { id: 1, nome: 'Fórmula de Lançamento Local', avatar: '🚀', promessa: 'Fature alto', dor_latente: 'Falta de leads', mecanismo_unico: 'Funil perpétuo', objecoes: 'Sem tempo' }
      ]);
    }
  };

  // Filtrar produtos na Spotlight em tempo real
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProdutos([]);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredProdutos(
        produtos.filter(p => p.nome.toLowerCase().includes(query))
      );
    }
  }, [searchQuery, produtos]);

  const selectProduto = (produto) => {
    setSelectedProduto(produto);
    
    // Se for um produto novo (ou um ID temporário 'new') que não passou pelo onboarding
    if (produto.id === 'new') {
      setIsOnboarding(true);
      setIsExpanded(true);
      if (window.api && window.api.expandWindow) {
        window.api.expandWindow();
      }
    } else {
      setIsOnboarding(false);
      setIsExpanded(true);
      if (window.api && window.api.expandWindow) {
        window.api.expandWindow();
      }
    }
  };

  const handleOnboardingComplete = (newProduto) => {
    setIsOnboarding(false);
    setSelectedProduto(newProduto);
    loadProducts(); // Recarrega do banco
  };

  const handleCloseDashboard = () => {
    setIsExpanded(false);
    setSelectedProduto(null);
    setIsOnboarding(false);
    setSearchQuery('');
    if (window.api && window.api.shrinkWindow) {
      window.api.shrinkWindow();
    }
  };

  // Minimizar janela através do Alternador de Widget flutuante
  const handleToggleWidget = () => {
    if (window.api) {
      if (isExpanded) {
        handleCloseDashboard();
      } else {
        // Encolhe ou fecha dependendo do atalho, aqui simulamos esconder a janela
        window.api.shrinkWindow();
      }
    }
  };

  return (
    <div className={`h-full w-full flex flex-col justify-center items-center ${isExpanded && isMaximized ? 'p-0' : 'p-4'} bg-transparent font-sans selection:bg-accent/40 select-none`}>
      
      {/* ALTERNADOR DE WIDGET FLUTUANTE (Discreto na borda) */}
      <button
        onClick={handleToggleWidget}
        title="Alternar visibilidade do Zéfiro"
        className="fixed bottom-4 right-4 z-50 bg-indigo-600/80 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-full p-2.5 shadow-lg border border-white/10 glow-indigo-subtle flex items-center justify-center transition-all hover:scale-105 active:scale-95 no-drag-region"
      >
        <span className="text-base leading-none">🍃</span>
      </button>

      {/* SPOTLIGHT MODE */}
      {!isExpanded ? (
        <div className="w-full max-w-lg glass-panel glow-indigo-subtle rounded-2xl overflow-hidden flex flex-col drag-region">
          
          {/* Header da Barra de Busca */}
          <div className="flex items-center px-4 py-3 bg-white/5 border-b border-white/5 no-drag-region">
            <span className="text-lg mr-3 text-indigo-400">✨</span>
            <input
              type="text"
              placeholder="Pesquisar produto ou ação no Zéfiro..."
              className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-white/10"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Resultados da Pesquisa */}
          <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 bg-transparent no-drag-region">
            {searchQuery && filteredProdutos.length === 0 ? (
              <div 
                onClick={() => selectProduto({ id: 'new', nome: searchQuery, avatar: '✨' })}
                className="p-3 rounded-xl hover:bg-indigo-500/20 hover:border-indigo-500/30 border border-transparent transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-semibold text-white block">Criar Produto: "{searchQuery}"</span>
                  <span className="text-[10px] text-slate-400">Iniciar alinhamento do avatar de marketing</span>
                </div>
                <span className="text-indigo-400 text-xs font-bold">Configurar →</span>
              </div>
            ) : filteredProdutos.length > 0 ? (
              filteredProdutos.map(p => (
                <div 
                  key={p.id}
                  onClick={() => selectProduto(p)}
                  className="p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <span className="text-lg mr-3">{p.avatar}</span>
                    <span className="text-xs font-medium text-white">{p.nome}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Abrir Copiloto →</span>
                </div>
              ))
            ) : (
              <div className="space-y-1">
                {produtos.length > 0 ? (
                  <>
                    <div className="px-3 py-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 mb-1">
                      Seus Produtos ({produtos.length})
                    </div>
                    {produtos.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => selectProduto(p)}
                        className="p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <span className="text-lg mr-3">{p.avatar}</span>
                          <span className="text-xs font-medium text-white">{p.nome}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">Abrir Copiloto →</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="p-3 text-[10px] text-slate-500 text-center">
                    Digite para buscar produtos ou digite o nome de um novo produto para iniciá-lo.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* EXPANDED MODE */
        <div className="w-full h-full flex justify-center items-center">
          {isOnboarding ? (
            <Onboarding 
              produtos={produtos} 
              onSelectProduto={(p) => {
                setSelectedProduto(p);
                setIsOnboarding(false);
              }}
              onComplete={handleOnboardingComplete} 
            />
          ) : (
            <Dashboard produto={selectedProduto} onBack={handleCloseDashboard} isMaximized={isMaximized} />
          )}
        </div>
      )}
    </div>
  );
}
