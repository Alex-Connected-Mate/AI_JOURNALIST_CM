'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import useLogger from '@/hooks/useLogger';

/**
 * AuthChecker Component
 * Vérifie l'état d'authentification et initialise l'application
 */
const AuthChecker = () => {
  const { initApp, authChecked, appInitialized } = useStore();
  const logger = useLogger('AuthChecker');
  const [initialized, setInitialized] = useState(false);

  // Initialisation de l'application au démarrage
  useEffect(() => {
    // Éviter une double initialisation
    if (appInitialized || initialized) {
      return;
    }
    
    setInitialized(true);
    logger.info('Initializing application');
    
    initApp().catch(error => {
      logger.error('Application initialization failed', error);
    });
  }, [initApp, appInitialized, initialized, logger]);

  // Configuration du listener d'authentification pour les changements d'état
  useEffect(() => {
    if (!appInitialized) return;
    
    logger.info('Setting up auth state change listener');
    
    // Configurer le listener d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.auth(`Auth state changed: ${event}`);
      
      // Sur déconnexion, réinitialiser le store
      if (event === 'SIGNED_OUT') {
        useStore.setState({ 
          user: null, 
          userProfile: null, 
          sessions: [],
          authChecked: true,
          appInitialized: false // Forcer une réinitialisation lors de la prochaine connexion
        });
        
        // Nettoyage forcé du localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('app-storage');
        }
        
        return;
      }
      
      // Sur connexion, vérifier si l'app doit être réinitialisée
      if (event === 'SIGNED_IN' && !appInitialized) {
        logger.info('User signed in, reinitializing app');
        
        try {
          await initApp();
        } catch (error) {
          logger.error('Failed to reinitialize app after sign in', error);
        }
      }
    });

    return () => {
      logger.info('Cleaning up auth listener');
      authListener?.subscription?.unsubscribe();
    };
  }, [appInitialized, initApp, logger]);

  // Ne renvoyer aucun élément visible
  return null;
};

export default AuthChecker; 