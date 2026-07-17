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

ipcMain.on('chat:send', (event, payload) => {
  gateway.handleChatStream(event, payload);
});




