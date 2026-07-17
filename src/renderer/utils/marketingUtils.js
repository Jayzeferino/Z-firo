// Helper para traduzir as funções dos agentes para português
export function translateRole(role) {
  if (!role) return '';
  const translations = {
    'docs manager': 'Gerente de Documentos',
    'project manager': 'Gerente de Projetos',
    'copywriter & product profiler': 'Redator e Analista de Produto',
    'continuity specialist': 'Especialista em Continuidade',
    'upsell maximizer': 'Maximizador de Upsell',
    'mcp manager': 'Gerente de Integrações',
    'brand voice guardian': 'Guardião do Tom de Voz',
    'planner': 'Planejador',
    'seo specialist': 'Especialista em SEO',
    'cro specialist': 'Especialista em CRO',
    'pricing specialist': 'Especialista em Precificação',
    'ad creative specialist': 'Especialista em Criativos',
    'compliance guardian': 'Guardião de Compliance',
    'traffic manager': 'Gestor de Tráfego',
    'community manager': 'Gestor de Comunidade',
    'storytelling specialist': 'Especialista em Storytelling',
    'sales page copywriter': 'Redator de Página de Vendas',
    'email copywriter': 'Redator de E-mail Marketing',
    'video scriptwriter': 'Roteirista de Vídeos',
    'lead magnet designer': 'Designer de Iscas Digitais',
    'co-marketing coordinator': 'Coordenador de Co-Marketing',
    'sms & whatsapp specialist': 'Especialista em SMS/WhatsApp',
    'referral architect': 'Arquiteto de Programas de Indicação',
    'directory submission specialist': 'Especialista em Diretórios',
    'launch coordinator': 'Coordenador de Lançamento',
    'retention auditor': 'Auditor de Retenção e Churn',
    'sales enabler': 'Facilitador de Vendas'
  };

  const key = role.toLowerCase().trim();
  return translations[key] || role;
}

// Mapeamento de categorias de marketing para português
export const CATEGORY_MAP = {
  'research': 'Pesquisa de Mercado',
  'cro': 'Otimização & CRO',
  'testing': 'Otimização & Testes',
  'seo': 'SEO & Páginas (SEO)',
  'copy': 'Copywriting',
  'product campaign': 'ADS / Campanhas',
  'email': 'E-mail & SMS',
  'growth': 'Crescimento (Growth)',
  'marketing': 'Fundamentos de Marketing',
  'sales': 'Vendas',
  'launch': 'Lançamento',
  'content': 'Mídias & Conteúdo',
  'analytics': 'Métricas & Analytics'
};

