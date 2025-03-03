'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AIInteractionConfig from '@/components/AIInteractionConfig';
import LogViewer from '@/components/LogViewer';

/**
 * Nexus X Insead Questionnaire Page
 * 
 * A dedicated page for configuring and launching the Nexus X Insead questionnaire.
 * This page provides direct access to the AI Journalist specifically designed for
 * the Nexus X Insead questionnaire workflow.
 */
export default function NexusQuestionnairePage() {
  const router = useRouter();
  const [sessionConfig, setSessionConfig] = useState({
    // Default settings for the questionnaire
    enableQuestionnaireInteraction: true,
    questionnaireConfig: {
      agentName: "Elias",
      targetQuestions: "Nexus X Insead questionnaire",
      companyName: "Nexus",
      previousNuggets: "previously discussed insight and connections",
      requiredStructure: "ensure structure and clarity",
      identityAttributes: "french, energetic, a journalist"
    },
    aiResponseTime: 30,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const updateSessionConfig = (newConfig) => {
    setSessionConfig(newConfig);
  };
  
  const handleSaveConfiguration = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate saving configuration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to dashboard with success parameter that will now be properly handled
      router.push('/dashboard?success=nexus-config-saved');
    } catch (err) {
      console.error('Error saving Nexus questionnaire configuration:', err);
      setError('An error occurred while saving the configuration');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <div className="mb-8">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Nexus X Insead Questionnaire</h1>
        <p className="text-gray-600">
          Configure the AI Journalist specialized for the Nexus X Insead questionnaire.
          This tool helps participants develop insights based on previously identified "nuggets".
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="bento-card mb-8">
        <AIInteractionConfig 
          sessionConfig={sessionConfig}
          updateSessionConfig={updateSessionConfig}
          mode="questionnaire"
        />
        
        <div className="mt-8 flex justify-end">
          <button
            className="cm-button-secondary mr-4"
            onClick={() => router.push('/dashboard')}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="cm-button flex items-center gap-2"
            onClick={handleSaveConfiguration}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Save Configuration
              </>
            )}
          </button>
        </div>
      </div>
      
      <LogViewer />
    </div>
  );
} 