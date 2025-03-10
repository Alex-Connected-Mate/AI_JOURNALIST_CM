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
import AIConfigurationForm from '@/components/AIConfigurationForm';

export default function NewSessionPage() {
  const router = useRouter();
  const { user, createSession: storeCreateSession, userProfile } = useStore();
  
  // Session creation states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'basic' | 'ai' | 'review'>('basic');
  const [sessionData, setSessionData] = useState({
    name: '',
    description: '',
    max_participants: 100,
  });
  
  // Vérifier les limites d'utilisation selon l'abonnement
  const canCreateSession = () => {
    if (!userProfile) return false;
    switch (userProfile.subscription_status) {
      case 'free':
        return true; // Limité à 3 sessions dans la base de données
      case 'premium':
        return true; // Limité à 50 sessions dans la base de données
      case 'enterprise':
        return true; // Illimité
      default:
        return false;
    }
  };

  // Handle the session creation process when the form is submitted
  const handleCreateSession = async (sessionConfig: any) => {
    if (!user) {
      const errorMsg = 'Vous devez être connecté pour créer une session';
      setError(errorMsg);
      sessionTracker.trackSessionCreation.error(sessionConfig, new Error(errorMsg));
      router.push('/auth/login?redirect=/sessions/new');
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
          institution: sessionConfig.institution || '',
          professorName: sessionConfig.professorName || '',
          showProfessorName: sessionConfig.showProfessorName ?? true,
          maxParticipants: sessionConfig.maxParticipants || 30,
          connection: {
            anonymityLevel: sessionConfig.connection?.anonymityLevel || 'semi-anonymous',
            loginMethod: sessionConfig.connection?.loginMethod || 'email',
            approvalRequired: sessionConfig.connection?.approvalRequired || false,
            color: '#3490dc',
            emoji: '🎓'
          },
          discussion: {},
          aiInteraction: {
            nuggets: {
              focusOnKeyInsights: sessionConfig.nuggetsRules?.focusOnKeyInsights ?? true,
              discoverPatterns: sessionConfig.nuggetsRules?.discoverPatterns ?? true,
              quoteRelevantExamples: sessionConfig.nuggetsRules?.quoteRelevantExamples ?? true,
              customRules: sessionConfig.nuggetsRules?.customRules || ''
            },
            lightbulbs: {
              captureInnovativeThinking: sessionConfig.lightbulbsRules?.captureInnovativeThinking ?? true,
              identifyCrossPollination: sessionConfig.lightbulbsRules?.identifyCrossPollination ?? true,
              evaluatePracticalApplications: sessionConfig.lightbulbsRules?.evaluatePracticalApplications ?? true,
              customRules: sessionConfig.lightbulbsRules?.customRules || ''
            },
            overall: {
              synthesizeAllInsights: sessionConfig.overallRules?.synthesizeAllInsights ?? true,
              extractActionableRecommendations: sessionConfig.overallRules?.extractActionableRecommendations ?? true,
              provideSessionSummary: sessionConfig.overallRules?.provideSessionSummary ?? true,
              customRules: sessionConfig.overallRules?.customRules || ''
            }
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

      // Validate the transformed data
      logger.session('Validating session data', sessionData);
      const validation = validateSessionData(sessionData);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid session data');
      }
      
      // Create the session
      logger.session('Creating session in database...', sessionData);
      const { data: session, error } = await createSession(sessionData);
      
      if (error) {
        if (error.message?.includes('sessions_user_id_fkey')) {
          // Handle foreign key constraint error
          setError('Erreur de création du profil utilisateur. Veuillez vous reconnecter.');
          router.push('/auth/login?redirect=/sessions/new');
          return;
        }
        throw error;
      }
      
      if (session) {
        logger.session('Session created successfully', session);
        setSuccess('Session créée avec succès !');
        router.push(`/sessions/${session.id}`);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Une erreur est survenue lors de la création de la session';
      logger.error('Session creation failed', err);
      setError(errorMsg);
      sessionTracker.trackSessionCreation.error(sessionConfig, err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'basic') {
      setStep('ai');
      return;
    }
    if (step === 'ai') {
      setStep('review');
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await storeCreateSession(sessionData);
      if (error) throw error;
      router.push(`/sessions/${data.id}`);
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!canCreateSession()) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="first-level-block p-6 rounded-xl text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Limite de sessions atteinte
          </h2>
          <p className="text-gray-600 mb-6">
            Vous avez atteint la limite de sessions pour votre abonnement actuel.
            Passez à un abonnement supérieur pour créer plus de sessions.
          </p>
          <button
            onClick={() => router.push('/settings/subscription')}
            className="cm-button"
          >
            Voir les abonnements
          </button>
        </div>
      </div>
    );
  }

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

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {step === 'basic' && 'Créer une nouvelle session'}
            {step === 'ai' && 'Configuration de l'IA'}
            {step === 'review' && 'Vérification finale'}
          </h1>
          <p className="mt-2 text-gray-600">
            {step === 'basic' && 'Commencez par définir les informations de base de votre session.'}
            {step === 'ai' && 'Configurez les paramètres de l'IA pour votre session.'}
            {step === 'review' && 'Vérifiez les informations avant de créer la session.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 'basic' && (
            <div className="first-level-block p-6 rounded-xl">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nom de la session
                  </label>
                  <input
                    type="text"
                    value={sessionData.name}
                    onChange={(e) => setSessionData({ ...sessionData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={sessionData.description}
                    onChange={(e) => setSessionData({ ...sessionData, description: e.target.value })}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Nombre maximum de participants
                  </label>
                  <input
                    type="number"
                    value={sessionData.max_participants}
                    onChange={(e) => setSessionData({ ...sessionData, max_participants: parseInt(e.target.value) })}
                    min="1"
                    max={userProfile?.subscription_status === 'enterprise' ? 999 : 100}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 'ai' && (
            <div className="first-level-block p-6 rounded-xl">
              <AIConfigurationForm
                sessionId="temp"
                onSave={() => setStep('review')}
              />
            </div>
          )}

          {step === 'review' && (
            <div className="first-level-block p-6 rounded-xl">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Informations de base</h3>
                  <dl className="mt-4 space-y-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Nom</dt>
                      <dd className="mt-1 text-sm text-gray-900">{sessionData.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="mt-1 text-sm text-gray-900">{sessionData.description}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Participants maximum</dt>
                      <dd className="mt-1 text-sm text-gray-900">{sessionData.max_participants}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            {step !== 'basic' && (
              <button
                type="button"
                onClick={() => setStep(step === 'review' ? 'ai' : 'basic')}
                className="cm-button-secondary"
              >
                Retour
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="cm-button"
            >
              {loading ? 'Création...' : step === 'review' ? 'Créer la session' : 'Continuer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 