// Helper para traduzir o nome e a descrição das habilidades para português
export function translateSkill(sk) {
  if (!sk) return null;
  const skillTranslations = {
    'ab-testing': {
      name: 'Teste A/B',
      description: 'Guia para projetar, executar e analisar testes A/B estruturados.'
    },
    'site-architecture': {
      name: 'Arquitetura do Site',
      description: 'Otimização da estrutura e links internos para melhorar o rastreamento do SEO.'
    },
    'seo-mastery': {
      name: 'Domínio do SEO',
      description: 'Planejamento avançado de SEO, pesquisa de palavras-chave e estratégias de conteúdo.'
    },
    'schema-markup': {
      name: 'Marcação de Schema',
      description: 'Estruturação de dados Rich Snippets para melhorar a visibilidade nos motores de busca.'
    },
    'seo-audit': {
      name: 'Auditoria de SEO',
      description: 'Análise técnica completa para identificar erros de SEO e otimização On-Page.'
    },
    'programmatic-seo': {
      name: 'SEO Programático',
      description: 'Estratégia para criar páginas de destino dinâmicas em grande escala focando em SEO.'
    },
    'aso': {
      name: 'Otimização de App Store (ASO)',
      description: 'Estratégia de SEO para ranqueamento de aplicativos móveis nas lojas de apps.'
    },
    'ai-seo': {
      name: 'SEO com Inteligência Artificial',
      description: 'Uso de ferramentas generativas e IA para produção e otimização de conteúdo SEO.'
    },
    'sales-enablement': {
      name: 'Capacitação de Vendas',
      description: 'Criação de materiais, scripts e recursos para fechar negócios com mais eficiência.'
    },
    'competitor-profiling': {
      name: 'Perfil do Competidor',
      description: 'Mapeamento das forças, fraquezas, posicionamento e canais de tráfego dos concorrentes.'
    },
    'customer-research': {
      name: 'Pesquisa de Clientes',
      description: 'Métodos de entrevista e coleta de dados para entender dores e desejos dos clientes.'
    },
    'competitor-alternatives': {
      name: 'Página de Alternativas',
      description: 'Criação de páginas de comparação para capturar tráfego que busca alternativas aos concorrentes.'
    },
    'prospecting': {
      name: 'Prospecção de Leads',
      description: 'Técnicas de outreach, qualificação e aquisição de contatos qualificados.'
    },
    'problem-solving': {
      name: 'Resolução de Problemas',
      description: 'Processo analítico para identificar gargalos em funis de marketing e resolvê-los.'
    },
    'paid-advertising': {
      name: 'Anúncios Pagos (Tráfego)',
      description: 'Criação, otimização e distribuição de campanhas de tráfego pago (Meta, Google, LinkedIn).'
    },
    'marketing-plan': {
      name: 'Plano de Marketing',
      description: 'Construção de cronograma e planejamento de go-to-market integrado.'
    },
    'ad-creative': {
      name: 'Criativos de Anúncios',
      description: 'Desenvolvimento de imagens, vídeos e copies altamente persuasivos para anúncios.'
    },
    'pricing-strategy': {
      name: 'Estratégia de Precificação',
      description: 'Estudo de posicionamento de preço, ancoragem e modelos de assinatura.'
    },
    'marketing-ideas': {
      name: 'Ideias de Marketing',
      description: 'Brainstorming e geração de ideias para aquisição e engajamento.'
    },
    'marketing-psychology': {
      name: 'Psicologia do Consumidor',
      description: 'Aplicação de gatilhos mentais e vieses cognitivos no funil de vendas.'
    },
    'clarify-product': {
      name: 'Clareza do Produto',
      description: 'Definição clara da proposta de valor, dores que resolve e diferenciais do produto.'
    },
    'marketing-fundamentals': {
      name: 'Fundamentos de Marketing',
      description: 'Conceitos básicos de funil de vendas, posicionamento de mercado e canais de tração.'
    },
    'launch-strategy': {
      name: 'Estratégia de Lançamento',
      description: 'Planejamento detalhado para lançar novos produtos e funcionalidades no mercado.'
    },
    'lead-magnets': {
      name: 'Iscas Digitais (Lead Magnets)',
      description: 'Criação de ebooks, planilhas e templates em troca de e-mails de contatos.'
    },
    'free-tool-strategy': {
      name: 'Estratégia de Ferramenta Grátis',
      description: 'Desenvolvimento de miniferramentas gratuitas para atração viral de leads.'
    },
    'co-marketing': {
      name: 'Co-Marketing',
      description: 'Parcerias de conteúdo com outras empresas para compartilhamento de audiência.'
    },
    'brand-building': {
      name: 'Construção de Marca (Branding)',
      description: 'Criação de identidade, voz de marca e autoridade de mercado.'
    },
    'referral-program': {
      name: 'Programa de Indicação (Referral)',
      description: 'Estratégia de crescimento orgânico incentivando clientes a convidar amigos.'
    },
    'directory-submissions': {
      name: 'Envio para Diretórios',
      description: 'Cadastramento do seu produto em diretórios de SaaS (Product Hunt, G2, etc.) para obter backlinks.'
    },
    'sms': {
      name: 'Marketing de SMS / WhatsApp',
      description: 'Estratégias de disparos e funis de engajamento via mensagens de texto e WhatsApp.'
    },
    'signup-flow-cro': {
      name: 'CRO no Fluxo de Cadastro',
      description: 'Otimização de formulários e telas iniciais para aumentar a taxa de conversão de cadastros.'
    },
    'churn-prevention': {
      name: 'Prevenção de Churn (Retenção)',
      description: 'Estratégia para evitar cancelamentos de clientes e aumentar o LTV.'
    },
    'paywall-upgrade-cro': {
      name: 'CRO em Paywalls',
      description: 'Otimização da tela de checkout e paywalls para aumentar conversões de planos pagos.'
    },
    'popup-cro': {
      name: 'CRO em Pop-ups',
      description: 'Estratégia de uso de pop-ups inteligentes de saída e captura sem irritar o usuário.'
    },
    'page-cro': {
      name: 'CRO de Landing Page',
      description: 'Análise visual e de copy para melhorar a taxa de conversão de páginas de destino.'
    },
    'onboarding-cro': {
      name: 'CRO de Onboarding',
      description: 'Otimização dos primeiros minutos de uso do produto para gerar engajamento imediato.'
    },
    'email-sequence': {
      name: 'Sequências de E-mail (Fluxos)',
      description: 'Automação de e-mails de boas-vindas, nutrição e recuperação de carrinho.'
    },
    'email-marketing': {
      name: 'E-mail Marketing',
      description: 'Criação de newsletters informativas, promocionais e comunicados em massa.'
    },
    'form-cro': {
      name: 'CRO em Formulários',
      description: 'Redução de fricção e campos em formulários para aumentar envios completados.'
    },
    'image': {
      name: 'Design de Imagens',
      description: 'Diretrizes e criação de mockups e banners visuais para redes sociais.'
    },
    'video': {
      name: 'Roteirização de Vídeos',
      description: 'Criação de scripts e conceitos para vídeos do YouTube, TikTok e Reels.'
    },
    'copywriting': {
      name: 'Redação Persuasiva (Copywriting)',
      description: 'Escrever textos que vendem para anúncios, sites, redes sociais e e-mails.'
    },
    'offers': {
      name: 'Criação de Ofertas Irrecusáveis',
      description: 'Definição de preço, bônus, garantias e escassez para empacotar ofertas de alto valor.'
    },
    'social-media': {
      name: 'Estratégia de Redes Sociais',
      description: 'Planejamento de calendário editorial, hashtags e engajamento orgânico.'
    },
    'revops': {
      name: 'Geração de Receita (RevOps)',
      description: 'Estruturação de métricas de vendas e análise financeira para crescimento sustentável.'
    },
    'copy-editing': {
      name: 'Revisão e Edição de Textos',
      description: 'Edição técnica para refinar tom, gramática e clareza de textos publicitários.'
    }
  };

  const cleanId = sk.id.toLowerCase().replace('/skill.md', '').split('/').pop();
  const match = skillTranslations[cleanId];
  return match ? { ...sk, name: match.name, description: match.description } : sk;
}

