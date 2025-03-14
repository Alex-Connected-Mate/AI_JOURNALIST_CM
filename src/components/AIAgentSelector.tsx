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
 * This component selects the appropriate AI agent based on the type (nuggets, lightbulb)
 * or displays a pause message if the user has chosen not to interact.
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
  // Local state
  const [insights, setInsights] = useState<string[]>([]);
  
  // Handle completion and save insights
  const handleComplete = (agentInsights: string[]) => {
    setInsights(agentInsights);
    if (onComplete) {
      onComplete(agentInsights);
    }
  };
  
  // If the user has chosen to take a pause
  if (agentType === 'pause') {
    return (
      <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gray-600 p-4 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Pause</h2>
              <p className="text-sm text-gray-200">Take a moment to reflect</p>
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
          
          <h3 className="text-xl font-semibold mb-2">Reflection Time</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            You've chosen to take a moment of pause while other participants interact with the AI agents.
            Use this time to reflect on the discussions you've heard.
          </p>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 max-w-md">
            <h4 className="font-medium text-yellow-800 mb-2">During this time...</h4>
            <p className="text-sm text-yellow-700">
              You can take notes on ideas that came to you during the discussions.
              You'll be able to share them in the next phase.
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="mt-8 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            End Pause
          </button>
        </div>
      </div>
    );
  }
  
  // Select the appropriate agent
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
  
  // Fallback in case the type is not recognized
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-red-600 p-4 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">Error</h2>
            <p className="text-sm text-red-200">Agent type not recognized</p>
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
          The agent type "{agentType}" is not recognized.
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
} 