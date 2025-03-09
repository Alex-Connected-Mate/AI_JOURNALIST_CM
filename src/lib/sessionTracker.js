/**
 * sessionTracker.js
 * 
 * Utilitaire pour suivre les événements et erreurs spécifiques 
 * à la création et gestion des sessions
 */

import eventTracker, { EVENT_TYPES } from '@/lib/eventTracker';

/**
 * Enregistre un événement lié à la création de session
 * 
 * @param {string} action - Action spécifique (ex: "session_create_start", "session_validation_error")
 * @param {object} data - Données de la session
 * @param {object} error - Erreur éventuelle
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
    };
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
    return trackSessionEvent('session_create_start', sessionConfig);
  },
  
  // Validation
  validation: (sessionConfig, validationResult) => {
    const action = validationResult.isValid ? 
      'session_validation_success' : 
      'session_validation_error';
    
    return trackSessionEvent(action, sessionConfig, 
      validationResult.isValid ? null : { message: validationResult.error });
  },
  
  // Transformation des données
  transform: (sessionConfig, transformedData) => {
    return trackSessionEvent('session_data_transform', {
      original: sessionConfig,
      transformed: transformedData
    });
  },
  
  // Soumission à l'API
  submit: (sessionData) => {
    return trackSessionEvent('session_submit', sessionData);
  },
  
  // Succès
  success: (sessionData, response) => {
    return trackSessionEvent('session_create_success', {
      request: sessionData,
      response
    });
  },
  
  // Échec
  error: (sessionData, error) => {
    return trackSessionEvent('session_create_error', sessionData, error);
  }
};

/**
 * Fonctions utilitaires pour suivre les erreurs de chargement de session
 */
export const trackSessionLoading = {
  start: (sessionId) => {
    return trackSessionEvent('session_load_start', { sessionId });
  },
  
  success: (sessionId, sessionData) => {
    return trackSessionEvent('session_load_success', { 
      sessionId, 
      sessionData
    });
  },
  
  error: (sessionId, error) => {
    return trackSessionEvent('session_load_error', { sessionId }, error);
  }
};

export default {
  trackSessionEvent,
  trackSessionCreation,
  trackSessionLoading
}; 