/**
 * Log Store Module
 * 
 * Simple in-memory storage for application logs
 */

// Store for logs
const logs = [];
const MAX_LOGS = 100;

/**
 * Add a log entry to the store
 * @param {Object} logEntry - Log entry to add
 */
const addLog = (logEntry) => {
  logs.push(logEntry);
  
  // Limit the number of logs stored
  if (logs.length > MAX_LOGS) {
    logs.shift(); // Remove oldest log
  }
};

/**
 * Get all stored logs
 * @returns {Array} - Current logs
 */
const getLogs = () => {
  return [...logs];
};

/**
 * Clear all logs from store
 */
const clearLogs = () => {
  logs.length = 0;
};

// Export methods
module.exports = {
  addLog,
  getLogs,
  clearLogs
}; 
