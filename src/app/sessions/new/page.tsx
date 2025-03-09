'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import SessionCreationFlow from '@/components/SessionCreationFlow';
import LogViewer from '@/components/LogViewer';
import { createSession } from '@/lib/supabase';
import type { SessionData } from '@/lib/supabase';
import sessionTracker from '@/lib/sessionTracker';

// Import validateSessionData localement
function validateSessionData(data: Partial<SessionData>): { isValid: boolean; error?: string } {
  if (!data.title?.trim()) {
    return { isValid: false, error: 'Session title is required' };
  }
  
  if (!data.user_id) {
    return { isValid: false, error: 'User ID is required' };
  }
  
  if (data.status && !['draft', 'active', 'ended'].includes(data.status)) {
    return { isValid: false, error: 'Invalid session status' };
  }
  
  return { isValid: true };
}

export default function NewSessionPage() {
  const router = useRouter();
  const { user } = useStore();
  
  // Session creation states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle the session creation process when the form is submitted
  const handleCreateSession = async (sessionConfig: any) => {
    if (!user) {
      const errorMsg = 'Vous devez être connecté pour créer une session';
      setError(errorMsg);
      sessionTracker.trackSessionCreation.error(sessionConfig, new Error(errorMsg));
      return;
    }
    
    setLoading(true);
    setError(null);
    
    // Suivre le début de la création
    sessionTracker.trackSessionCreation.start(sessionConfig);
    
    try {
      // Transform the session config into the expected format
      const sessionData: Partial<SessionData> = {
        title: sessionConfig.basicInfo?.title || sessionConfig.name || '',
        description: sessionConfig.basicInfo?.description || sessionConfig.description || '',
        status: 'draft' as const,
        user_id: user.id,
        settings: {
          institution: sessionConfig.basicInfo?.institution || sessionConfig.institution || '',
          professorName: sessionConfig.basicInfo?.professorName || sessionConfig.professorName || '',
          showProfessorName: sessionConfig.basicInfo?.showProfessorName ?? sessionConfig.showProfessorName ?? true,
          maxParticipants: sessionConfig.basicInfo?.maxParticipants || sessionConfig.maxParticipants || 30,
          connection: sessionConfig.connection || {},
          discussion: sessionConfig.discussion || {},
          aiInteraction: {
            nuggets: sessionConfig.nuggetsRules || {},
            lightbulbs: sessionConfig.lightbulbsRules || {},
            overall: sessionConfig.overallRules || {}
          },
          visualization: {
            enableWordCloud: sessionConfig.enableWordCloud ?? true,
            enableThemeNetwork: sessionConfig.enableThemeNetwork ?? true,
            enableLightbulbCategorization: sessionConfig.enableLightbulbCategorization ?? true,
            enableIdeaImpactMatrix: sessionConfig.enableIdeaImpactMatrix ?? true,
            enableEngagementChart: sessionConfig.enableEngagementChart ?? true,
            showTopThemes: sessionConfig.showTopThemes ?? true
          }
        }
      };

      // Valider les données de session
      const validation = validateSessionData(sessionData);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Données de session invalides');
      }
      
      sessionTracker.trackSessionCreation.validation(sessionConfig, validation);
      
      // Suivre la transformation
      sessionTracker.trackSessionCreation.transform(sessionConfig, sessionData);

      console.log('Creating session with data:', sessionData);
      
      // Suivre la soumission à l'API
      sessionTracker.trackSessionCreation.submit(sessionData);
      
      const { data, error: createError } = await createSession(sessionData);
      
      if (createError) {
        console.error('Error creating session:', createError);
        sessionTracker.trackSessionCreation.error(sessionData, createError);
        throw createError;
      }
      
      // Suivre le succès
      sessionTracker.trackSessionCreation.success(sessionData, data);
      
      // Redirect to dashboard with success message
      router.push('/dashboard?success=session-created');
    } catch (err: any) {
      console.error('Error creating session:', err);
      setError(`Une erreur s'est produite lors de la création de la session: ${err.message || JSON.stringify(err)}`);
      
      // Suivre l'erreur
      sessionTracker.trackSessionCreation.error(sessionConfig, err);
      
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
          Retour au tableau de bord
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="bento-card mb-8">
        <SessionCreationFlow 
          initialConfig={{}} 
          onSubmit={handleCreateSession}
          isSubmitting={loading}
        />
      </div>
      
      <LogViewer />
    </div>
  );
} 