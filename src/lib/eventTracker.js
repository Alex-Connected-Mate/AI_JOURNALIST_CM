/**
 * eventTracker.js
 * 
 * Système de suivi des événements utilisateur pour le débogage
 * Capture les clics, les changements de formulaire, les navigations et les erreurs
 * Version optimisée pour éviter d'interférer avec les composants React
 */

// Store temporaire pour les événements (limité aux 100 derniers)
let events = [];
const MAX_EVENTS = 100;

// Types d'événements
export const EVENT_TYPES = {
  CLICK: 'click',
  CHANGE: 'change',
  SUBMIT: 'submit',
  NAVIGATION: 'navigation',
  ERROR: 'error',
  API: 'api',
  VALIDATION: 'validation',
  SESSION: 'session',
  AUTH: 'auth',
  CUSTOM: 'custom'
};

// Liste des propriétés à ignorer pour éviter les conflits
const IGNORED_PROPS = ['onValidate'];
const IGNORED_ERROR_PATTERNS = ['onValidate', 'Unknown event handler'];

/**
 * Enregistre un événement utilisateur
 * 
 * @param {string} type - Type d'événement (voir EVENT_TYPES)
 * @param {string} action - Action spécifique (ex: "button_click", "form_submit")
 * @param {object} details - Détails supplémentaires sur l'événement
 * @param {object} target - Élément cible de l'événement (optionnel)
 */
export const trackEvent = (type, action, details = {}, target = null) => {
  // Ne pas enregistrer les événements liés aux propriétés ignorées
  if (action && IGNORED_PROPS.some(prop => action.includes(prop))) {
    return null;
  }
  
  // Ne pas enregistrer les erreurs liées aux propriétés ignorées
  if (type === EVENT_TYPES.ERROR && details && details.message && 
      IGNORED_ERROR_PATTERNS.some(pattern => details.message.includes(pattern))) {
    return null;
  }

  const timestamp = new Date();

  // Extraction des informations de l'élément ciblé si disponible
  let targetInfo = null;
  if (target) {
    const element = target.tagName?.toLowerCase() || 'unknown';
    const id = target.id || null;
    const className = target.className || null;
    const text = target.innerText?.substring(0, 50) || null;
    const name = target.name || null;
    const value = target.value ? (typeof target.value === 'string' ? target.value.substring(0, 100) : '[complex value]') : null;
    
    targetInfo = { element, id, className, text, name, value };
  }

  // Création de l'événement
  const event = {
    id: Date.now(),
    timestamp,
    type,
    action,
    details,
    target: targetInfo,
    url: typeof window !== 'undefined' ? window.location.href : null
  };

  // Ajout de l'événement à la liste
  events = [event, ...events.slice(0, MAX_EVENTS - 1)];

  // Émission d'un événement personnalisé pour les abonnés
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:event_tracked', { detail: event }));
  }

  // Log en console pour développement
  if (process.env.NODE_ENV === 'development') {
    // Ne pas logger dans la console les événements liés aux propriétés ignorées
    // pour éviter de créer des boucles infinies
    if (!IGNORED_ERROR_PATTERNS.some(pattern => 
      (typeof details.message === 'string' && details.message.includes(pattern)) ||
      (typeof action === 'string' && action.includes(pattern))
    )) {
      console.debug(`[EVENT][${type.toUpperCase()}] ${action}`, details);
    }
  }

  return event;
};

/**
 * Récupère tous les événements enregistrés
 * 
 * @returns {Array} Liste des événements
 */
export const getEvents = () => {
  return [...events];
};

/**
 * Efface tous les événements
 */
export const clearEvents = () => {
  events = [];
};

/**
 * Exporte les événements au format JSON
 * 
 * @returns {string} JSON des événements
 */
export const exportEvents = () => {
  return JSON.stringify(events, null, 2);
};

/**
 * Capture les erreurs globales et les enregistre
 * Version sécurisée qui évite les interférences avec les composants React
 */
export const setupGlobalErrorTracking = () => {
  if (typeof window === 'undefined') return;

  // Capture des erreurs non gérées
  window.addEventListener('error', (event) => {
    // Ignorer les erreurs liées à onValidate et autres propriétés React connues
    if (event.message && IGNORED_ERROR_PATTERNS.some(pattern => event.message.includes(pattern))) {
      return;
    }
    
    trackEvent(
      EVENT_TYPES.ERROR,
      'unhandled_error',
      {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      }
    );
  });

  // Capture des rejets de promesses non gérés
  window.addEventListener('unhandledrejection', (event) => {
    // Ignorer les rejets liés aux propriétés ignorées
    if (event.reason?.message && IGNORED_ERROR_PATTERNS.some(pattern => 
      event.reason.message.includes(pattern)
    )) {
      return;
    }
    
    trackEvent(
      EVENT_TYPES.ERROR,
      'unhandled_promise_rejection',
      {
        reason: event.reason?.message || String(event.reason),
        stack: event.reason?.stack
      }
    );
  });
};

/**
 * Attache des écouteurs d'événements spécifiques qui n'interfèrent pas
 * avec les comportements natifs des composants
 */
export const setupGlobalEventTracking = () => {
  if (typeof window === 'undefined') return;

  // Ne pas suivre les événements en production
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Version très légère qui ne suit que les changements de page
  // et les erreurs, sans interférer avec les composants
  window.addEventListener('popstate', () => {
    trackEvent(
      EVENT_TYPES.NAVIGATION,
      'page_navigation',
      {
        url: window.location.href,
        title: document.title
      }
    );
  });
};

// Export par défaut
export default {
  trackEvent,
  getEvents,
  clearEvents,
  exportEvents,
  setupGlobalErrorTracking,
  setupGlobalEventTracking,
  EVENT_TYPES
}; 