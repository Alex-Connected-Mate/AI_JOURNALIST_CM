import React, { ReactNode, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { useSupabase } from '@/lib/supabaseClient';
const { useLoggerNew } = require('../hooks/useLoggerNew');

interface AppInitializerProps {
  children: ReactNode;
}

/**
 * Composant chargé d'initialiser l'application et ses dépendances
 * 
 * Il s'occupe de:
 * - Vérifier l'état d'authentification
 * - Initialiser les services nécessaires
 * - Configurer les listeners globaux
 * - Charger les configurations initiales
 */
const AppInitializer: React.FC<AppInitializerProps> = ({ children }) => {
  const { supabase } = useSupabase();
  const user = useUser();
  const router = useRouter();
  const logger = useLoggerNew('AppInitializer');
  
  // Initialisation au montage du composant
  useEffect(() => {
    // Éviter d'exécuter côté serveur
    if (typeof window === 'undefined') return;
    
    logger.info('App initialization started');
    
    // Vérifier la connexion à Supabase
    if (supabase) {
      logger.debug('Supabase client initialized');
    }
    
    // Vérifier l'état d'authentification
    if (user) {
      logger.debug('User is authenticated', { 
        id: user.id,
        email: user.email 
      });
    } else {
      logger.debug('No authenticated user');
    }
    
    // Configurer les listeners pour les événements de connexion réseau
    window.addEventListener('online', () => {
      logger.info('Network connection restored');
    });
    
    window.addEventListener('offline', () => {
      logger.warn('Network connection lost');
    });
    
    // Nettoyer les listeners au démontage
    return () => {
      window.removeEventListener('online', () => {});
      window.removeEventListener('offline', () => {});
      logger.debug('App cleanup complete');
    };
  }, [supabase, user, logger]);
  
  return <>{children}</>;
};

export default AppInitializer; 