/**
 * sessionTracker.js
 * 
 * Utilitaire pour suivre les événements et erreurs spécifiques 
 * à la création et gestion des sessions
 */

import eventTracker, { EVENT_TYPES } from '@/lib/eventTracker';
import logger from '@/lib/logger';

/**
 * Enregistre un événement lié à la création de session
 * 
 * @param {string} action - Action spécifique (ex: "session_create_start", "session_validation_error")
 * @param {any} data - Données de la session
 * @param {any} error - Erreur éventuelle
 */
export const trackSessionEvent = (action, data = {}, error = null) => {
  // Filtrer les données sensibles ou volumineuses
  const safeData = { ...data };
  
  // Supprimer les champs très volumineux qui ne sont pas nécessaires pour le débogage
  if (safeData.settings?.aiInteraction?.nuggetsRules?.customRules) {
    safeData.settings.aiInteraction.nuggetsRules.customRules = 
      safeData.settings.aiInteraction.nuggetsRules.customRules.length > 100 ? 
      '[TRUNCATED]' : safeData.settings.aiInteraction.nuggetsRules.customRules;
  }
  
  // Données de base de l'événement
  const details = {
    sessionData: safeData
  };
  
  // Ajouter les informations d'erreur si disponibles
  if (error) {
    details.error = {
      message: error.message || String(error),
      code: error.code,
      stack: error.stack,
      name: error.name,
      // For database errors
      hint: error.hint,
      detail: error.detail,
      constraint: error.constraint
    };
    
    // Log full error to console for easier debugging
    logger.error(`Session event error: ${action}`, error);
  } else {
    // Log successful events
    logger.session(`Session event: ${action}`, details);
  }
  
  // Enregistrer l'événement
  return eventTracker.trackEvent(EVENT_TYPES.SESSION, action, details);
};

/**
 * Suit le processus de création de session
 */
export const trackSessionCreation = {
  // Début de création
  start: (sessionConfig) => {
    logger.session('Starting session creation', sessionConfig);
    return trackSessionEvent('session_create_start', sessionConfig);
  },
  
  // Validation
  validation: (sessionConfig, validationResult) => {
    const action = validationResult.isValid ? 
      'session_validation_success' : 
      'session_validation_error';
    
    if (validationResult.isValid) {
      logger.session('Session validation passed', validationResult);
    } else {
      logger.error('Session validation failed', validationResult.error);
    }
      
    return trackSessionEvent(action, sessionConfig, 
      validationResult.isValid ? null : { message: validationResult.error });
  },
  
  // Transformation des données
  transform: (sessionConfig, transformedData) => {
    logger.session('Session data transformed', {
      original: sessionConfig,
      transformed: transformedData
    });
    return trackSessionEvent('session_data_transform', {
      original: sessionConfig,
      transformed: transformedData
    });
  },
  
  // Soumission à l'API
  submit: (sessionData) => {
    logger.session('Submitting session to API', sessionData);
    return trackSessionEvent('session_submit', sessionData);
  },
  
  // Succès
  success: (sessionData, response) => {
    logger.session('Session created successfully', response);
    return trackSessionEvent('session_create_success', {
      request: sessionData,
      response
    });
  },
  
  // Échec
  error: (sessionData, error) => {
    logger.error('Session creation failed', error);
    return trackSessionEvent('session_create_error', sessionData, error);
  }
};

/**
 * Fonctions utilitaires pour suivre les erreurs de chargement de session
 */
export const trackSessionLoading = {
  start: (sessionId) => {
    logger.session('Loading session', { sessionId });
    return trackSessionEvent('session_load_start', { sessionId });
  },
  
  success: (sessionId, sessionData) => {
    logger.session('Session loaded successfully', { 
      sessionId, 
      sessionData
    });
    return trackSessionEvent('session_load_success', { 
      sessionId, 
      sessionData
    });
  },
  
  error: (sessionId, error) => {
    logger.error('Failed to load session', { sessionId, error });
    return trackSessionEvent('session_load_error', { sessionId }, error);
  }
};

export default {
  trackSessionEvent,
  trackSessionCreation,
  trackSessionLoading
}; 