'use strict';

/**
 * Implémentation sécurisée du logger qui fonctionne en mode CommonJS
 */

// Importing logStore for managing logs
const logStore = require('../lib/logStore');

// useLogger Hook Configuration
const config = {
  // Default log level
  level: 'info',
  
  // Enable or disable logging
  enabled: true,
  
  // Maximum logs to store in memory
  maxLogs: 100,
  
  // Log to console
  logToConsole: true,
};

/**
 * Helper function to format log messages
 * @param {string} message - The log message
 * @param {Object} data - Optional data to include in the log
 * @returns {string} - Formatted log message
 */
const formatLogMessage = (message, data) => {
  if (data) {
    try {
      return `${message} ${JSON.stringify(data)}`;
    } catch (error) {
      return `${message} [Object cannot be stringified]`;
    }
  }
  return message;
};

/**
 * useLogger Hook
 * 
 * Provides logging functionality with different log levels
 * and options for log storage and display.
 * 
 * @returns {Object} - Logging methods (debug, info, warn, error)
 */
function appLogger() {
  // Internal helper to log with level
  const log = (level, message, data) => {
    if (!config.enabled || !passesLogLevel(level)) return;
    
    const formattedMessage = formatLogMessage(message, data);
    const timestamp = new Date().toISOString();
    const logEntry = { level, message: formattedMessage, timestamp };
    
    // Store log in memory
    logStore.addLog(logEntry);
    
    // Log to console if enabled
    if (config.logToConsole) {
      const consoleMethod = level === 'error' ? 'error' : 
                           level === 'warn' ? 'warn' : 
                           level === 'debug' ? 'debug' : 'log';
      console[consoleMethod](`[${level.toUpperCase()}] ${formattedMessage}`);
    }
    
    return logEntry;
  };

  // Check if log level passes current config level
  const passesLogLevel = (level) => {
    const levels = ['debug', 'info', 'warn', 'error'];
    const configLevelIndex = levels.indexOf(config.level);
    const logLevelIndex = levels.indexOf(level);
    return logLevelIndex >= configLevelIndex;
  };

  // Public API
  return {
    // Log methods
    debug: (message, data) => log('debug', message, data),
    info: (message, data) => log('info', message, data),
    warn: (message, data) => log('warn', message, data),
    error: (message, data) => log('error', message, data),
    
    // Configuration methods
    getConfig: () => ({ ...config }),
    setConfig: (newConfig) => {
      Object.assign(config, newConfig);
    },
    
    // Access logs
    getLogs: () => logStore.getLogs(),
    clearLogs: () => logStore.clearLogs(),
  };
}

// Export the hook for use in components
module.exports = appLogger; 