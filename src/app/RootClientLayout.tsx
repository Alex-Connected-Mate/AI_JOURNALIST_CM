'use client';

import React, { useEffect } from 'react';
import Header from '@/components/Header';
import AuthChecker from '@/components/AuthChecker';
import ProtectedRoute from '@/components/ProtectedRoute';
import LogViewer from '@/components/LogViewer';
import EventTrackerInitializer from '@/components/EventTrackerInitializer';
import { useStore } from '@/lib/store';
import { usePathname } from 'next/navigation';
import { LocaleProvider } from '@/components/LocaleProvider';
import { ErrorBoundary } from 'react-error-boundary';

interface RootClientLayoutProps {
  children: React.ReactNode;
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-md">
      <h2 className="text-xl font-bold text-red-800 mb-2">Something went wrong:</h2>
      <pre className="text-sm bg-white p-3 rounded border border-red-100 overflow-auto">
        {error.message}
      </pre>
      <button 
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        onClick={() => window.location.reload()}
      >
        Try again
      </button>
    </div>
  );
}

const RootClientLayout = ({ children }: RootClientLayoutProps) => {
  const { user } = useStore();
  const pathname = usePathname();
  
  // Liste des chemins qui ne nécessitent pas d'authentification
  const publicPaths = ['/', '/auth/login', '/auth/register', '/auth/reset-password'];
  
  // Vérifier si la page actuelle est une page d'authentification
  const isAuthPage = publicPaths.some(path => 
    pathname === path || 
    pathname?.startsWith('/auth/')
  );
  
  return (
    <LocaleProvider>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        {/* Initialisateur du système de suivi d'événements */}
        <EventTrackerInitializer />
        
        {/* Vérification de l'authentification */}
        <AuthChecker />
        
        {/* En-tête */}
        {!isAuthPage && user && <Header />}
        
        {/* Protection des routes qui nécessitent une authentification */}
        <ProtectedRoute excludedPaths={publicPaths}>
          {/* Contenu principal */}
          {children}
        </ProtectedRoute>
        
        {/* Afficheur de logs (disponible sur toutes les pages) */}
        <LogViewer />
      </ErrorBoundary>
    </LocaleProvider>
  );
};

export default RootClientLayout; 