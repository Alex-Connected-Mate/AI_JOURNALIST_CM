import React from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@supabase/auth-helpers-react';
import Loader from './ui/Loader';
const { useLoggerNew } = require('../hooks/useLoggerNew');

/**
 * Composant qui protège les routes contre les accès non authentifiés
 */
const ProtectedRoute = ({ children }) => {
  const router = useRouter();
  const user = useUser();
  const log = useLoggerNew('ProtectedRoute');
  
  // Si nous sommes côté client et que l'utilisateur n'est pas authentifié
  React.useEffect(() => {
    if (!user && typeof window !== 'undefined') {
      log.warn('Tentative d\'accès à une route protégée sans authentification');
      router.push('/auth/login');
    }
  }, [user, router, log]);

  // Afficher un loader pendant la vérification
  if (!user) {
    return <Loader fullScreen={true} />;
  }

  // Si l'utilisateur est authentifié, afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedRoute; 