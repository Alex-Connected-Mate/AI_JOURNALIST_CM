import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Box, CircularProgress } from '@mui/material';
import { useLoggerNew } from '../hooks/useLoggerNew';

/**
 * AuthChecker Component
 * 
 * Un composant pour vérifier et mettre à jour l'état d'authentification.
 * Il s'assure que l'utilisateur est correctement synchronisé avec Supabase.
 * 
 * Peut être utilisé de deux façons:
 * 1. Comme composant autonome pour une vérification silencieuse (<AuthChecker />)
 * 2. Comme wrapper pour protéger du contenu (<AuthChecker>{children}</AuthChecker>)
 */
const AuthChecker = ({ children }) => {
  const router = useRouter();
  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const log = useLoggerNew('AuthChecker');

  useEffect(() => {
    // Skip auth check for public pages
    const publicPaths = ['/auth/login', '/auth/register', '/auth/reset-password'];
    
    if (publicPaths.includes(router.pathname)) {
      setIsLoading(false);
      return;
    }

    const checkUser = async () => {
      try {
        log.info('Vérification de l\'authentification utilisateur');
        
        if (!user) {
          log.warn('Utilisateur non authentifié, redirection vers login');
          router.push('/auth/login');
        } else {
          log.info('Utilisateur authentifié', { userId: user.id });
        }
      } catch (error) {
        log.error('Erreur lors de la vérification de l\'authentification', { error });
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [user, router, supabaseClient, log]);

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
};

export default AuthChecker; 