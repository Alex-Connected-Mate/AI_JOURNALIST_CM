import { useEffect } from 'react';
import eventTracker from '@/lib/eventTracker';

/**
 * Composant invisible qui initialise le système de suivi d'événements
 * au démarrage de l'application.
 */
const EventTrackerInitializer = () => {
  useEffect(() => {
    // Initialiser le suivi des erreurs et événements
    if (typeof window !== 'undefined') {
      console.info('🔍 Initialisation du système de suivi d\'événements...');
      
      // Configuration des écouteurs d'événements globaux
      eventTracker.setupGlobalErrorTracking();
      eventTracker.setupGlobalEventTracking();
      
      // Enregistrer l'événement d'initialisation de l'application
      eventTracker.trackEvent(
        eventTracker.EVENT_TYPES.CUSTOM,
        'app_initialized',
        {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
          language: navigator.language,
          platform: navigator.platform,
          referrer: document.referrer
        }
      );
    }
    
    return () => {
      // Rien à nettoyer, les écouteurs d'événements sont supprimés lors de la fermeture de la page
    };
  }, []);

  // Ce composant ne rend rien visuellement
  return null;
};

export default EventTrackerInitializer; 