import React, { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useUser, useSessionContext } from '@supabase/auth-helpers-react';
import { styled } from '@mui/system';
import { Box, CircularProgress, Typography } from '@mui/material';
const { useLoggerNew } = require('../hooks/useLoggerNew');

// Définition des types pour les props
interface AuthCheckerProps {
  children: ReactNode;
  redirectTo?: string;
  requiredRole?: string | null;
  isAuthPage?: boolean;
}

// Styles pour le composant de chargement
const LoaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '90vh',
  width: '100%',
}));

const StyledCircularProgress = styled(CircularProgress)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const AuthChecker: React.FC<AuthCheckerProps> = ({ 
  children, 
  redirectTo = '/auth/login', 
  requiredRole = null, 
  isAuthPage = false 
}) => {
  const router = useRouter();
  const user = useUser();
  const { isLoading, session, error } = useSessionContext();
  const [clientLoaded, setClientLoaded] = useState(false);
  
  const logger = useLoggerNew('AuthChecker');

  useEffect(() => {
    // This ensures we only run client-side navigation after hydration
    setClientLoaded(true);
  }, []);

  useEffect(() => {
    // Log l'état actuel de l'authentification à chaque changement
    logger.debug('Auth state changed', {
      isLoading,
      hasUser: !!user,
      hasSession: !!session,
      hasError: !!error,
      isAuthPage,
      requiredRole,
      redirectTo,
    });
    
    if (error) {
      logger.error('Auth error', { error });
    }
    
    // Si nous sommes sur le client et que le chargement est terminé (le composant de supabase a vérifié le statut d'authentification)
    if (clientLoaded && !isLoading) {
      if (isAuthPage) {
        // Sur une page d'auth, si on est authentifié, on redirige vers la dashboard
        if (user) {
          logger.info('User is authenticated on auth page, redirecting to dashboard');
          router.replace('/dashboard');
        }
      } else {
        // Sur une page protégée, si on n'est pas authentifié, on redirige vers la page de login
        if (!user) {
          logger.info('User is not authenticated on protected page, redirecting to login');
          router.replace(redirectTo || '/auth/login');
        }
        
        // Si un rôle spécifique est requis, vérifier que l'utilisateur a ce rôle
        if (requiredRole && user) {
          // Implémenter la vérification de rôle ici si nécessaire
          // Actuellement un stub pour une future implémentation
          const hasRequiredRole = true; // À remplacer par une vraie vérification
          
          if (!hasRequiredRole) {
            logger.warn('User lacks required role, redirecting to dashboard', { requiredRole });
            router.replace('/dashboard');
          }
        }
      }
    }
  }, [isLoading, user, session, clientLoaded, router, isAuthPage, redirectTo, requiredRole, error]);

  // Pendant le chargement ou l'initialisation du routeur Next, afficher un loader
  if (isLoading || !clientLoaded) {
    return (
      <LoaderContainer>
        <StyledCircularProgress />
        <Typography variant="body1">Chargement...</Typography>
      </LoaderContainer>
    );
  }

  // Si on est sur une page d'authentification et qu'on n'est pas connecté, ou
  // si on est sur une page protégée et qu'on est connecté (avec le bon rôle si requis),
  // alors afficher le contenu des enfants.
  // Dans tous les autres cas, on est en train de rediriger, donc continuer à afficher le loader.
  const shouldRenderChildren = 
    (isAuthPage && !user) || 
    (!isAuthPage && user);
  
  if (shouldRenderChildren) {
    return <>{children}</>;
  }
  
  // Si on n'affiche pas les enfants, c'est qu'on est en train de rediriger
  return (
    <LoaderContainer>
      <StyledCircularProgress />
      <Typography variant="body1">Redirection en cours...</Typography>
    </LoaderContainer>
  );
};

export default AuthChecker; 