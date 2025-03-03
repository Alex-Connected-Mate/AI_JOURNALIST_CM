'use client';

import React, { useEffect } from 'react';
import Header from '@/components/Header';
import AuthChecker from '@/components/AuthChecker';
import ProtectedRoute from '@/components/ProtectedRoute';
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

export default function RootClientLayout({ children }: RootClientLayoutProps) {
  const { user, logout } = useStore();
  const pathname = usePathname();
  
  // Liste des chemins qui ne nécessitent pas d'authentification
  const publicPaths = ['/', '/auth/login', '/auth/register', '/auth/reset-password'];
  
  // Vérifier si la page actuelle est une page d'authentification
  const isAuthPage = publicPaths.some(path => 
    pathname === path || 
    pathname?.startsWith('/auth/')
  );

  // Préparer les props pour le Header
  const headerUser = user ? {
    email: user.email
  } : undefined;

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <LocaleProvider>
        {/* Vérification de l'authentification */}
        <AuthChecker />
        
        {/* Afficher le Header uniquement sur les pages protégées (non-auth) */}
        {!isAuthPage && <Header user={headerUser} logout={logout} />}
        
        {/* Protection des routes qui nécessitent une authentification */}
        <ProtectedRoute excludedPaths={publicPaths}>
          {children}
        </ProtectedRoute>
      </LocaleProvider>
    </ErrorBoundary>
  );
} 