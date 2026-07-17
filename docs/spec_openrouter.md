# Spec: OpenRouter API Integration

## Objective
Add support for [OpenRouter](https://openrouter.ai/) as an LLM provider option. Users will be able to input, save, and use their own OpenRouter API key to power Zéfiro's marketing assistant capabilities, picking up OpenRouter when configured.

## Tech Stack
- **API Client**: Official `openai` npm package (configured with custom `baseURL` and optional headers for OpenRouter).
- **Frontend**: React (Renderer process) for the Settings view.
- **Backend**: Node.js / Electron (Main process) for security storage and LLM streaming integration.

## Commands
- **Dev**: `npm run dev` (Runs Vite server and Electron simultaneously)
- **Build**: `npm run build` (Compiles the production app bundle)

## Project Structure
- `src/renderer/components/Settings.jsx` - Manage and save the OpenRouter API key.
- `src/main/zefiro.js` - Initialize the OpenRouter client and stream chat completions.

## Code Style
Matches the codebase's existing pattern:
- ES6 React component structure for `Settings.jsx`.
- Node.js class-based structure with `require` imports and standard `async/await` pattern for `zefiro.js`.

```javascript
// Example OpenRouter backend call format in zefiro.js
const client = new OpenAI({ 
  apiKey, 
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://zefiro.ai',
    'X-Title': 'Zefiro',
  }
});
```

## Testing Strategy
Because there is no pre-existing automated testing framework, verification will be manual:
1. Verify the OpenRouter API Key input works and shows masked indicators (`••••••••••••••••••••`) after saving.
2. Verify saving, updating, and deleting the OpenRouter API Key works correctly without impacting other providers.
3. Verify that setting only the OpenRouter key causes the chat interface to stream responses from OpenRouter using `google/gemini-2.5-flash`.
4. Verify that formatting constraint evals still pass on OpenRouter outputs.

## Boundaries
- **Always**:
  - Mask the stored API keys in the Settings UI.
  - Store and decrypt the key using Electron's `safeStorage` (in `security.js`).
  - Pass the system prompt, chat history, and attachments to the OpenRouter payload.
- **Ask First**:
  - Changing the default model for OpenRouter from `google/gemini-2.5-flash`.
- **Never**:
  - Log plain-text API keys to any local console, traces, or diagnostics files.

## Success Criteria
- [ ] Users can save their OpenRouter API key via the settings panel.
- [ ] The key is properly encrypted using the existing `safeStorage` backend.
- [ ] When OpenRouter is the active provider, the chatbot streams responses in real-time.
- [ ] Image/text attachments are successfully passed to the OpenRouter client (compatible with model capability).

## Open Questions
1. Is `google/gemini-2.5-flash` the correct default model for OpenRouter, or would you prefer a different one?
2. Do we want to allow selecting different OpenRouter models in the UI, or is a single hardcoded default model sufficient for this initial version?
