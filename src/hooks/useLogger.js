import { useCallback, useRef } from 'react';
import useLogStore, { LogType } from '@/lib/logStore';

// Cache global pour éviter les logs trop fréquents et redondants
const logCache = new Map();
const LOG_CACHE_EXPIRY = 1000; // ms

/**
 * Hook pour faciliter la journalisation dans l'application
 * 
 * Exemple d'utilisation:
 * ```
 * const logger = useLogger('AuthComponent');
 * 
 * // Plus tard dans le code:
 * logger.info('Tentative de connexion');
 * logger.error('Échec de connexion', {code: 401, message: 'Identifiants invalides'});
 * ```
 */
const useLogger = (componentName = '') => {
  const { addLog } = useLogStore();
  const prefix = componentName ? `[${componentName}] ` : '';
  const lastLogTimeRef = useRef({});
  
  // Fonction principale de logging avec protection contre les appels trop fréquents
  const log = useCallback((type, message, data = null) => {
    const fullMessage = `${prefix}${message}`;
    const cacheKey = `${type}:${fullMessage}:${JSON.stringify(data)}`;
    const now = Date.now();
    
    // Vérifier si le même message a été loggé récemment (protection contre boucles)
    if (logCache.has(cacheKey)) {
      const lastTime = logCache.get(cacheKey);
      if (now - lastTime < LOG_CACHE_EXPIRY) {
        // Loggé trop récemment, éviter la mise à jour d'état
        return null;
      }
    }
    
    // Vérifier si un message du même type a été loggé trop récemment
    const lastTypeTime = lastLogTimeRef.current[type] || 0;
    if (now - lastTypeTime < 100) { // Throttle par type de log
      console.log(`[THROTTLED][${type.toUpperCase()}] ${fullMessage}`, data || '');
      return null;
    }
    
    // Mettre à jour les caches
    logCache.set(cacheKey, now);
    lastLogTimeRef.current[type] = now;
    
    // Nettoyer le cache périodiquement
    setTimeout(() => {
      logCache.delete(cacheKey);
    }, LOG_CACHE_EXPIRY);
    
    return addLog(type, fullMessage, data);
  }, [addLog, prefix]);
  
  return {
    // Méthodes de journalisation générales
    log: (message, data) => log(LogType.INFO, message, data),
    info: (message, data) => log(LogType.INFO, message, data),
    warn: (message, data) => log(LogType.WARNING, message, data),
    error: (message, data) => log(LogType.ERROR, message, data),
    
    // Méthodes de journalisation spécifiques
    auth: (message, data) => log(LogType.AUTH, message, data),
    navigation: (message, data) => log(LogType.NAVIGATION, message, data),
    api: (message, data) => log(LogType.API, message, data),
    state: (message, data) => log(LogType.STATE, message, data),
    
    // Alias pour la compatibilité avec console.*
    debug: (message, data) => log(LogType.INFO, message, data),
  };
};

export default useLogger; 