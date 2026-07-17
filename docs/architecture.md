# Arquitetura Técnica do Zéfiro

O Zéfiro foi projetado sob a filosofia de processamento 100% local, offline-first e modular. Este documento detalha a divisão de responsabilidades entre o Processo Main (Node.js/Electron) e o Processo Renderer (React/Vite), além da modelagem do fluxo de inteligência artificial.

---

## 1. Visão Geral da Arquitetura

O sistema de processamento de IA segue o padrão de **Wiring** (diagrama de montagem integrado em uma classe de serviço unificada). A comunicação ocorre de forma assíncrona e segura por meio de canais IPC (Inter-Process Communication).

```
 ┌────────────────────────────────────────────────────────┐
 │                   INTERFACE (Vite)                     │
 │   [App.jsx] ─── [Dashboard.jsx] ─── [Onboarding.jsx]   │
 └──────────────────────────┬─────────────────────────────┘
                            │ (IPC Bridge)
 ┌──────────────────────────▼─────────────────────────────┐
 │                    PRELOAD LAYER                       │
 │                    [preload.js]                        │
 └──────────────────────────┬─────────────────────────────┘
                            │ (Nativo)
 ┌──────────────────────────▼─────────────────────────────┐
 │                 MAIN PROCESS (Node.js)                 │
 │                      [main.js]                         │
 │                         │                              │
 │   ┌─────────────┬───────┴──────┬─────────────┐         │
 │   │             │              │             │         │
 │[gateway.js] [scanner.js] [security.js]  [db.js]        │
 │   │                                          │         │
 │[zefiro.js] (Orquestrador) ───────────────────┤         │
 │   │                                          │         │
 │   ├─── [llmops.js] (Traces/Evals)            │         │
 │   │                                          │         │
 │   └─── [memory.js] ──────────────────────────┘         │
 │           │                                            │
 │           └─► Sincroniza .assistant/MEMORY.md          │
 └────────────────────────────────────────────────────────┘
```

---

## 2. Mapeamento de Módulos (Processo Main)

### 2.1. `main.js` (Ponto de Entrada Nativo)
- Inicializa o ciclo de vida do Electron e abre o banco de dados via `db.dbInit()`.
- Cria a janela frameless e transparente, alternando as dimensões entre o Spotlight (`550x350`) e o Dashboard (`1100x680`).
- Registra os atalhos globais de teclado (`Option+Space` ou `Alt+Space`) para exibição e ocultação rápida.
- Vincula os IPC Handlers expostos.

### 2.2. `preload.js` (Ponte Segura IPC)
- Utiliza a API `contextBridge` do Electron para isolar o processo do Renderer de chamadas diretas ao Node.js.
- Expõe funções seguras sob o namespace `window.api` (ex: `window.api.getProdutos()`, `window.api.runSkill()`, `window.api.saveApiKey()`).

### 2.3. `zefiro.js` (O Orquestrador Central)
- Módulo central inspirado na arquitetura *Waku* do Python.
- Instancia e gerencia as conexões do produto ativo.
- O método `.respond(userMessage, options)` coordena o turno completo de IA:
  1. Aciona o **Retrieval Gate** no `llmops.js` para avaliar se necessita de dados contextuais.
  2. Executa a busca léxica via SQLite FTS5 se necessário.
  3. Carrega e anexa o arquivo [SOUL.md](file:///Users/victor/UnoAgencyAgent/SOUL.md) no início do System Prompt.
  4. Decodifica chaves privadas do `security.js`.
  5. Instancia o SDK correspondente (OpenAI, Gemini, Groq, DeepSeek) e inicia a geração.
  6. Grava a resposta gerada como um episódio no SQLite.
  7. Roda evals determinísticos na saída para manter a qualidade de marketing.
  8. Grava um log físico de trace para auditoria local.
  9. Regenera o espelho Markdown de memória física `.assistant/MEMORY.md`.

### 2.4. `db.js` (Banco de Dados SQLite & FTS5)
- Estabelece a conexão com a base local `state.db` (gerenciada via `better-sqlite3`).
- Cria as tabelas `produtos`, `facts` (memória semântica) e `episodes` (memória episódica/chat).
- Cria as tabelas virtuais `facts_fts` e `episodes_fts` com indexação nativa FTS5.
- Executa **Triggers SQL** para manter o índice virtual síncrono automaticamente em operações de inserção, deleção e atualização.
- Provê buscas léxicas rápidas ordenadas por relevância BM25.

### 2.5. `memory.js` (Espelhamento Físico de Memória)
- Varre o banco de dados do produto ativo, destila as informações do avatar, fatos semânticos e sessões de diálogos.
- Exporta de forma síncrona um Markdown completo em `produtos/[nome-do-produto]/.assistant/MEMORY.md` para auditoria rápida do usuário no Explorer/Finder.
- Exporta uma ficha de posicionamento limpa em `posicionamento.md`.

### 2.6. `scanner.js` (Varredura de Diretórios)
- Analisador recursivo que varre as pastas `/skills` e `/agents`.
- Lê e decodifica o cabeçalho frontmatter YAML dos arquivos markdown ou YAML puro usando a biblioteca `js-yaml`.
- Fornece as definições de inputs de formulários das Habilidades e perfis de personas dos Agentes ao frontend React.

### 2.7. `security.js` (Criptografia de Credenciais BYOK)
- Utiliza a API nativa `safeStorage` do Electron para criptografar as chaves privadas do usuário com base nas chaves do sistema operacional (macOS Keychain e Windows DPAPI).
- Salva o resultado criptografado como hexadecimal na tabela `api_keys` no SQLite local.

### 2.8. `llmops.js` (Traces e Evals)
- **Trace Logger**: Grava logs detalhados em arquivos `/traces/trace_[timestamp].json` contendo modelo utilizado, latência, prompts e status de sucesso.
- **Retrieval Gate**: Filtro baseado em termos de busca de marketing (Ex: " avatar", " promessa", " dor") para avaliar se o turno atual de fato requer busca léxica no SQLite FTS5.
- **Evals Determinísticos**: Executa regras de conformidade sintática e semântica na resposta (Ex: proíbe saudações robóticas, preâmbulos, formatações erradas e banimento de termos corporativos/anglicismos proibidos na copy).

### 2.9. `gateway.js` (Roteador de Mensagens)
- Atua como a camada de transporte que recebe os eventos IPC (`chat:send` e `skills:run`).
- Executa o parsing final de placeholders de skills e invoca a classe `Zefiro` correspondente.

---

## 3. Mapeamento de Módulos (Processo Renderer)

- **`App.jsx`**: Gerencia a transição de janelas Spotlight-to-Dashboard, alternância de widget e fluxo de onboarding.
- **`Onboarding.jsx`**: Entrevista de alinhamento de 6 passos (Promessa, Dor, Avatar, Mecanismo Único, Objeções).
- **`Dashboard.jsx`**: O coração do dashboard estilo NotebookLM.
  - Barra lateral com abas de Chat com Agentes, Habilidades de Marketing, Visualizador de Memória Markdown e busca direta do Banco de Dados SQLite.
- **`Settings.jsx`**: Formulário de registro seguro de credenciais locais (OpenAI, Gemini, Groq, DeepSeek).
