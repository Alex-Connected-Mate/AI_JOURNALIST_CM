/**
 * useLogger.js
 * 
 * ATTENTION: Ce fichier est obsolète et sert uniquement de proxy vers useLoggerNew
 * Ce fichier est conservé pour assurer la compatibilité avec le code existant
 * Utilisez useLoggerNew.js directement pour les nouveaux développements
 */

const { useLoggerNew } = require('./useLoggerNew');

// Export en CommonJS pour éviter les problèmes de module
module.exports = {
  useLogger: useLoggerNew
}; 