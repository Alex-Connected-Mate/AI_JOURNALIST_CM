'use client';

import React, { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import useLogger from '@/hooks/useLogger';

/**
 * AuthChecker Component
 * Composant simplifié qui gère uniquement l'authentification
 */
const AuthChecker = () => {
  const { fetchUserProfile } = useStore();
  const logger = useLogger('AuthChecker');

  useEffect(() => {
    // Vérifier la session initiale
    const checkInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error('Error checking session', error);
        useStore.setState({ user: null, authChecked: true });
        return;
      }

      if (session?.user) {
        useStore.setState({ user: session.user, authChecked: true });
        try {
          await fetchUserProfile();
        } catch (error) {
          logger.error('Error fetching profile', error);
        }
      } else {
        useStore.setState({ user: null, authChecked: true });
      }
    };

    // Configurer le listener d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.auth(`Auth state changed: ${event}`);
      
      if (session?.user) {
        useStore.setState({ user: session.user, authChecked: true });
        try {
          await fetchUserProfile();
        } catch (error) {
          logger.error('Error fetching profile', error);
        }
      } else {
        useStore.setState({ user: null, authChecked: true });
      }
    });

    checkInitialSession();

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchUserProfile, logger]);

  return null;
};

export default AuthChecker; 