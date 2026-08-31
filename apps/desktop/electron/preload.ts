// Preload script for Electron
// This runs in a separate context but has access to both Node.js and DOM APIs

import { contextBridge, ipcRenderer } from 'electron';

// ─── Logger ──────────────────────────────────────────────────
// Forward renderer log messages to the main process via IPC
const logger = {
  debug: (message: string, ...args: unknown[]) =>
    ipcRenderer.send('log-message', { level: 'debug', message, args }),
  info: (message: string, ...args: unknown[]) =>
    ipcRenderer.send('log-message', { level: 'info', message, args }),
  warn: (message: string, ...args: unknown[]) =>
    ipcRenderer.send('log-message', { level: 'warn', message, args }),
  error: (message: string, ...args: unknown[]) =>
    ipcRenderer.send('log-message', { level: 'error', message, args }),
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Add any APIs you want to expose to the renderer process here
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  // Window control methods
  window: {
    minimize: () => ipcRenderer.send('window-minimize'),
    maximize: () => ipcRenderer.send('window-maximize'),
    close: () => ipcRenderer.send('window-close'),
    fullscreen: () => ipcRenderer.send('window-fullscreen'),
    devtools: () => ipcRenderer.send('window-devtools'),
    onMaximized: (callback: (maximized: boolean) => void) => {
      ipcRenderer.on('window-maximized', (_event, maximized) => callback(maximized));
    },
  },
  // File system methods
  fs: {
    saveJsonFile: (fileName: string, content: string) => 
      ipcRenderer.invoke('save-json-file', { fileName, content }),
    saveJsonFileDialog: (defaultName: string, content: string) =>
      ipcRenderer.invoke('save-json-file-dialog', { defaultName, content }),
    openPptxDialog: () =>
      ipcRenderer.invoke('open-pptx-dialog'),
    savePptxDialog: (defaultName: string, base64Data: string) =>
      ipcRenderer.invoke('save-pptx-dialog', { defaultName, base64Data }),
  },
  // Logger methods
  log: logger,
  // Called by the main process when the user closes via OS X button / Alt+F4.
  // The renderer should save and then call window.electron.window.confirmClose()
  // or the main process will force-close after a 4s timeout regardless.
  onPrepareClose: (callback: () => void) => {
    ipcRenderer.on('prepare-close', () => callback());
  },
  confirmClose: () => ipcRenderer.send('confirm-close'),

  // ─── Auto-updater ────────────────────────────────────
  updater: {
    /** Get the current update status (version, progress, state, etc.) */
    getStatus: (): Promise<{
      state: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'
      version?: string
      releaseDate?: string
      releaseNotes?: string
      progress?: number
      error?: string
    }> => ipcRenderer.invoke('update:getStatus'),

    /** Manually check for updates */
    check: (): Promise<{ success: boolean; version?: string; error?: string }> =>
      ipcRenderer.invoke('update:check'),

    /** Download the available update (shows progress via onStatus) */
    download: (): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('update:download'),

    /** Quit the app and install the downloaded update */
    install: (): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('update:install'),

    /**
     * Listen for status changes pushed from the main process.
     * Returns an unsubscribe function.
     */
    onStatus: (callback: (status: {
      state: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'
      version?: string
      releaseDate?: string
      releaseNotes?: string
      progress?: number
      error?: string
    }) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, status: any) => callback(status)
      ipcRenderer.on('update-status', handler)
      return () => ipcRenderer.removeListener('update-status', handler)
    },
  },
});

// Listen for window control messages from renderer
window.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'window-minimize':
        ipcRenderer.send('window-minimize');
        break;
      case 'window-maximize':
        ipcRenderer.send('window-maximize');
        break;
      case 'window-close':
        ipcRenderer.send('window-close');
        break;
      case 'window-fullscreen':
        ipcRenderer.send('window-fullscreen');
        break;
      case 'window-devtools':
        ipcRenderer.send('window-devtools');
        break;
    }
  }
});

// Forward maximize state changes from main process
ipcRenderer.on('window-maximized', (_event, maximized) => {
  window.postMessage({ type: 'window-maximized', maximized }, '*');
});
