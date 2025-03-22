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
    
    // Écrire un log dans localStorage au démarrage
    try {
      const startTimeISO = new Date().toISOString();
      localStorage.setItem('app_debug_start', startTimeISO);
      localStorage.setItem('app_debug_pathname', pathname || 'undefined');
      localStorage.setItem('app_debug_initialized', String(appInitialized));
    } catch (e) {
      // Ignorer les erreurs localStorage
    }
    
    const timer = setTimeout(() => {
      if (!appInitialized) {
        console.warn('Forcing initialization after timeout');
        try {
          localStorage.setItem('app_debug_forced', 'true');
          localStorage.setItem('app_debug_forced_time', new Date().toISOString());
        } catch (e) {
          // Ignorer les erreurs localStorage
        }
        setForceInitialized(true);
      }
    }, 5000);
    
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

  // Renderiser le contenu basé sur le type de route
  const renderContent = () => {
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
        {isReady ? (
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
            
            {/* Logs viewer - always available */}
            <LogViewer />
            
            {/* Floating logs button */}
            <button
              onClick={() => {
                // Trigger log viewer visibility
                const event = new CustomEvent('toggle-logs');
                window.dispatchEvent(event);
              }}
              className="fixed bottom-4 left-4 bg-gray-800 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-700 flex items-center space-x-2 z-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011-1h10a1 1 0 011 1v1h1a1 1 0 011 1v12a1 1 0 01-1 1h-1v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-1H3a1 1 0 01-1-1V4a1 1 0 011-1h1V2zm2 0v1h8V2H6zm9 5H5v10h10V7zM7 9a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              <span>Logs</span>
            </button>
            
            {/* Afficher une notification visible uniquement si l'initialisation a été forcée */}
            {forceInitialized && !appInitialized && (
              <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded shadow-lg">
                <p className="text-sm font-medium">Initialisation forcée</p>
                <p className="text-xs mt-1">L'application a été débloquée manuellement.</p>
                <button 
                  onClick={() => window.location.href = '/debug'}
                  className="text-xs bg-yellow-200 px-2 py-1 mt-2 rounded hover:bg-yellow-300"
                >
                  Diagnostiquer
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="fixed inset-0 flex flex-col items-center justify-center bg-white">
            <div className="text-center max-w-md mx-auto p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement de l'application...</p>
              <p className="mt-2 text-xs text-gray-400">Chemin: {pathname || 'N/A'}</p>
              <p className="mt-1 text-xs text-gray-400">En attente depuis: {debugInfo.timeWaiting}s</p>
              
              {debugInfo.timeWaiting > 10 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-left">
                  <p className="text-sm text-yellow-800 font-medium">Le chargement prend plus de temps que prévu</p>
                  <ul className="mt-2 text-xs text-yellow-700 space-y-1">
                    <li>• Le serveur Supabase est peut-être indisponible</li>
                    <li>• Les cookies ou le stockage local peuvent être corrompus</li>
                    <li>• Votre connexion Internet peut être instable</li>
                  </ul>
                </div>
              )}
              
              <div className="mt-6 space-y-2">
                <button 
                  onClick={() => {
                    setForceInitialized(true);
                    console.log("Forcing application initialization");
                    try {
                      localStorage.setItem('app_debug_manually_forced', 'true');
                      localStorage.setItem('app_debug_manually_forced_time', new Date().toISOString());
                    } catch (e) {
                      // Ignorer les erreurs localStorage
                    }
                  }}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  Débloquer l'application
                </button>
                
                <button 
                  onClick={() => {
                    try {
                      localStorage.clear();
                      sessionStorage.clear();
                      console.log("Storage cleared");
                      alert("Stockage effacé. Rechargement de la page.");
                      window.location.reload();
                    } catch (e) {
                      console.error("Failed to clear storage", e);
                      alert("Erreur lors de l'effacement du stockage. Essayez de recharger manuellement.");
                    }
                  }}
                  className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                >
                  Effacer le cache et recharger
                </button>
                
                <button 
                  onClick={() => {
                    window.location.href = '/debug';
                  }}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
                >
                  Page de diagnostic
                </button>
              </div>
              
              {debugInfo.timeWaiting > 20 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-800 font-medium">Problème d'initialisation détecté</p>
                  <p className="mt-1 text-xs text-red-700">
                    Si vous voyez ce message, l'application a du mal à se connecter aux services requis. 
                    Essayez de débloquer l'application ou visiter la page de diagnostic.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </LocaleProvider>
    </ErrorBoundary>
  );
} 