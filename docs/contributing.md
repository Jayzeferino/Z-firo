# Como Colaborar com o Zéfiro

Este documento fornece as diretrizes e boas práticas para desenvolvedores e profissionais de marketing que desejam criar novas habilidades, agentes ou colaborar com o código-fonte do Zéfiro.

---

## 1. Criando Novas Habilidades (Skills)

As habilidades são a **Procedural Memory** do assistente. Elas executam tarefas específicas (Ex: criar títulos, estruturar VSL, analisar concorrentes) usando formulários estruturados.

### Passos para Criar uma Skill:
1. Vá até a pasta `file:///Users/victor/UnoAgencyAgent/skills/`.
2. Crie uma nova pasta ou um arquivo markdown diretamente (Ex: `gerar-aida.md`).
3. Adicione o cabeçalho frontmatter YAML delimitado por `---` com as seguintes propriedades:
   - `name`: Nome legível da habilidade (Ex: "Estruturador de Copy AIDA").
   - `description`: Explique de forma simples o que a habilidade faz e quando utilizá-la.
   - `category`: Categoria de marketing (Ex: "Copywriting", "Lançamentos", "Tráfego Pago").
   - `inputs`: Lista de campos de entrada do formulário. Cada input deve ter:
     - `name`: Nome da variável (Ex: `dor_principal`).
     - `label`: Rótulo de exibição amigável na UI.
     - `type`: Tipo de input (`text` para campos simples, `textarea` para textos longos).
     - `placeholder`: Dica de preenchimento.
4. Escreva o prompt de instrução da skill no corpo do markdown, referenciando as variáveis de input usando chaves duplas: `{{dor_principal}}`.

---

## 2. Criando Novos Agentes Especialistas

Os agentes representam as personas de marketing conversacional clássico que interagem diretamente via chat utilizando as memórias de posicionamento do produto.

### Passos para Criar um Agente:
1. Vá até a pasta `file:///Users/victor/UnoAgencyAgent/agents/`.
2. Crie um arquivo `.yaml` (Recomendado) ou `.md` com frontmatter.
3. Defina as seguintes propriedades no arquivo:
   - `name`: Nome do Agente (Ex: Sócrates, Dante, Aristóteles).
   - `role`: Papel de marketing dele (Ex: Mestre de Questionamento Crítico, Copywriter Emocional).
   - `avatar`: Emoji que o represente na interface (Ex: 🏛️, ✒️, 💎).
   - `system_prompt`: As instruções de personalidade de como ele deve se comportar durante a conversa.

---

## 3. Diretrizes de Desenvolvimento de Código

Se você for modificar a estrutura nativa da aplicação, siga as regras de design de engenharia do projeto:

### 3.1. Orquestração Centralizada (Wiring Pattern)
* Qualquer lógica relacionada a inteligência artificial, manipulação de contexto RAG ou fluxos de LLM deve ser integrada centralizada dentro do método `.respond()` da classe `Zefiro` em `src/main/zefiro.js`.
* O módulo `gateway.js` deve ser mantido enxuto, atuando apenas como a camada de transporte dos eventos IPC.

### 3.2. Qualidade e Evals Determinísticos
* Respeite rigorosamente a alma do assistente definida no [SOUL.md](file:///Users/victor/UnoAgencyAgent/SOUL.md) (vá direto ao ponto, sem preâmbulos ou enrolações robóticas).
* Sempre adicione ou atualize os testes sintáticos locais no validador determinístico do `llmops.js` se novas restrições de copy ou jargões corporativos precisarem ser mapeados.

### 3.3. build Limpo
* Antes de realizar qualquer commit, valide que o empacotamento do React frontend está compilando sem erros:
  ```bash
  npm run build:renderer
  ```
* Respeite o arquivo `.gitignore`. Nunca envie chaves de API privadas ou pastas de bancos locais temporários para o controle de versão.
