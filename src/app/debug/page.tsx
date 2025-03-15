'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';

export default function DebugHomePage() {
  const { sessionCreationLogs, clearSessionCreationLogs } = useStore();
  const [message, setMessage] = useState<string | null>(null);
  const [storageData, setStorageData] = useState<Record<string, any>>({});
  const [storeData, setStoreData] = useState<any>(null);
  
  // Récupérer le store pour inspection
  const store = useStore();
  
  useEffect(() => {
    // Récupérer les données du localStorage
    try {
      const storage: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            const value = localStorage.getItem(key);
            storage[key] = value ? JSON.parse(value) : value;
          } catch (e) {
            storage[key] = localStorage.getItem(key);
          }
        }
      }
      setStorageData(storage);
    } catch (e) {
      console.error("Erreur lors de la récupération du localStorage", e);
    }
    
    // Copier les données du store
    setStoreData(store);
  }, [store]);
  
  // Effacer les logs de session
  const handleClearLogs = () => {
    clearSessionCreationLogs();
    setMessage('Logs effacés avec succès');
    
    // Effacer le message après 3 secondes
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };
  
  // Fonction pour effacer le localStorage
  const clearLocalStorage = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      setMessage('LocalStorage et SessionStorage effacés. La page va être rechargée.');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e) {
      setMessage(`Erreur lors de l'effacement: ${e}`);
    }
  };
  
  // Fonction pour effacer une clé spécifique
  const clearKey = (key: string) => {
    try {
      localStorage.removeItem(key);
      setMessage(`Clé "${key}" effacée. La page va être rechargée.`);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e) {
      setMessage(`Erreur lors de l'effacement de la clé: ${e}`);
    }
  };
  
  // Fonction pour forcer l'initialisation de l'application
  const forceInitialization = () => {
    try {
      localStorage.setItem('app_emergency_override', 'true');
      localStorage.setItem('app_force_initialized', 'true');
      setMessage('Initialisation forcée. Redirection vers la page principale...');
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (e) {
      setMessage(`Erreur lors du forçage de l'initialisation: ${e}`);
    }
  };
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Diagnostic et Outils de Débogage</h1>
      
      {message && (
        <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Actions d'urgence */}
        <div className="bg-white p-6 rounded-lg shadow-md col-span-1">
          <h2 className="text-lg font-semibold mb-4">Actions d'urgence</h2>
          
          <div className="space-y-3">
            <button 
              onClick={() => window.location.href = '/'}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Retour à l'accueil
            </button>
            
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Essayer le dashboard
            </button>
            
            <button 
              onClick={forceInitialization}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
            >
              Forcer l'initialisation
            </button>
            
            <button 
              onClick={() => window.location.href = '/force-dashboard'}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
            >
              Accès d'urgence au dashboard
            </button>
            
            <button 
              onClick={clearLocalStorage}
              className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              Effacer tout le stockage local
            </button>
          </div>
        </div>
        
        {/* État d'initialisation de l'application */}
        <div className="bg-white p-6 rounded-lg shadow-md col-span-2">
          <h2 className="text-lg font-semibold mb-4">État de l'application</h2>
          
          {!storeData ? (
            <p className="text-gray-500 italic">Chargement des données du store...</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Initialisation:</p>
                <p className="text-sm">
                  {storeData.appInitialized ? 
                    <span className="text-green-600 font-medium">Oui</span> : 
                    <span className="text-red-600 font-medium">Non</span>
                  }
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Authentification vérifiée:</p>
                <p className="text-sm">
                  {storeData.authChecked ? 
                    <span className="text-green-600 font-medium">Oui</span> : 
                    <span className="text-red-600 font-medium">Non</span>
                  }
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">Utilisateur connecté:</p>
                <p className="text-sm">
                  {storeData.user ? 
                    <span className="text-green-600 font-medium">Oui ({storeData.user.email})</span> : 
                    <span className="text-gray-600 font-medium">Non</span>
                  }
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-700">État de chargement:</p>
                <p className="text-sm">
                  {storeData.loading ? 
                    <span className="text-blue-600 font-medium">En cours...</span> : 
                    <span className="text-gray-600 font-medium">Inactif</span>
                  }
                </p>
              </div>
              
              {storeData.error && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-700">Erreur:</p>
                  <p className="text-sm text-red-600">{storeData.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Cartes d'outils existantes */}
        {/* Carte pour les logs de création de session */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-semibold">Logs de création de session</h2>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {sessionCreationLogs.length} entrées
            </span>
          </div>
          
          <p className="text-gray-600 mb-4">
            Visualisez les logs détaillés de création de session pour le débogage et l'analyse.
          </p>
          
          <div className="flex justify-between items-center">
            <Link 
              href="/debug/session-logs" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Voir les logs
            </Link>
            
            <button
              onClick={handleClearLogs}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Effacer les logs
            </button>
          </div>
        </div>
        
        {/* Carte pour les statistiques de l'application */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Informations navigateur</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-800 mb-2 text-sm">User Agent</h3>
              <p className="text-xs text-gray-600 break-words">{typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800 mb-2 text-sm">URL</h3>
              <p className="text-xs text-gray-600 break-words">{typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800 mb-2 text-sm">Cookies activés</h3>
              <p className="text-xs text-gray-600">{typeof navigator !== 'undefined' && navigator.cookieEnabled ? 'Oui' : 'Non'}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800 mb-2 text-sm">Date et heure</h3>
              <p className="text-xs text-gray-600">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* LocalStorage Inspector */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Inspecteur de LocalStorage</h2>
          <button 
            onClick={clearLocalStorage}
            className="bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700"
          >
            Tout effacer
          </button>
        </div>
        
        {Object.keys(storageData).length === 0 ? (
          <p className="text-gray-500 italic">Aucune donnée dans le localStorage</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Object.entries(storageData).map(([key, value]) => (
              <div key={key} className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-800 text-sm">{key}</h3>
                  <button
                    onClick={() => clearKey(key)}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Effacer
                  </button>
                </div>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <h2 className="text-lg font-semibold">Note importante</h2>
        </div>
        <p className="text-gray-600">
          Ces outils sont destinés uniquement au développement et au débogage. Certaines fonctionnalités peuvent modifier l'état de l'application et doivent être utilisées avec précaution.
        </p>
      </div>
    </div>
  );
} 