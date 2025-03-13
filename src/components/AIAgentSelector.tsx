'use client';

import { useState } from 'react';
import AINuggetsAgent from './AINuggetsAgent';
import AILightbulbAgent from './AILightbulbAgent';

export type AgentType = 'nuggets' | 'lightbulb' | 'pause';

interface AIAgentSelectorProps {
  sessionId: string;
  participantName: string;
  programName: string;
  teacherName: string;
  agentType: AgentType;
  onClose?: () => void;
  onComplete?: (insights: string[]) => void;
}

/**
 * AIAgentSelector Component
 * 
 * Ce composant sélectionne le bon agent IA en fonction du type (nuggets, lightbulb)
 * ou affiche un message de pause si l'utilisateur a choisi de ne pas interagir.
 */
export default function AIAgentSelector({
  sessionId,
  participantName,
  programName,
  teacherName,
  agentType,
  onClose,
  onComplete
}: AIAgentSelectorProps) {
  // États locaux
  const [insights, setInsights] = useState<string[]>([]);
  
  // Gérer la complétion et sauvegarder les insights
  const handleComplete = (agentInsights: string[]) => {
    setInsights(agentInsights);
    if (onComplete) {
      onComplete(agentInsights);
    }
  };
  
  // Si l'utilisateur a choisi de faire une pause
  if (agentType === 'pause') {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gray-600 p-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Pause</h2>
              <p className="text-sm text-gray-200">Prendre un moment pour réfléchir</p>
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-gray-100 rounded-full mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h3 className="text-xl font-semibold mb-2">Moment de réflexion</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            Vous avez choisi de prendre un moment de pause pendant que les autres participants interagissent avec les agents IA. 
            Profitez de ce temps pour réfléchir aux discussions que vous avez entendues.
          </p>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 max-w-md">
            <h4 className="font-medium text-yellow-800 mb-2">Pendant ce temps...</h4>
            <p className="text-sm text-yellow-700">
              Vous pouvez prendre des notes sur les idées qui vous sont venues pendant les discussions.
              Vous pourrez les partager lors de la phase suivante.
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="mt-8 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Terminer la pause
          </button>
        </div>
      </div>
    );
  }
  
  // Sélection de l'agent approprié
  if (agentType === 'nuggets') {
    return (
      <AINuggetsAgent
        sessionId={sessionId}
        participantName={participantName}
        programName={programName}
        teacherName={teacherName}
        onClose={onClose}
        onComplete={handleComplete}
      />
    );
  }
  
  if (agentType === 'lightbulb') {
    return (
      <AILightbulbAgent
        sessionId={sessionId}
        participantName={participantName}
        programName={programName}
        teacherName={teacherName}
        onClose={onClose}
        onComplete={handleComplete}
      />
    );
  }
  
  // Fallback au cas où le type n'est pas reconnu
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-red-600 p-4 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Erreur</h2>
            <p className="text-sm text-red-200">Type d'agent non reconnu</p>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-red-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
        <p className="text-red-600 mb-4">
          Le type d'agent "{agentType}" n'est pas reconnu.
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Fermer
        </button>
      </div>
    </div>
  );
} 