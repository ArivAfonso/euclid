import { app, BrowserWindow, shell, ipcMain, dialog, nativeTheme } from 'electron';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import log from './logger';
import { setupAutoUpdater } from './updater';

// For CommonJS compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve a suitable icon from the public folder for development and packaged app
const resolveAppIcon = () => {
  const publicDir = join(__dirname, '../../public');
  const candidates = ['icon.png', 'icon.ico', 'icon.icns', "icon.jpeg"];
  for (const name of candidates) {
    const p = join(publicDir, name);
    if (existsSync(p)) return p;
  }
  return undefined;
};

const iconPath = resolveAppIcon();

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Remove default titlebar
    titleBarStyle: 'hidden', // Hide titlebar on macOS
    title: 'Euclid', // Default window title until the renderer sets document.title
    // Match the OS theme so the pre-paint window isn't a white flash in dark mode
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#171717' : '#ffffff',
    // Set app icon if available (dev or packaged)
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    show: false, // Don't show until ready
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Safety timeout: force-show the window if ready-to-show never fires
  // (e.g. preload/renderer silently fails in packaged app)
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  }, 3000);

  // and load the index.html of the app.
  // In development, electron-vite runs a dev server
  // Check if we're in development by looking for the typical dev server
  const isDev = !app.isPackaged;
  
  if (isDev) {
    const devServerUrl = 'http://localhost:5173';
    log.info(`Loading from dev server: ${devServerUrl}`);
    mainWindow.loadURL(devServerUrl);
  } else {
    log.info('Loading from file system');
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'));
  }

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler((details: { url: string }) => {
    if (details.url.startsWith('http:') || details.url.startsWith('https:')) {
      shell.openExternal(details.url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Intercept OS-native close (X button / Alt+F4) — ask renderer to save,
  // then force-close after a short grace period
  mainWindow.on('close', (event) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      event.preventDefault();
      mainWindow.webContents.send('prepare-close');
      // Force close after 4s even if renderer doesn't respond
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.destroy();
        }
      }, 4000);
    }
  });

  // Send maximize state changes to renderer
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-maximized', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-maximized', false);
  });

  // ─── Initialize auto-updater ────────────────────────────
  setupAutoUpdater(mainWindow);
};

// IPC handlers for window controls
ipcMain.on('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Use destroy() directly to bypass the 'close' event handler —
    // the renderer has already saved before sending this IPC.
    mainWindow.destroy();
  }
});

// Renderer has finished saving and confirms it's ready to close
ipcMain.on('confirm-close', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.destroy();
  }
});

ipcMain.on('window-fullscreen', () => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  }
});

ipcMain.on('window-devtools', () => {
  if (mainWindow) {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools();
    }
  }
});

// File system handlers for autosave
ipcMain.handle('save-json-file', async (_event, { fileName, content }) => {
  try {
    // Get user's documents directory
    const userDataPath = app.getPath('userData');
    const autosavePath = join(userDataPath, 'autosaves');
    
    // Ensure autosaves directory exists
    await mkdir(autosavePath, { recursive: true });
    
    const filePath = join(autosavePath, fileName);
    await writeFile(filePath, content, 'utf-8');
    
    return { success: true, path: filePath };
  } catch (error) {
    log.error('Error saving JSON file:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('save-json-file-dialog', async (_event, { defaultName, content }) => {
  try {
    const result = await dialog.showSaveDialog({
      title: 'Save Project',
      defaultPath: defaultName,
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }
    
    await writeFile(result.filePath, content, 'utf-8');
    return { success: true, path: result.filePath };
  } catch (error) {
    log.error('Error saving JSON file via dialog:', error);
    return { success: false, error: String(error) };
  }
});

// ─── PPTX Import/Export IPC Handlers ─────────────────────────

ipcMain.handle('open-pptx-dialog', async () => {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Import PowerPoint File',
      filters: [
        { name: 'PowerPoint Presentations', extensions: ['pptx'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });
    
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }
    
    const filePath = result.filePaths[0];
    const { readFile } = await import('fs/promises');
    const buffer = await readFile(filePath);
    
    // Return as base64 for transfer to renderer
    const base64 = buffer.toString('base64');
    const fileName = filePath.split(/[/\\]/).pop() || 'presentation.pptx';
    
    return { success: true, data: base64, name: fileName, path: filePath };
  } catch (error) {
    log.error('Error opening PPTX file:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('save-pptx-dialog', async (_event, { defaultName, base64Data }) => {
  try {
    const result = await dialog.showSaveDialog({
      title: 'Save PowerPoint Presentation',
      defaultPath: defaultName || 'euclid-export.pptx',
      filters: [
        { name: 'PowerPoint Presentations', extensions: ['pptx'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }
    
    const buffer = Buffer.from(base64Data, 'base64');
    await writeFile(result.filePath, buffer);
    
    return { success: true, path: result.filePath };
  } catch (error) {
    log.error('Error saving PPTX file:', error);
    return { success: false, error: String(error) };
  }
});

// ─── Renderer Log Forwarding ─────────────────────────────────

// IPC handler to receive log messages from the renderer process
ipcMain.on('log-message', (_event, { level, message, ...meta }) => {
  switch (level) {
    case 'error':
      log.error(`[Renderer] ${message}`, meta);
      break;
    case 'warn':
      log.warn(`[Renderer] ${message}`, meta);
      break;
    case 'info':
      log.info(`[Renderer] ${message}`, meta);
      break;
    case 'debug':
    default:
      log.debug(`[Renderer] ${message}`, meta);
      break;
  }
});

// ─── Global Exception Handlers ───────────────────────────────

// Catch unhandled exceptions and promise rejections and log them
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled Promise Rejection:', reason);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
