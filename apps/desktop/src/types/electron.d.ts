// Electron API types for renderer process
export interface ElectronLogger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

export interface ElectronAPI {
  platform: string;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    fullscreen: () => void;
    devtools: () => void;
    onMaximized: (callback: (maximized: boolean) => void) => void;
  };
  fs: {
    saveJsonFile: (fileName: string, content: string) => Promise<{
      success: boolean;
      path?: string;
      error?: string;
    }>;
    saveJsonFileDialog: (defaultName: string, content: string) => Promise<{
      success: boolean;
      path?: string;
      error?: string;
      canceled?: boolean;
    }>;
    openPptxDialog: () => Promise<{
      success: boolean;
      data?: string;
      name?: string;
      path?: string;
      error?: string;
      canceled?: boolean;
    }>;
    savePptxDialog: (defaultName: string, base64Data: string) => Promise<{
      success: boolean;
      path?: string;
      error?: string;
      canceled?: boolean;
    }>;
  };
  log: ElectronLogger;
  /** Register a callback for when the main process sends prepare-close (OS X button / Alt+F4). Save and call confirmClose(). */
  onPrepareClose: (callback: () => void) => void;
  /** Confirm the renderer is ready to close — main process will destroy the window. */
  confirmClose: () => void;
  /** Auto-updater API */
  updater: {
    getStatus: () => Promise<UpdateStatus>;
    check: () => Promise<{ success: boolean; version?: string; error?: string }>;
    download: () => Promise<{ success: boolean; error?: string }>;
    install: () => Promise<{ success: boolean }>;
    onStatus: (callback: (status: UpdateStatus) => void) => () => void;
  };
}

export interface UpdateStatus {
  state: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  releaseDate?: string;
  releaseNotes?: string;
  progress?: number;
  error?: string;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
