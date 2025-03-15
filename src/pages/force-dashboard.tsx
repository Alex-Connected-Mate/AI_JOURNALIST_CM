'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

/**
 * Page permettant de forcer l'accès au dashboard en contournant
 * les mécanismes d'initialisation qui peuvent bloquer l'application
 */
export default function ForceDashboardPage() {
  const router = useRouter();
  const store = useStore();
  
  useEffect(() => {
    // Forcer l'initialisation de l'application si ce n'est pas déjà fait
    try {
      console.log('Force-Dashboard: Forcing appInitialized state');
      
      // Marquer manuellement l'application comme initialisée
      if (!store.appInitialized) {
        console.log('Force-Dashboard: App not initialized, attempting to force state');
        
        // Essayer d'appeler initApp
        try {
          store.initApp().catch(e => {
            console.error('Force-Dashboard: initApp failed', e);
          });
        } catch (e) {
          console.error('Force-Dashboard: Error calling initApp', e);
        }
        
        // Forcer manuellement l'état via setState
        try {
          useStore.setState({
            ...store,
            appInitialized: true,
            authChecked: true
          });
          console.log('Force-Dashboard: State forced via setState');
        } catch (e) {
          console.error('Force-Dashboard: Failed to force state via setState', e);
        }
      }
      
      // Enregistrer dans localStorage
      try {
        localStorage.setItem('app_emergency_override', 'true');
        localStorage.setItem('app_emergency_override_time', new Date().toISOString());
      } catch (e) {
        console.error('Force-Dashboard: Failed to update localStorage', e);
      }
      
      // Rediriger vers le dashboard
      setTimeout(() => {
        console.log('Force-Dashboard: Redirecting to dashboard');
        router.push('/dashboard');
      }, 1000);
    } catch (e) {
      console.error('Force-Dashboard: Critical error', e);
    }
  }, [router, store]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Accès d'urgence au Dashboard</h1>
        
        <div className="animate-pulse flex space-x-4 mb-6">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-blue-500 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-blue-300 rounded"></div>
              <div className="h-4 bg-blue-300 rounded w-5/6"></div>
            </div>
          </div>
        </div>
        
        <p className="text-gray-700 mb-4">
          Cette page tente de contourner les mécanismes d'initialisation qui 
          pourraient bloquer l'accès à l'application.
        </p>
        
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Tentative de contournement en cours...</span>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500 mb-2">Autres options:</p>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => window.location.href = '/debug'}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded text-sm"
            >
              Page de diagnostic
            </button>
            
            <button 
              onClick={() => {
                try {
                  localStorage.clear();
                  sessionStorage.clear();
                  alert('Stockage effacé. Rechargement en cours...');
                  window.location.reload();
                } catch (e) {
                  alert(`Erreur: ${e}`);
                }
              }}
              className="w-full bg-red-50 hover:bg-red-100 text-red-800 py-2 px-4 rounded text-sm"
            >
              Effacer cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 