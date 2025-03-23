/**
 * Logger utility for debugging in development
 * 
 * Provides logging functions that output to both the console
 * and an on-screen logging element if it exists.
 */


// Définition explicite des constantes de niveau de log
var INFO = { label: 'INFO', color: '#3b82f6' };
var WARNING = { label: 'WARN', color: '#f59e0b' };
var ERROR = { label: 'ERROR', color: '#ef4444' };
var DEBUG = { label: 'DEBUG', color: '#10b981' };
var SESSION = { label: 'SESSION', color: '#8b5cf6' };

// Définir LOG_LEVELS
var LOG_LEVELS = {
  INFO: INFO,
  WARNING: WARNING,
  ERROR: ERROR,
  DEBUG: DEBUG,
  SESSION: SESSION
};

// Set this to true to enable verbose logging
const VERBOSE_LOGGING = true;

/**
 * Add a log entry to the on-screen logger
 */
const logToScreen = (message, level = INFO) => {
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
 * Helper function to safely stringify objects for logging
 */
const safeStringify = (data) => {
  if (!data) return '';
  
  try {
    return JSON.stringify(data, (key, value) => {
      // Handle circular references and functions
      if (typeof value === 'function') return '[Function]';
      if (key === 'password' || key === 'apiKey' || key === 'secret') return '[REDACTED]';
      return value;
    }, 2);
  } catch (e) {
    return '[Circular or complex object]';
  }
};

/**
 * Log information message
 */
const logInfo = (message, data = null) => {
  const formattedMsg = data ? `${message}` : message;
  console.info(`%c[INFO] ${formattedMsg}`, 'color: #3b82f6');
  if (data) {
    console.info(data);
  }
  logToScreen(formattedMsg, INFO);
};

/**
 * Log warning message
 */
const logWarning = (message, data = null) => {
  const formattedMsg = data ? `${message}` : message;
  console.warn(`%c[WARN] ${formattedMsg}`, 'color: #f59e0b');
  if (data) {
    console.warn(data);
  }
  logToScreen(formattedMsg, WARNING);
};

/**
 * Log error message
 */
const logError = (message, error = null) => {
  const errorDetails = error ? 
    (error instanceof Error ? error.message : safeStringify(error)) : '';
  const formattedMsg = errorDetails ? `${message}: ${errorDetails}` : message;
  
  console.error(`%c[ERROR] ${formattedMsg}`, 'color: #ef4444');
  logToScreen(formattedMsg, ERROR);
  
  if (error) {
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    } else {
      console.error(error);
    }
  }
};

/**
 * Log debug message
 */
const logDebug = (message, data = null) => {
  // Only log in development or if verbose logging is enabled
  if (process.env.NODE_ENV !== 'development' && !VERBOSE_LOGGING) return;
  
  const formattedMsg = data ? `${message}` : message;
  console.debug(`%c[DEBUG] ${formattedMsg}`, 'color: #10b981');
  if (data) {
    console.debug(data);
  }
  logToScreen(formattedMsg, DEBUG);
};

/**
 * Log session-related activities (special handling for session creation)
 */
const logSession = (message, data = null) => {
  // Always log session events regardless of environment
  const formattedMsg = data ? `${message}` : message;
  console.log(`%c[SESSION] ${formattedMsg}`, 'color: #8b5cf6; font-weight: bold');
  if (data) {
    console.log(data);
  }
  logToScreen(formattedMsg, SESSION);
};

/**
 * Log component lifecycle events
 */
const logComponentEvent = (componentName, event, props = null) => {
  logDebug(`${componentName} ${event}`, props);
};

// Default export with all log methods
const logger = {
  info: logInfo,
  warning: logWarning,
  error: logError,
  debug: logDebug,
  session: logSession,
  component: logComponentEvent
};

module.exports = logger; 

module.exports.logInfo = logInfo;
module.exports.logWarning = logWarning;
module.exports.logError = logError;
module.exports.logDebug = logDebug;
module.exports.logSession = logSession;
module.exports.logComponentEvent = logComponentEvent;
