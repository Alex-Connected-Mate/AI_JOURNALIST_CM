'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import AuthChecker from '@/components/AuthChecker';
import ProtectedRoute from '@/components/ProtectedRoute';
import LogViewer from '@/components/LogViewer';
import EventTrackerInitializer from '@/components/EventTrackerInitializer';
import { useStore } from '@/lib/store';
import { usePathname } from 'next/navigation';
import { LocaleProvider } from '@/components/LocaleProvider';
import { ErrorBoundary } from 'react-error-boundary';
import { Toaster } from 'react-hot-toast';
import Image from 'next/image';

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
  const pathname = usePathname();
  const { appInitialized, user, initApp } = useStore();
  const [forceInitialized, setForceInitialized] = useState(false);
  const [debugInfo, setDebugInfo] = useState({
    initialized: false,
    forced: false,
    user: null as any,
    timeWaiting: 0
  });
  const [startTime] = useState(Date.now());
  
  // Vérifier si l'initialisation a été forcée via emergency.html
  useEffect(() => {
    try {
      const emergencyOverride = localStorage.getItem('app_emergency_override') === 'true';
      const forceInitialized = localStorage.getItem('app_force_initialized') === 'true';
      
      if (emergencyOverride || forceInitialized) {
        console.log('🚨 [EMERGENCY] Found emergency override flags in localStorage');
        setForceInitialized(true);
      }
    } catch (e) {
      // Ignorer les erreurs localStorage
    }
  }, []);
  
  // Vérifier périodiquement l'état d'initialisation et mettre à jour le temps d'attente
  useEffect(() => {
    const interval = setInterval(() => {
      const timeWaiting = Math.floor((Date.now() - startTime) / 1000);
      setDebugInfo(prev => ({
        ...prev,
        initialized: appInitialized,
        forced: forceInitialized,
        user: user,
        timeWaiting
      }));
      
      // Log détaillé toutes les 5 secondes
      if (timeWaiting % 5 === 0 && !appInitialized && !forceInitialized) {
        console.warn(`Waiting for initialization for ${timeWaiting}s`, { appInitialized, user });
        
        try {
          localStorage.setItem('app_debug_waiting_time', String(timeWaiting));
          localStorage.setItem('app_debug_last_check', new Date().toISOString());
        } catch (e) {
          // Ignorer les erreurs localStorage
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [appInitialized, forceInitialized, user, startTime]);
  
  // Ajouter un timeout pour forcer l'initialisation après 5 secondes
  useEffect(() => {
    // Essayer de réinitialiser au démarrage
    if (!appInitialized) {
      console.log('Attempting to initialize application manually...');
      try {
        initApp();
      } catch (e) {
        console.error('Failed to initialize app manually', e);
      }
    }
    
    // Logs uniquement en mode development
    if (process.env.NODE_ENV === 'development') {
      try {
        const startTimeISO = new Date().toISOString();
        localStorage.setItem('app_debug_start', startTimeISO);
        localStorage.setItem('app_debug_pathname', pathname || 'undefined');
        localStorage.setItem('app_debug_initialized', String(appInitialized));
      } catch (e) {
        // Ignorer les erreurs localStorage
      }
    }
    
    // Force l'initialisation après un délai, mais de manière silencieuse
    const timer = setTimeout(() => {
      if (!appInitialized) {
        console.log('Auto-forcing initialization after timeout');
        setForceInitialized(true);
      }
    }, 8000); // Délai augmenté pour laisser plus de temps à l'initialisation normale
    
    return () => clearTimeout(timer);
  }, [appInitialized, pathname, initApp]);

  // List of protected routes
  const protectedRoutes = [
    '/dashboard',
    '/settings',
    '/sessions'
  ];

  // Determine if current route is protected and requires auth
  const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route));

  // Public join route shouldn't use protected route wrapper
  const isJoinRoute = pathname?.startsWith('/join');

  // Rendre le contenu si initialisé naturellement ou forcé
  const isReady = appInitialized || forceInitialized;

  // Update renderContent to handle non-initialized state
  const renderContent = () => {
    // If not ready (not initialized), only render non-protected content
    if (!isReady && isProtectedRoute) {
      // For protected routes during initialization, we'll return an empty div
      // AuthChecker component will handle redirects as needed
      return (
        <>
          <AuthChecker />
          <div></div>
        </>
      );
    }
    
    // Normal rendering once initialized
    if (isProtectedRoute) {
      return (
        <ProtectedRoute excludedPaths={['/join']}>
          {children}
        </ProtectedRoute>
      );
    } else if (isJoinRoute) {
      return (
        <>
          <AuthChecker />
          {children}
        </>
      );
    } else {
      return children;
    }
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <LocaleProvider>
        {/* Always render content, no more loading screen */}
        <>
          {renderContent()}
          
          {/* Toast Notifications */}
          <Toaster
            position="top-center"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 5000,
              success: {
                style: {
                  background: '#f0fdf4',
                  color: '#166534',
                  border: '1px solid #dcfce7'
                },
                duration: 3000,
              },
              error: {
                style: {
                  background: '#fef2f2',
                  color: '#b91c1c',
                  border: '1px solid #fee2e2'
                },
                duration: 5000,
              },
              loading: {
                style: {
                  background: '#f3f4f6',
                  color: '#1f2937',
                  border: '1px solid #e5e7eb'
                },
              },
            }}
          />
          
          {/* Event tracker for analytics */}
          <EventTrackerInitializer />
          
          {/* Dev tools - only in development */}
          {process.env.NODE_ENV === 'development' && <LogViewer />}
        </>
      </LocaleProvider>
    </ErrorBoundary>
  );
} 