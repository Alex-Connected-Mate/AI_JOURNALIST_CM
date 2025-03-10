'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import SessionCreationFlow from '@/components/SessionCreationFlow';
import LogViewer from '@/components/LogViewer';
import { createSession, validateSessionData } from '@/lib/supabase';
import type { SessionData } from '@/lib/supabase';
import sessionTracker from '@/lib/sessionTracker';
import logger from '@/lib/logger';

export default function NewSessionPage() {
  const router = useRouter();
  const { user } = useStore();
  
  // Session creation states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
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
    setSuccess(null);
    
    // Track creation start
    sessionTracker.trackSessionCreation.start(sessionConfig);
    logger.session('Starting session creation process', sessionConfig);
    
    try {
      logger.session('Processing session configuration', sessionConfig);
      
      // Transform the session config into the expected format
      const sessionData: Partial<SessionData> = {
        title: sessionConfig.sessionName || sessionConfig.basicInfo?.title || '',
        description: sessionConfig.basicInfo?.description || '',
        status: 'draft' as const,
        user_id: user.id,
        settings: {
          institution: sessionConfig.basicInfo?.institution || sessionConfig.institution || '',
          professorName: sessionConfig.basicInfo?.professorName || sessionConfig.professorName || user.full_name || '',
          showProfessorName: sessionConfig.basicInfo?.showProfessorName ?? sessionConfig.showProfessorName ?? true,
          maxParticipants: sessionConfig.basicInfo?.maxParticipants || sessionConfig.maxParticipants || 30,
          connection: {
            anonymityLevel: sessionConfig.connection?.anonymityLevel || 'semi-anonymous',
            loginMethod: sessionConfig.connection?.loginMethod || 'email',
            approvalRequired: sessionConfig.connection?.approvalRequired || false,
            color: sessionConfig.connection?.color || '#3490dc',
            emoji: sessionConfig.connection?.emoji || '🎓'
          },
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

      // Ensure title is provided - this is a required field
      if (!sessionData.title) {
        if (sessionConfig.title) {
          sessionData.title = sessionConfig.title;
        } else if (sessionConfig.name) {
          sessionData.title = sessionConfig.name;
        } else {
          throw new Error('Le titre de la session est requis');
        }
      }

      logger.session('Transformed session data', sessionData);

      // Validate the session data
      const validation = validateSessionData(sessionData);
      if (!validation.isValid) {
        logger.error('Session data validation failed', validation.error);
        throw new Error(validation.error || 'Données de session invalides');
      }
      
      sessionTracker.trackSessionCreation.validation(sessionConfig, validation);
      
      // Track the transformation
      sessionTracker.trackSessionCreation.transform(sessionConfig, sessionData);

      logger.session('Creating session in database...', sessionData);
      
      // Track API submission
      sessionTracker.trackSessionCreation.submit(sessionData);
      
      const { data, error: createError } = await createSession(sessionData);
      
      if (createError) {
        logger.error('Failed to create session', createError);
        sessionTracker.trackSessionCreation.error(sessionData, createError);
        throw createError;
      }
      
      if (!data) {
        throw new Error('Aucune donnée retournée lors de la création de la session');
      }
      
      // Track success
      sessionTracker.trackSessionCreation.success(sessionData, data);
      
      logger.session('Session created successfully', data);
      
      // Show success message and delay redirect
      setSuccess(`Session "${data.name}" créée avec succès! Code d'accès: ${data.access_code}`);
      setLoading(false);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push('/dashboard?success=session-created');
      }, 3000);
    } catch (err: any) {
      logger.error('Session creation failed', err);
      setError(`Une erreur s'est produite lors de la création de la session: ${err.message || JSON.stringify(err)}`);
      
      // Track error
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
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          {success}
          <div className="mt-2 text-sm">
            Redirection vers le tableau de bord dans quelques secondes...
          </div>
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