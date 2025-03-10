'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
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
 * Version simplifiée qui ne gère que l'accès aux pages protégées
 */
const ProtectedRoute = ({ children, excludedPaths = [] }: ProtectedRouteProps) => {
  const router = useRouter();
  const { user, authChecked } = useStore();
  const logger = useLogger('ProtectedRoute');

  // Si l'authentification n'est pas encore vérifiée, afficher le loader
  if (!authChecked) {
    return <LoadingFallback />;
  }

  // Si l'utilisateur n'est pas authentifié et que la page n'est pas exclue
  if (!user && !excludedPaths.includes(window.location.pathname)) {
    logger.auth('Redirecting to login - user not authenticated');
    router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
    return <LoadingFallback />;
  }

  // L'utilisateur est authentifié ou la page est exclue, afficher le contenu
  return <>{children}</>;
};

export default ProtectedRoute; 