'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import useLogger from '@/hooks/useLogger';

interface ProtectedRouteProps {
  children: React.ReactNode;
  excludedPaths?: string[];
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

/**
 * ProtectedRoute Component
 * Garde d'authentification qui vérifie si l'utilisateur peut accéder à la page
 */
const ProtectedRoute = ({ children, excludedPaths = [] }: ProtectedRouteProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, authChecked } = useStore();
  const logger = useLogger('ProtectedRoute');
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Vérification de l'authentification
    if (!authChecked) return;

    // Vérifier si le chemin actuel est exclu de la protection
    const isExcluded = excludedPaths.some(path => 
      pathname === path || 
      pathname?.startsWith(path + '/') || 
      path === '*'
    );
    
    if (isExcluded) {
      logger.auth('Path is excluded from protection', { path: pathname });
      setIsAuthorized(true);
      return;
    }
    
    // Vérifier l'authentification
    if (!user) {
      const redirectUrl = `/auth/login?redirect=${encodeURIComponent(pathname || '/')}`;
      
      logger.auth('User not authenticated, redirecting', { 
        from: pathname,
        to: redirectUrl
      });
      
      router.push(redirectUrl);
    } else {
      logger.auth('User is authenticated, allowing access', { 
        path: pathname,
        userId: user.id 
      });
      setIsAuthorized(true);
    }
  }, [authChecked, pathname, user, excludedPaths, logger, router]);

  // Si l'authentification n'est pas encore vérifiée ou si l'autorisation est en cours, afficher le loader
  if (!authChecked || (!isAuthorized && !excludedPaths.some(path => pathname === path))) {
    return <LoadingFallback />;
  }

  // L'utilisateur est authentifié ou la page est exclue, afficher le contenu
  return <>{children}</>;
};

export default ProtectedRoute; 