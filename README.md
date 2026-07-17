# Zéfiro - IA Assistant Local de Marketing

O **Zéfiro** é um copiloto local de inteligência artificial de alta performance projetado para infoprodutores e agências de marketing digital. Inspirado no modelo mental do Google NotebookLM, ele atua como uma interface minimalista e focada (estilo Spotlight que se expande para o Dashboard principal) para alinhar avatares de vendas, gerar copies persuasivas e estruturar campanhas diretamente na máquina do usuário.

---

## 🛠️ Stack Técnica

- **Framework Desktop**: Electron (com Node.js)
- **Frontend**: React.js + Vite + Tailwind CSS (estética Dark Glassmorphism)
- **Banco de Dados**: SQLite local (via `better-sqlite3`) com suporte nativo a buscas léxicas **FTS5** (BM25)
- **Integração de IA (BYOK)**: Consumo direto de APIs oficiais (OpenAI, Google Gemini, Groq, DeepSeek) usando SDKs oficiais criptografados localmente.

---

## 📋 Pré-requisitos

Para rodar e compilar a aplicação localmente, certifique-se de possuir instalado em sua máquina:
- **Node.js** (versão 18 ou superior recomendada)
- **npm** (incluso com o Node.js)

---

## 🚀 Como Rodar o Zéfiro em Desenvolvimento

Siga as instruções abaixo para a sua plataforma:

### 1. Instalar as Dependências (Todas as Plataformas)
Execute o comando abaixo na raiz do projeto para instalar os pacotes e compilar nativamente o driver de SQLite:
```bash
npm install
```

### 2. Executar em Desenvolvimento (macOS, Windows e Linux)
Para rodar a aplicação em tempo real com recarga rápida (*Hot-Reload*):
```bash
npm run dev
```

> [!NOTE]
> Em ambiente de desenvolvimento, o aplicativo irá inicializar a barra de pesquisa Spotlight no centro da tela. Use o atalho **`Option + Space`** (no macOS) ou **`Alt + Space`** (no Windows/Linux) para ocultar ou exibir rapidamente o widget.

---

## 📦 Como Compilar e Empacotar para Produção

O Zéfiro utiliza o `electron-builder` para gerar binários nativos assinados e prontos para distribuição.

### macOS
Para gerar o arquivo `.app` e o instalador `.dmg`:
```bash
npm run build
```

### Windows
Para gerar o instalador executável `.exe`:
```bash
npx electron-builder --win
```

### Linux
Para gerar pacotes em formatos `.AppImage`, `.deb` ou `.rpm`:
```bash
npx electron-builder --linux
```

O binário final de distribuição será salvo no diretório `/dist` ou `/release` criado na raiz do projeto.

---

## 📖 Estrutura e Customização do Agente

* **`SOUL.md`**: O arquivo de alma do assistente. Edite este arquivo na raiz para ajustar como o Zéfiro deve soar, as palavras proibidas e regras estritas de concisão.
* **`/skills`**: Adicione arquivos `.md` com frontmatter YAML nesta pasta para injetar novas Habilidades dinâmicas de marketing (fórmulas de copy, roteiros, etc.).
* **`/agents`**: Adicione perfis de agentes especialistas (Sócrates, Aristóteles, Dante) em formato `.yaml` ou `.md` para ter chats dedicados a posicionamentos específicos.

---

## 🤝 Colaboração e Arquitetura

Para detalhes aprofundados sobre a organização dos módulos internos e como colaborar com o projeto, consulte a pasta de documentação:
- [Documentação de Arquitetura](file:///Users/victor/UnoAgencyAgent/docs/architecture.md)
- [Guia de Colaboração](file:///Users/victor/UnoAgencyAgent/docs/contributing.md)
