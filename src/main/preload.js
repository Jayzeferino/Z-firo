const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Controle de Janela
  expandWindow: () => ipcRenderer.send('window:expand'),
  shrinkWindow: () => ipcRenderer.send('window:shrink'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  onMaximizedChange: (callback) => {
    const subscription = (event, isMaximized) => callback(isMaximized);
    ipcRenderer.on('window:maximized-change', subscription);
    return () => ipcRenderer.removeListener('window:maximized-change', subscription);
  },
  closeWindow: () => ipcRenderer.send('window:close'),
  
  // Produtos
  getProdutos: () => ipcRenderer.invoke('db:get-produtos'),
  saveProduto: (produto) => ipcRenderer.invoke('db:save-produto', produto),
  
  // Banco de Dados / Memória
  getFacts: (produtoId) => ipcRenderer.invoke('db:get-facts', produtoId),
  getEpisodes: (produtoId) => ipcRenderer.invoke('db:get-episodes', produtoId),
  readMemoryFile: (produtoNome) => ipcRenderer.invoke('fs:read-memory', produtoNome),
  
  // Habilidades (Skills) e Agentes
  getSkills: () => ipcRenderer.invoke('skills:get-all'),
  getAgents: () => ipcRenderer.invoke('agents:get-all'),
  syncSkills: () => ipcRenderer.invoke('skills:sync'),
  runSkill: (payload) => ipcRenderer.invoke('skills:run', payload),

  
  // Segurança (Chaves de API)
  saveApiKey: (provider, key) => ipcRenderer.invoke('sec:save-key', provider, key),
  getApiKey: (provider) => ipcRenderer.invoke('sec:get-key', provider),
  
  // Comunicação IA
  onChatStream: (callback) => {
    const subscription = (event, chunk) => callback(chunk);
    ipcRenderer.on('chat:stream', subscription);
    return () => ipcRenderer.removeListener('chat:stream', subscription);
  },
  sendChatMessage: (payload) => ipcRenderer.send('chat:send', payload),

  // Captura de Tela
  captureWindow: () => ipcRenderer.invoke('window:capture'),
});
