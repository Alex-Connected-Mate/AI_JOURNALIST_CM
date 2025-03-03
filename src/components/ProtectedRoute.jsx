import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useStore } from '@/lib/store';
import useLogger from '@/hooks/useLogger';

/**
 * ProtectedRoute Component
 * 
 * Ce composant vérifie si l'utilisateur est authentifié.
 * Si ce n'est pas le cas, il redirige vers la page de connexion.
 * Il peut être utilisé pour protéger n'importe quelle page ou composant.
 */
const ProtectedRoute = ({ children, excludedPaths = [] }) => {
  const router = useRouter();
  const { user, authChecked } = useStore();
  const [isReady, setIsReady] = useState(false);
  const logger = useLogger('ProtectedRoute');
  
  useEffect(() => {
    // Si le routeur n'est pas prêt ou si la vérification d'authentification n'est pas terminée, attendre
    if (!router.isReady || !authChecked) return;
    
    // Vérifier si le chemin actuel est exclu de la protection
    const isExcluded = excludedPaths.some(path => 
      router.pathname === path || 
      router.pathname.startsWith(`${path}/`)
    );
    
    if (isExcluded) {
      logger.auth('Path is excluded from protection', { path: router.pathname });
      setIsReady(true);
      return;
    }
    
    // Vérifier l'authentification
    if (!user) {
      const currentPath = router.asPath;
      const redirectUrl = `/auth/login?redirect=${encodeURIComponent(currentPath)}`;
      
      logger.auth('User not authenticated, redirecting', { 
        from: currentPath,
        to: redirectUrl
      });
      
      router.push(redirectUrl);
    } else {
      logger.auth('User is authenticated, allowing access', { 
        path: router.pathname,
        userId: user.id 
      });
      setIsReady(true);
    }
  }, [router.isReady, router.pathname, router.asPath, user, excludedPaths, logger, router, authChecked]);
  
  // Si le chemin est exclu ou si l'utilisateur est authentifié et que nous sommes prêts
  const isExcluded = excludedPaths.some(path => 
    router.pathname === path || 
    router.pathname.startsWith(`${path}/`)
  );
  
  if (!isReady && !isExcluded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Afficher les enfants
  return children;
};

export default ProtectedRoute; 