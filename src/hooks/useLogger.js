/**
 * useLogger.js (DÉPRÉCIÉ)
 * Ce fichier ne sert que de proxy vers useLoggerNew.js
 * Il est conservé pour la compatibilité avec le code existant.
 */

const { useLoggerNew } = require('./useLoggerNew');

// Utiliser la nouvelle implémentation 
module.exports = useLoggerNew; 