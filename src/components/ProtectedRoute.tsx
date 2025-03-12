'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import useLogger from '@/hooks/useLogger';

interface ProtectedRouteProps {
  children: ReactNode;
  excludedPaths?: string[];
}

/**
 * Composant de chargement lors de la vérification d'authentification
 */
function LoadingFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      <p className="mt-4 text-gray-600">Vérification de l'authentification...</p>
    </div>
  );
}

/**
 * ProtectedRoute Component
 * Protège les routes qui nécessitent une authentification et gère les redirections
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  excludedPaths = [] 
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, authChecked, appInitialized } = useStore();
  const logger = useLogger ? useLogger('ProtectedRoute') : console;
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  useEffect(() => {
    // Ne rien faire tant que l'authentification n'a pas été vérifiée
    if (!authChecked || !appInitialized) {
      logger.log('🟡 [PROTECTED_ROUTE] Auth check or app init not completed yet');
      return;
    }
    
    logger.log('🔵 [PROTECTED_ROUTE] Checking route protection', { 
      pathname,
      isAuthenticated: !!user,
      excludedPaths
    });
    
    // Vérifier si le chemin actuel est dans les chemins exclus
    const isExcludedPath = excludedPaths.some(path => {
      if (path.endsWith('*')) {
        // Gestion des wildcard - ex: /auth/*
        const basePath = path.slice(0, -1); // Supprimer le *
        return pathname?.startsWith(basePath);
      }
      return pathname === path;
    });
    
    // Si le chemin nécessite une authentification et que l'utilisateur n'est pas connecté
    if (!isExcludedPath && !user) {
      logger.log('🔴 [PROTECTED_ROUTE] Redirecting unauthenticated user to login', { 
        from: pathname 
      });
      
      const encodedRedirect = encodeURIComponent(pathname || '/');
      router.push(`/auth/login?redirect=${encodedRedirect}`);
      return;
    }
    
    // Si l'utilisateur est sur une page d'authentification alors qu'il est déjà connecté
    // (exclut la page de déconnexion)
    if (isExcludedPath && user && pathname?.includes('/auth/') && !pathname?.includes('/logout')) {
      logger.log('🔵 [PROTECTED_ROUTE] Redirecting authenticated user from auth page', { 
        from: pathname 
      });
      router.push('/dashboard');
      return;
    }
    
    logger.log('✅ [PROTECTED_ROUTE] Route access granted', {
      path: pathname,
      auth: !!user
    });
    
    setIsAuthorized(true);
  }, [user, pathname, router, excludedPaths, authChecked, appInitialized, logger]);
  
  // Affichage du chargement pendant la vérification
  if (!authChecked || !appInitialized || (!isAuthorized && !excludedPaths.some(path => {
    if (path.endsWith('*')) {
      return pathname?.startsWith(path.slice(0, -1));
    }
    return pathname === path;
  }))) {
    // Ne pas afficher le loader sur les pages publiques
    const isExcludedPath = excludedPaths.some(path => {
      if (path.endsWith('*')) {
        const basePath = path.slice(0, -1);
        return pathname?.startsWith(basePath);
      }
      return pathname === path;
    });
    
    if (isExcludedPath) {
      return <>{children}</>;
    }
    
    return <LoadingFallback />;
  }
  
  return <>{children}</>;
};

export default ProtectedRoute; 