'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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

function ProtectedRouteContent({ children, excludedPaths = [] }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, authChecked } = useStore();
  const [isReady, setIsReady] = useState(false);
  const logger = useLogger('ProtectedRoute');
  
  useEffect(() => {
    // Si la vérification d'authentification n'est pas terminée, attendre
    if (!authChecked) return;
    
    // Vérifier si le chemin actuel est exclu de la protection
    const isExcluded = excludedPaths.some(path => 
      pathname === path || 
      pathname?.startsWith(`${path}/`)
    );
    
    if (isExcluded) {
      logger.auth('Path is excluded from protection', { path: pathname });
      setIsReady(true);
      return;
    }
    
    // Vérifier l'authentification
    if (!user) {
      const currentPath = pathname || '/';
      const redirectUrl = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
      
      logger.auth('User not authenticated, redirecting', { 
        from: currentPath,
        to: redirectUrl
      });
      
      router.push(redirectUrl);
    } else {
      logger.auth('User is authenticated, allowing access', { 
        path: pathname,
        userId: user.id 
      });
      setIsReady(true);
    }
  }, [pathname, user, excludedPaths, logger, router, authChecked]);
  
  // Si le chemin est exclu ou si l'utilisateur est authentifié et que nous sommes prêts
  const isExcluded = excludedPaths.some(path => 
    pathname === path || 
    pathname?.startsWith(`${path}/`)
  );
  
  if (!isReady && !isExcluded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Afficher les enfants
  return <>{children}</>;
}

/**
 * ProtectedRoute Component
 * 
 * Ce composant vérifie si l'utilisateur est authentifié.
 * Si ce n'est pas le cas, il redirige vers la page de connexion.
 * Il peut être utilisé pour protéger n'importe quelle page ou composant.
 * Version mise à jour pour Next.js App Router.
 */
const ProtectedRoute = (props: ProtectedRouteProps) => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProtectedRouteContent {...props} />
    </Suspense>
  );
};

export default ProtectedRoute; 