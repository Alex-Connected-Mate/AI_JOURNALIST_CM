'use client';

import React, { Suspense, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import useLogger from '@/hooks/useLogger';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

function AuthCheckerContent() {
  const { user, fetchUserProfile } = useStore();
  const logger = useLogger('AuthChecker');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Référence pour suivre les changements de route
  const previousPathRef = useRef('');
  const setupDoneRef = useRef(false);
  
  // State management helpers - these functions are missing from the store type
  const setUser = (userData: any) => {
    useStore.setState({ user: userData });
  };
  
  const setAuthChecked = (value: boolean) => {
    useStore.setState({ authChecked: value });
  };
  
  // Enregistrer uniquement les changements de route significatifs
  useEffect(() => {
    if (pathname !== previousPathRef.current) {
      previousPathRef.current = pathname || '';
      logger.navigation(`Route changed: ${pathname}`);
    }
  }, [pathname, logger]);

  // Configurer l'authentification une seule fois au chargement initial
  useEffect(() => {
    // Éviter de configurer plusieurs fois
    if (setupDoneRef.current) return;
    setupDoneRef.current = true;
    
    logger.auth('Setting up authentication checker');
    
    // Récupérer les informations de session de Supabase
    const getSessionFromSupabase = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('Error checking session', { error: error.message });
          setUser(null);
          setAuthChecked(true);
          return;
        }
        
        if (data?.session?.user) {
          logger.auth('User found in Supabase session', { userId: data.session.user.id });
          
          // Définir l'utilisateur dans le store
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || '',
          });
          
          // Essayer de récupérer le profil utilisateur, mais ne pas bloquer la suite du processus
          try {
            // Rendre asynchrone pour ne pas bloquer
            setTimeout(() => {
              fetchUserProfile().catch(profileError => {
                logger.error('Error fetching user profile, but continuing', profileError);
              });
            }, 0);
          } catch (profileError) {
            logger.error('Error initiating profile fetch, but continuing', profileError);
          }
          
          // Vérifier si nous sommes sur une page d'authentification qui nécessite une redirection
          const isAuthPage = pathname?.startsWith('/auth/');
          const redirectParam = searchParams?.get('redirect');
          
          if (isAuthPage && redirectParam) {
            const redirectTo = redirectParam || '/dashboard';
            logger.navigation(`Redirecting authenticated user from auth page to: ${redirectTo}`);
            router.push(redirectTo);
          }
        } else {
          logger.auth('No authenticated user found in Supabase session');
          setUser(null);
        }
        
        // Indiquer que la vérification d'authentification est terminée
        setAuthChecked(true);
      } catch (err) {
        logger.error('Unexpected error checking session', err);
        setUser(null);
        setAuthChecked(true);
      }
    };

    // Configurer le listener d'authentification Supabase
    const setupAuthListener = () => {
      logger.auth('Setting up Supabase auth listener');
      
      const { data: authListener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          logger.auth(`Auth state changed: ${event}`);
          
          if (event === 'SIGNED_IN' && session?.user) {
            logger.auth('User signed in via listener', { userId: session.user.id });
            
            setUser({
              id: session.user.id,
              email: session.user.email || '',
            });
            
            // Si on est sur une page d'authentification, rediriger vers le tableau de bord
            if (pathname?.startsWith('/auth/')) {
              const redirectParam = searchParams?.get('redirect');
              const redirectTo = redirectParam || '/dashboard';
              logger.navigation(`Redirecting from auth page after sign in: ${redirectTo}`);
              router.push(redirectTo);
            }
          } else if (event === 'SIGNED_OUT') {
            logger.auth('User signed out via listener');
            setUser(null);
            
            // Rediriger vers la page de connexion si nécessaire
            if (!pathname?.startsWith('/auth/') && pathname !== '/') {
              logger.navigation('Redirecting to login after sign out');
              router.push('/auth/login');
            }
          }
          
          // Indiquer que la vérification d'authentification est terminée
          setAuthChecked(true);
        }
      );
      
      return authListener;
    };

    // Exécuter les vérifications
    getSessionFromSupabase();
    const authListener = setupAuthListener();
    
    // Nettoyer le listener
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [fetchUserProfile, router, pathname, searchParams, logger]);

  return null;
}

/**
 * AuthChecker Component
 * 
 * Un composant pour vérifier et mettre à jour l'état d'authentification.
 * Il s'assure que l'utilisateur est correctement synchronisé avec Supabase.
 * Version mise à jour pour Next.js App Router.
 */
const AuthChecker = () => {
  return (
    <Suspense fallback={null}>
      <AuthCheckerContent />
    </Suspense>
  );
};

export default AuthChecker; 