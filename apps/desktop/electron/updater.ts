/**
 * Auto-update module for the Euclid desktop app.
 *
 * Uses electron-updater with the GitHub provider. Works with both
 * private and public GitHub repos:
 *   - Public repo: no token needed (updates work out of the box)
 *   - Private repo: set GH_TOKEN env var at build time (a fine-grained
 *     PAT with read-only access to "Contents" is sufficient)
 *
 * How it works from the USER'S perspective:
 *   1. App starts → silently checks for updates in the background
 *   2. If a new version is found → a non-intrusive toast appears:
 *      "Euclid v0.2.0 is available — Download"
 *   3. User clicks Download → progress bar shows download status
 *   4. Once downloaded → prompt changes to "Ready to install — Restart Now"
 *   5. User clicks Restart Now → app closes, installer runs, app reopens
 *   6. If the check fails (offline, rate-limited) → silent, no disruption
 *
 * On Windows (unsigned NSIS): the installer will trigger a UAC prompt
 * and possibly a SmartScreen warning because the app isn't code-signed.
 * This is normal for unsigned apps and the user just clicks "Run anyway".
 */

import { autoUpdater } from 'electron-updater';
import { BrowserWindow, ipcMain } from 'electron';
import log from './logger';

// ─── Types (mirrored in preload) ────────────────────────────

export interface UpdateStatus {
  state: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';
  version?: string;
  releaseDate?: string;
  releaseNotes?: string;
  progress?: number; // 0-100
  error?: string;
}

// ─── State ──────────────────────────────────────────────────

let currentStatus: UpdateStatus = { state: 'idle' };
let mainWindow: BrowserWindow | null = null;
let userRequestedUpdate = false; // true when user clicks "Download" (not auto)

// ─── Configure autoUpdater ──────────────────────────────────

// Pipe electron-updater logs through our logger
autoUpdater.logger = log;

// We control download manually so we can show progress
autoUpdater.autoDownload = false;

// When the app quits, install the update if it was downloaded
autoUpdater.autoInstallOnAppQuit = true;

// Allow downgrades (useful during development / rollback scenarios)
autoUpdater.allowDowngrade = false;

// ─── Helpers ────────────────────────────────────────────────

function sendStatus(status: UpdateStatus) {
  currentStatus = status;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('update-status', status);
  }
  // Also log so we can trace in log files
  const progress = status.progress !== undefined ? ` (${status.progress}%)` : '';
  log.info(`[Updater] ${status.state}${progress}${status.version ? ' → v' + status.version : ''}${status.error ? ' error: ' + status.error : ''}`);
}

// ─── Event handlers ─────────────────────────────────────────

autoUpdater.on('checking-for-update', () => {
  sendStatus({ state: 'checking' });
});

autoUpdater.on('update-available', (info) => {
  log.info('[Updater] Update available:', info);
  sendStatus({
    state: 'available',
    version: info.version,
    releaseDate: info.releaseDate,
    releaseNotes: typeof info.releaseNotes === 'string'
      ? info.releaseNotes
      : Array.isArray(info.releaseNotes)
        ? info.releaseNotes.map((n: { note?: string }) => n.note || '').join('\n')
        : undefined,
  });
});

autoUpdater.on('update-not-available', () => {
  sendStatus({ state: 'idle' });
});

autoUpdater.on('download-progress', (progress) => {
  sendStatus({
    state: 'downloading',
    version: currentStatus.version,
    progress: Math.round(progress.percent),
  });
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('[Updater] Update downloaded:', info);
  sendStatus({
    state: 'downloaded',
    version: info.version,
  });
});

autoUpdater.on('error', (err) => {
  log.error('[Updater] Error:', err.message);
  // Don't bother the user with errors unless they explicitly asked to update
  if (userRequestedUpdate) {
    sendStatus({
      state: 'error',
      error: err.message || 'Unknown update error',
    });
  } else {
    // Silent failure for background checks — just reset to idle
    sendStatus({ state: 'idle' });
  }
  userRequestedUpdate = false;
});

// ─── IPC Handlers ───────────────────────────────────────────

function registerIpcHandlers() {
  // Renderer asks for current status (e.g., on mount)
  ipcMain.handle('update:getStatus', () => currentStatus);

  // Renderer asks to start checking for updates
  ipcMain.handle('update:check', async () => {
    try {
      userRequestedUpdate = true;
      const result = await autoUpdater.checkForUpdates();
      return { success: true, version: result?.updateInfo?.version };
    } catch (err: any) {
      userRequestedUpdate = false;
      return { success: false, error: err.message || 'Check failed' };
    }
  });

  // Renderer asks to download the update (after user clicks "Download")
  ipcMain.handle('update:download', async () => {
    try {
      userRequestedUpdate = true;
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (err: any) {
      userRequestedUpdate = false;
      return { success: false, error: err.message || 'Download failed' };
    }
  });

  // Renderer asks to install (quit & restart with the downloaded update)
  ipcMain.handle('update:install', () => {
    // quitAndInstall closes the app and runs the installer.
    // The app will restart automatically after the install completes.
    autoUpdater.quitAndInstall(false, true);
    return { success: true };
  });
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Initialize the auto-updater. Call once after the main window is created.
 * Performs an initial silent check in the background.
 */
export function setupAutoUpdater(win: BrowserWindow) {
  mainWindow = win;
  registerIpcHandlers();

  // Run the first check after a short delay so the app can finish loading
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      log.warn('[Updater] Initial check failed (may be offline):', err.message);
    });
  }, 5000);
}

/**
 * Manually trigger an update check. Returns the update info if available.
 */
export async function checkForUpdates() {
  try {
    const result = await autoUpdater.checkForUpdates();
    return result?.updateInfo;
  } catch (err: any) {
    log.warn('[Updater] Manual check failed:', err.message);
    return null;
  }
}
