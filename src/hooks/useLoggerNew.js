/**
 * useLoggerNew.js
 * Hook pour la journalisation avancée 
 */

/**
 * Crée un logger personnalisé pour un contexte spécifique
 * @param {string} context - Le contexte d'utilisation du logger (ex: nom du composant)
 * @returns {Object} - Fonctions de journalisation
 */
function useLoggerNew(context = 'App') {
  // Niveau de journalisation (1: error, 2: warn, 3: info, 4: debug, 5: trace)
  const logLevel = typeof process !== 'undefined' && process.env.NODE_ENV === 'production' ? 2 : 5;
  
  // Formater un message de log
  const formatMessage = (level, message, data = {}) => {
    const timestamp = new Date().toISOString();
    
    // En production, simplifier le format
    const isProd = typeof process !== 'undefined' && process.env.NODE_ENV === 'production';
    
    if (isProd) {
      return {
        timestamp,
        level,
        context,
        message,
        ...data
      };
    }
    
    // En développement, format plus verbeux pour le débogage
    return {
      timestamp,
      level,
      context,
      message,
      ...data
    };
  };
  
  // Journaliser en console avec le niveau approprié
  const logToConsole = (level, formattedMessage) => {
    const { level: logLevel, context, message, ...rest } = formattedMessage;
    
    // Style de la console selon le niveau
    const styles = {
      error: 'color: white; background-color: #e74c3c; padding: 2px 4px; border-radius: 2px;',
      warn: 'color: #f39c12; font-weight: bold;',
      info: 'color: #3498db;',
      debug: 'color: #8e44ad;',
      trace: 'color: #7f8c8d;',
    };
    
    // Si des données supplémentaires sont présentes
    const hasData = Object.keys(rest).length > 0 && rest.timestamp === undefined;
    
    // Formatage selon la présence de données
    if (typeof window !== 'undefined') {
      // Navigateur
      if (hasData) {
        console[level](
          `%c${logLevel}%c ${context}: ${message}`,
          styles[logLevel],
          'color: inherit',
          rest
        );
      } else {
        console[level](
          `%c${logLevel}%c ${context}: ${message}`,
          styles[logLevel],
          'color: inherit'
        );
      }
    } else {
      // Serveur
      if (hasData) {
        console[level](`[${logLevel.toUpperCase()}] ${context}: ${message}`, rest);
      } else {
        console[level](`[${logLevel.toUpperCase()}] ${context}: ${message}`);
      }
    }
  };
  
  /**
   * Log niveau erreur
   * @param {string} message - Message d'erreur
   * @param {Object} data - Données additionnelles
   */
  const error = (message, data = {}) => {
    if (logLevel >= 1) {
      const formattedMessage = formatMessage('error', message, data);
      logToConsole('error', formattedMessage);
      return formattedMessage;
    }
  };
  
  /**
   * Log niveau avertissement
   * @param {string} message - Message d'avertissement
   * @param {Object} data - Données additionnelles
   */
  const warn = (message, data = {}) => {
    if (logLevel >= 2) {
      const formattedMessage = formatMessage('warn', message, data);
      logToConsole('warn', formattedMessage);
      return formattedMessage;
    }
  };
  
  /**
   * Log niveau information
   * @param {string} message - Message d'information
   * @param {Object} data - Données additionnelles
   */
  const info = (message, data = {}) => {
    if (logLevel >= 3) {
      const formattedMessage = formatMessage('info', message, data);
      logToConsole('info', formattedMessage);
      return formattedMessage;
    }
  };
  
  /**
   * Log niveau débogage
   * @param {string} message - Message de débogage
   * @param {Object} data - Données additionnelles
   */
  const debug = (message, data = {}) => {
    if (logLevel >= 4) {
      const formattedMessage = formatMessage('debug', message, data);
      logToConsole('debug', formattedMessage);
      return formattedMessage;
    }
  };
  
  /**
   * Log niveau trace (très détaillé)
   * @param {string} message - Message de trace
   * @param {Object} data - Données additionnelles 
   */
  const trace = (message, data = {}) => {
    if (logLevel >= 5) {
      const formattedMessage = formatMessage('trace', message, data);
      logToConsole('debug', formattedMessage); // Utiliser debug car trace n'existe pas dans la console
      return formattedMessage;
    }
  };
  
  /**
   * Log spécifique pour la navigation
   * @param {string} message - Message lié à la navigation
   * @param {Object} data - Données additionnelles
   */
  const navigation = (message, data = {}) => {
    return info(`[Navigation] ${message}`, data);
  };
  
  /**
   * Log spécifique pour l'authentification
   * @param {string} message - Message lié à l'authentification
   * @param {Object} data - Données additionnelles
   */
  const auth = (message, data = {}) => {
    return info(`[Auth] ${message}`, data);
  };
  
  // HMR disabled - removed problematic import.meta.webpackHot
  /* if (typeof window !== "undefined" && module && module.hot) { module.hot.accept() } */
  
  // Retourner l'API du logger
  return {
    error,
    warn,
    info,
    debug,
    trace,
    navigation,
    auth
  };
}

// Exporter le hook en CommonJS
module.exports = { useLoggerNew }; 