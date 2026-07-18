const { app, BrowserWindow, ipcMain, globalShortcut, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const db = require('./db');
const memory = require('./memory');
const security = require('./security');
const scanner = require('./scanner');
const gateway = require('./gateway');




let mainWindow;
let normalBounds = null;
let isSimulatedMaximized = false;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 550,
    height: 350,
    frame: false,
    transparent: true,
    hasShadow: true,
    alwaysOnTop: true, // Spotlight começa no topo
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Determinar se estamos em ambiente de desenvolvimento

  // Determinar se estamos em ambiente de desenvolvimento
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools({ mode: 'detach' }); // Para depurar se necessário
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Inicializar Banco de Dados SQLite local
  db.dbInit();

  createMainWindow();

  // Registrar atalho global padrão para abrir a Spotlight (Option+Space ou Alt+Space)
  globalShortcut.register('Option+Space', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- IPC Handlers de Controle de Janela ---
ipcMain.on('window:expand', () => {
  if (mainWindow) {
    mainWindow.setResizable(true);
    mainWindow.setSize(1100, 680, true); // Animar tamanho
    mainWindow.setAlwaysOnTop(false); // No dashboard não precisa estar no topo
    mainWindow.center();
  }
});

ipcMain.on('window:shrink', () => {
  if (mainWindow) {
    if (isSimulatedMaximized) {
      isSimulatedMaximized = false;
      mainWindow.webContents.send('window:maximized-change', false);
    }
    mainWindow.setSize(550, 350, true); // Animar tamanho
    mainWindow.setResizable(false);
    mainWindow.setAlwaysOnTop(true);
    mainWindow.center();
  }
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { x, y, width, height } = primaryDisplay.workArea;

    if (isSimulatedMaximized) {
      if (normalBounds) {
        mainWindow.setBounds(normalBounds, true);
      } else {
        mainWindow.setSize(1100, 680, true);
        mainWindow.center();
      }
      isSimulatedMaximized = false;
      mainWindow.webContents.send('window:maximized-change', false);
    } else {
      normalBounds = mainWindow.getBounds();
      mainWindow.setBounds({ x, y, width, height }, true);
      isSimulatedMaximized = true;
      mainWindow.webContents.send('window:maximized-change', true);
    }
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle('window:capture', async () => {
  try {
    if (mainWindow) {
      const nativeImage = await mainWindow.webContents.capturePage();
      return nativeImage.toDataURL();
    }
  } catch (error) {
    console.error('Failed to capture page:', error);
  }
  return null;
});

// --- Handlers Reais do SQLite (Memórias e Produtos) ---
ipcMain.handle('db:get-produtos', async () => {
  try {
    return db.getProdutos();
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
});

ipcMain.handle('db:save-produto', async (event, produto) => {
  try {
    const id = db.saveProduto(produto);
    
    // Regenerar arquivos físicos de memória e posicionamento no workspace
    memory.regenerateMemoryFile(id);
    
    return { success: true, id };
  } catch (error) {
    console.error('Error saving product:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('db:get-facts', async (event, produtoId) => {
  try {
    return db.getFacts(produtoId);
  } catch (error) {
    console.error('Error fetching facts:', error);
    return [];
  }
});

ipcMain.handle('db:get-episodes', async (event, produtoId) => {
  try {
    return db.getEpisodes(produtoId);
  } catch (error) {
    console.error('Error fetching episodes:', error);
    return [];
  }
});

ipcMain.handle('db:get-last-session-episodes', async (event, produtoId) => {
  try {
    const lastSession = db.getLastActiveSession(produtoId);
    if (!lastSession) return { sessaoId: null, episodes: [] };
    const episodes = db.getEpisodesBySession(produtoId, lastSession);
    return { sessaoId: lastSession, episodes };
  } catch (error) {
    console.error('Error fetching last session episodes:', error);
    return { sessaoId: null, episodes: [] };
  }
});

ipcMain.handle('fs:read-memory', async (event, produtoNome) => {
  try {
    // Converter nome do produto em caminho de diretório seguro
    const folderName = produtoNome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-_]/g, '_')
      .substring(0, 50);

    const memoryPath = path.join(__dirname, '..', '..', 'produtos', folderName, '.assistant', 'MEMORY.md');
    if (fs.existsSync(memoryPath)) {
      return fs.readFileSync(memoryPath, 'utf-8');
    }
    return '';
  } catch (error) {
    console.error('Error reading memory file:', error);
    return '';
  }
});

// --- Handlers Reais de Habilidades e Agentes ---
ipcMain.handle('skills:get-all', async () => {
  try {
    return scanner.scanSkills();
  } catch (error) {
    console.error('Error scanning skills:', error);
    return [];
  }
});

ipcMain.handle('agents:get-all', async () => {
  try {
    return scanner.scanAgents();
  } catch (error) {
    console.error('Error scanning agents:', error);
    return [];
  }
});

ipcMain.handle('skills:sync', async () => {
  try {
    const skills = scanner.scanSkills();
    const agents = scanner.scanAgents();
    return { success: true, skills, agents };
  } catch (error) {
    console.error('Error syncing skills and agents:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('sec:save-key', async (event, provider, key) => {
  try {
    return security.saveKey(provider, key);
  } catch (error) {
    console.error('Error saving API key:', error);
    return false;
  }
});

ipcMain.handle('sec:get-key', async (event, provider) => {
  try {
    return security.getKey(provider);
  } catch (error) {
    console.error('Error fetching API key:', error);
    return '';
  }
});

ipcMain.handle('skills:run', async (event, payload) => {
  try {
    return await gateway.executeSkill(payload);
  } catch (error) {
    console.error('Error executing marketing skill:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('models:get-available', async () => {
  try {
    const models = [];
    const providers = [
      {
        id: 'openai',
        name: 'OpenAI',
        models: [
          { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tier: 'pago' },
          { id: 'gpt-4o', name: 'GPT-4o', tier: 'pago' },
          { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', tier: 'pago' },
          { id: 'gpt-4.1', name: 'GPT-4.1', tier: 'pago' },
          { id: 'o4-mini', name: 'o4 Mini', tier: 'pago' },
        ]
      },
      {
        id: 'groq',
        name: 'Groq',
        models: [
          { id: 'llama3-8b-8192', name: 'LLaMA 3 8B', tier: 'free' },
          { id: 'llama3-70b-8192', name: 'LLaMA 3 70B', tier: 'free' },
          { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', tier: 'free' },
          { id: 'gemma2-9b-it', name: 'Gemma 2 9B', tier: 'free' },
        ]
      },
      {
        id: 'gemini',
        name: 'Google Gemini',
        models: [
          { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', tier: 'free' },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', tier: 'free' },
          { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tier: 'free' },
          { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tier: 'free' },
          { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tier: 'free' },
        ]
      },
      {
        id: 'deepseek',
        name: 'DeepSeek',
        models: [
          { id: 'deepseek-chat', name: 'DeepSeek Chat (V3)', tier: 'pago' },
          { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1)', tier: 'pago' },
        ]
      },
      {
        id: 'openrouter',
        name: 'OpenRouter',
        models: [
          { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', tier: 'free' },
          { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', tier: 'pago' },
          { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', tier: 'pago' },
          { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', tier: 'pago' },
          { id: 'openai/gpt-4o', name: 'GPT-4o', tier: 'pago' },
          { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', tier: 'pago' },
          { id: 'meta-llama/llama-3.1-405b-instruct', name: 'LLaMA 3.1 405B', tier: 'free' },
          { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1', tier: 'pago' },
        ]
      }
    ];

    for (const prov of providers) {
      const key = security.getKey(prov.id);
      if (key) {
        prov.models.forEach(m => {
          models.push({
            id: m.id,
            name: m.name,
            tier: m.tier,
            provider: prov.id,
            providerName: prov.name
          });
        });
      }
    }

    return models;
  } catch (error) {
    console.error('Error getting available models:', error);
    return [];
  }
});

ipcMain.on('chat:send', (event, payload) => {
  gateway.handleChatStream(event, payload);
});




