/**
 * Logger utility for debugging in development
 * 
 * Provides logging functions that output to both the console
 * and an on-screen logging element if it exists.
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3
};

const currentLogLevel = process.env.NEXT_PUBLIC_LOG_LEVEL || 'INFO';

class Logger {
  constructor() {
    this.logLevel = LOG_LEVELS[currentLogLevel] || LOG_LEVELS.INFO;
  }

  _shouldLog(level) {
    return LOG_LEVELS[level] >= this.logLevel;
  }

  _formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}][${level}]`;
    
    if (data) {
      if (data instanceof Error) {
        return `${prefix} ${message}: ${data.message}\n${data.stack}`;
      }
      return `${prefix} ${message}: ${JSON.stringify(data)}`;
    }
    
    return `${prefix} ${message}`;
  }

  debug(message, data) {
    if (this._shouldLog('DEBUG')) {
      console.debug(this._formatMessage('DEBUG', message, data));
    }
  }

  info(message, data) {
    if (this._shouldLog('INFO')) {
      console.info(this._formatMessage('INFO', message, data));
    }
  }

  warning(message, data) {
    if (this._shouldLog('WARNING')) {
      console.warn(this._formatMessage('WARNING', message, data));
    }
  }

  error(message, data) {
    if (this._shouldLog('ERROR')) {
      console.error(this._formatMessage('ERROR', message, data));
    }
  }
}

const logger = new Logger();
export default logger; 