// Helper para parsear detalhes específicos do agente a partir do seu markdown/body
export function parseAgentDetails(agent) {
  if (!agent) return null;
  
  let servesFor = '';
  let whatItDoes = '';
  let needs = [];
  
  const body = agent.body || '';
  
  // 1. Extrair "What It Serves For"
  const servesForRegex = /## ❓\s*(?:What It Serves For|Para que serve)\r?\n([\s\S]+?)(?=\r?\n##|$)/i;
  const servesForMatch = body.match(servesForRegex);
  if (servesForMatch) {
    servesFor = servesForMatch[1].trim();
  }
  
  // 2. Extrair "When To Use" ou fallback para "Role Overview"
  const whenToUseRegex = /## 📅\s*(?:When To Use|Quando usar)\r?\n([\s\S]+?)(?=\r?\n##|$)/i;
  const whenToUseMatch = body.match(whenToUseRegex);
  if (whenToUseMatch) {
    whatItDoes = whenToUseMatch[1].trim();
  } else {
    const roleOverviewRegex = /## 🎯\s*(?:Role Overview|Visão geral do papel)\r?\n([\s\S]+?)(?=\r?\n##|$)/i;
    const roleOverviewMatch = body.match(roleOverviewRegex);
    if (roleOverviewMatch) {
      whatItDoes = roleOverviewMatch[1].trim();
    }
  }
  
  // 3. Extrair as Skills associadas (formatadas como: - `skills/Category/name`)
  const skillsRegex = /-\s*`skills\/([\s\S]+?)`/g;
  let match;
  while ((match = skillsRegex.exec(body)) !== null) {
    const parts = match[1].split('/');
    const skillName = parts[parts.length - 1];
    needs.push(skillName);
  }
  
  // Fallbacks em português caso o agente seja YAML ou não possua o markdown estruturado
  if (!servesFor) {
    servesFor = agent.description || 'Atuar como especialista e auditor estratégico de marketing do produto.';
  }
  if (!whatItDoes) {
    whatItDoes = `Executar e refinar as campanhas de ${agent.role || 'Marketing'} e analisar posicionamento de mercado.`;
  }
  if (needs.length === 0) {
    needs = ['clarify-product', 'marketing-plan'];
  }
  
  return { servesFor, whatItDoes, needs };
}
