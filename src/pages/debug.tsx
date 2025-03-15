'use client';

import React, { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';

/**
 * Page de diagnostic pour aider à déboguer les problèmes d'initialisation de l'application
 */
export default function DebugPage() {
  const [storageData, setStorageData] = useState<Record<string, any>>({});
  const [storeData, setStoreData] = useState<any>(null);
  
  // Récupérer une copie des données du store zustand
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
  
  // Fonction pour effacer le localStorage
  const clearLocalStorage = () => {
    try {
      localStorage.clear();
      alert('LocalStorage effacé! La page va être rechargée.');
      window.location.reload();
    } catch (e) {
      alert(`Erreur lors de l'effacement: ${e}`);
    }
  };
  
  // Fonction pour effacer une clé spécifique
  const clearKey = (key: string) => {
    try {
      localStorage.removeItem(key);
      alert(`Clé "${key}" effacée! La page va être rechargée.`);
      window.location.reload();
    } catch (e) {
      alert(`Erreur lors de l'effacement de la clé: ${e}`);
    }
  };
  
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Page de Diagnostic</h1>
      
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h2 className="text-xl font-semibold mb-2">Information</h2>
        <p className="mb-2">Cette page contourne les vérifications d'initialisation pour permettre le diagnostic de l'application.</p>
        <p>Elle affiche l'état actuel du localStorage et du store Zustand, ce qui peut aider à identifier les problèmes d'initialisation.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LocalStorage */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">LocalStorage</h2>
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
            <div>
              {Object.entries(storageData).map(([key, value]) => (
                <div key={key} className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-800">{key}</h3>
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
        
        {/* Zustand Store */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">État Zustand</h2>
          
          {!storeData ? (
            <p className="text-gray-500 italic">Chargement des données du store...</p>
          ) : (
            <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(storeData, null, 2)}
            </pre>
          )}
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Actions */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          
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
              onClick={() => {
                const forced = localStorage.getItem('app_debug_forced') === 'true';
                alert(`État d'initialisation forcée: ${forced ? 'OUI' : 'NON'}`);
              }}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
            >
              Vérifier l'initialisation
            </button>
          </div>
        </div>
        
        {/* Infos navigateur */}
        <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Informations sur le navigateur</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">User Agent</h3>
              <p className="text-sm text-gray-600 break-words">{typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800 mb-2">URL</h3>
              <p className="text-sm text-gray-600 break-words">{typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Cookies activés</h3>
              <p className="text-sm text-gray-600">{typeof navigator !== 'undefined' && navigator.cookieEnabled ? 'Oui' : 'Non'}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Date et heure</h3>
              <p className="text-sm text-gray-600">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 