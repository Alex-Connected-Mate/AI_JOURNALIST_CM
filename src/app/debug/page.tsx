'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';

export default function DebugHomePage() {
  const { sessionCreationLogs, clearSessionCreationLogs } = useStore();
  const [message, setMessage] = useState<string | null>(null);
  
  // Effacer les logs de session
  const handleClearLogs = () => {
    clearSessionCreationLogs();
    setMessage('Logs effacés avec succès');
    
    // Effacer le message après 3 secondes
    setTimeout(() => {
      setMessage(null);
    }, 3000);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Outils de développement et débogage</h1>
      
      {message && (
        <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <h2 className="text-lg font-semibold mb-4">Statistiques de l'application</h2>
          
          <p className="text-gray-600 mb-4">
            Visualisez les statistiques de performance et d'utilisation de l'application.
          </p>
          
          <div className="flex justify-start">
            <span className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md cursor-not-allowed">
              Bientôt disponible
            </span>
          </div>
        </div>
        
        {/* Carte pour les requêtes réseau */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Moniteur de requêtes réseau</h2>
          
          <p className="text-gray-600 mb-4">
            Surveillez les requêtes réseau entre l'application et l'API Supabase.
          </p>
          
          <div className="flex justify-start">
            <span className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md cursor-not-allowed">
              Bientôt disponible
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <h2 className="text-lg font-semibold">Note importante</h2>
        </div>
        <p className="text-gray-600">
          Ces outils sont destinés uniquement au développement et au débogage. Ils ne sont pas visibles en production et ne devraient être utilisés que pour le diagnostic et l'amélioration de l'application.
        </p>
      </div>
    </div>
  );
} 