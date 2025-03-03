/**
 * Logger utility for debugging in development
 * 
 * Provides logging functions that output to both the console
 * and an on-screen logging element if it exists.
 */

const LOG_LEVELS = {
  INFO: { label: 'INFO', color: '#3b82f6' },
  WARNING: { label: 'WARN', color: '#f59e0b' },
  ERROR: { label: 'ERROR', color: '#ef4444' },
  DEBUG: { label: 'DEBUG', color: '#10b981' }
};

/**
 * Add a log entry to the on-screen logger
 */
const logToScreen = (message, level = LOG_LEVELS.INFO) => {
  if (typeof window === 'undefined') return;
  
  const loggerContent = document.getElementById('app-logger-content');
  if (!loggerContent) return;
  
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement('div');
  logEntry.innerHTML = `<span style="color: #9ca3af">${timestamp}</span> <span style="color: ${level.color}">[${level.label}]</span> ${message}`;
  
  loggerContent.appendChild(logEntry);
  loggerContent.scrollTop = loggerContent.scrollHeight;
};

/**
 * Log information message
 */
export const logInfo = (message, data = null) => {
  const formattedMsg = data ? `${message}: ${JSON.stringify(data)}` : message;
  console.info(`%c[INFO] ${formattedMsg}`, 'color: #3b82f6');
  logToScreen(formattedMsg, LOG_LEVELS.INFO);
};

/**
 * Log warning message
 */
export const logWarning = (message, data = null) => {
  const formattedMsg = data ? `${message}: ${JSON.stringify(data)}` : message;
  console.warn(`%c[WARN] ${formattedMsg}`, 'color: #f59e0b');
  logToScreen(formattedMsg, LOG_LEVELS.WARNING);
};

/**
 * Log error message
 */
export const logError = (message, error = null) => {
  const errorDetails = error ? 
    (error instanceof Error ? error.message : JSON.stringify(error)) : '';
  const formattedMsg = errorDetails ? `${message}: ${errorDetails}` : message;
  
  console.error(`%c[ERROR] ${formattedMsg}`, 'color: #ef4444');
  logToScreen(formattedMsg, LOG_LEVELS.ERROR);
  
  if (error && error instanceof Error && error.stack) {
    console.error(error.stack);
  }
};

/**
 * Log debug message
 */
export const logDebug = (message, data = null) => {
  // Only log in development
  if (process.env.NODE_ENV !== 'development') return;
  
  const formattedMsg = data ? `${message}: ${JSON.stringify(data)}` : message;
  console.debug(`%c[DEBUG] ${formattedMsg}`, 'color: #10b981');
  logToScreen(formattedMsg, LOG_LEVELS.DEBUG);
};

/**
 * Log component lifecycle events
 */
export const logComponentEvent = (componentName, event, props = null) => {
  logDebug(`${componentName} ${event}`, props);
};

// Default export with all log methods
const logger = {
  info: logInfo,
  warning: logWarning,
  error: logError,
  debug: logDebug,
  component: logComponentEvent
};

export default logger; 