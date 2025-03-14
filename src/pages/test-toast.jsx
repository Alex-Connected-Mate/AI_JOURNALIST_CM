'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

/**
 * Page de test pour les notifications toast
 * 
 * Cette page permet de tester différents types de notifications toast
 * et de simuler le comportement de sauvegarde d'une session.
 */
export default function ToastTestPage() {
  const [delay, setDelay] = useState(1000);
  const [success, setSuccess] = useState(true);
  
  // Simuler une sauvegarde avec notification toast
  const simulateSave = () => {
    // Notification de sauvegarde en cours
    const saveToastId = toast.loading('Sauvegarde en cours...');
    
    // Simuler une opération asynchrone
    setTimeout(() => {
      if (success) {
        // Succès
        toast.success('Sauvegarde réussie !', {
          id: saveToastId,
          duration: 3000,
        });
      } else {
        // Échec
        toast.error('Erreur lors de la sauvegarde', {
          id: saveToastId,
          duration: 5000,
        });
      }
    }, delay);
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Test des notifications Toast</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Configuration du test</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Délai de réponse (ms)
          </label>
          <input
            type="number"
            min="500"
            max="5000"
            step="500"
            value={delay}
            onChange={(e) => setDelay(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={success}
              onChange={() => setSuccess(!success)}
              className="h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-sm text-gray-700">Simuler une réponse réussie</span>
          </label>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={simulateSave}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Simuler une sauvegarde
          </button>
          
          <button
            onClick={() => toast.success('Ceci est une notification de succès')}
            className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Afficher un toast de succès
          </button>
          
          <button
            onClick={() => toast.error('Ceci est une notification d\'erreur')}
            className="w-full py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Afficher un toast d'erreur
          </button>
          
          <button
            onClick={() => toast.info('Ceci est une notification d\'information')}
            className="w-full py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Afficher un toast d'information
          </button>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-md">
        <h3 className="font-medium text-blue-800 mb-2">Instructions</h3>
        <p className="text-sm text-blue-700">
          Cette page vous permet de tester les notifications toast. Cliquez sur les boutons ci-dessus
          pour voir les différents types de notifications. Vous pouvez également simuler une sauvegarde
          avec un délai personnalisé et choisir si elle réussit ou échoue.
        </p>
      </div>
    </div>
  );
} 