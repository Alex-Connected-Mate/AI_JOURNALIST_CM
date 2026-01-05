import React, { ReactNode } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import Loader from '@/components/ui/Loader';
// Importer useLoggerNew correctement
const { useLoggerNew } = require('../hooks/useLoggerNew');

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string | null;
}

/**
 * Composant pour protéger les routes nécessitant une authentification
 * Redirige automatiquement vers la page de login si l'utilisateur n'est pas connecté
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = null 
}) => {
  const router = useRouter();
  const user = useUser();
  const logger = useLoggerNew('ProtectedRoute');
  
  // Si nous sommes encore en train de charger l'authentification
  if (user === undefined) {
    logger.debug('Authentication state is loading');
    return <Loader message="Vérification de l'authentification..." />;
  }
  
  // Si l'utilisateur n'est pas connecté, rediriger vers la page de login
  if (!user) {
    logger.info('User not authenticated, redirecting to login page');
    
    // Utilisation de setTimeout pour s'assurer que le router est prêt
    setTimeout(() => {
      router.replace('/auth/login');
    }, 100);
    
    return <Loader message="Redirection vers la page de connexion..." />;
  }
  
  // Vérifier si l'utilisateur a le rôle requis (si nécessaire)
  if (requiredRole) {
    // Logique de vérification du rôle (à implémenter selon le modèle de données)
    const hasRole = true; // Remplacer par la vraie logique
    
    if (!hasRole) {
      logger.warn(`User lacks required role: ${requiredRole}, redirecting`);
      setTimeout(() => {
        router.replace('/unauthorized');
      }, 100);
      
      return <Loader message="Vérification des autorisations..." />;
    }
  }
  
  // Si tout est en ordre, afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedRoute; 