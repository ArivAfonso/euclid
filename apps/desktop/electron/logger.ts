import log from 'electron-log/main';
import { app } from 'electron';

// Initialize logger (must be called before using log in main process)
log.initialize();

// Configure file transport
log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB per log file
log.transports.file.fileName = 'euclid-main.log';
log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

// Configure console transport format
log.transports.console.format = '[{level}] {text}';

// Set log levels based on environment
log.transports.file.level = app.isPackaged ? 'info' : 'silly';
log.transports.console.level = app.isPackaged ? 'warn' : 'debug';

// Log file location
const logPath = log.transports.file.getFile?.()?.path;
if (logPath) {
  log.info(`Log file: ${logPath}`);
} else {
  log.info(`Logs directory: ${app.getPath('userData')}/logs/`);
}

export default log;
