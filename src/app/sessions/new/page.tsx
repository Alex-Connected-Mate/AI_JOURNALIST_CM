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
import { AgentService } from '@/lib/services/agentService';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type AnonymityLevel = 'semi-anonymous' | 'anonymous' | 'non-anonymous' | 'fully-anonymous';
type LoginMethod = 'email' | 'code' | 'none';

interface ConnectionSettings {
  anonymityLevel: AnonymityLevel;
  loginMethod: LoginMethod;
  approvalRequired: boolean;
  color: string;
  emoji: string;
}

interface AIConfiguration {
  style: any;
  rules: any;
  enabled: boolean;
}

interface AIInteractionSettings {
  enabled: boolean;
  configuration: {
    nuggets: AIConfiguration;
    lightbulbs: AIConfiguration;
  };
}

interface SessionSettings {
  institution: string;
  professorName: string;
  showProfessorName: boolean;
  maxParticipants: number;
  connection: ConnectionSettings;
  discussion: Record<string, any>;
  aiInteraction: AIInteractionSettings;
}

interface NewSessionData {
  title: string;
  status: 'draft' | 'active' | 'ended';
  settings: SessionSettings;
}

const createAgentConfig = async (agentType: string, config: any): Promise<AIConfiguration> => {
  return {
    style: agentType === 'nuggets' ? config.nuggetsStyle : config.lightbulbsStyle,
    rules: agentType === 'nuggets' ? config.nuggetsRules : config.lightbulbsRules,
    enabled: true
  };
};

export default function NewSessionPage() {
  const router = useRouter();
  const { user, createSession: storeCreateSession, userProfile } = useStore();
  
  // Session creation states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'basic' | 'ai' | 'review'>('basic');
  const [sessionData, setSessionData] = useState({
    title: '',
    description: '',
    max_participants: 100,
  });
  
  // Vérifier les limites d'utilisation selon l'abonnement
  const canCreateSession = () => {
    return true; // Toujours permettre la création de sessions, indépendamment de l'abonnement
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
    logger.session('Starting session creation process');
    
    try {
      logger.session('Processing session configuration');
      
      const sessionData = {
        title: sessionConfig.sessionName || sessionConfig.basicInfo?.title || '',
        description: sessionConfig.description || '',
        settings: {
          institution: sessionConfig.institution || '',
          professorName: sessionConfig.professorName || '',
          showProfessorName: sessionConfig.showProfessorName ?? true,
          maxParticipants: sessionConfig.maxParticipants || 30,
          connection: {
            anonymityLevel: (sessionConfig.connection?.anonymityLevel || 'semi-anonymous') as AnonymityLevel,
            loginMethod: (sessionConfig.connection?.loginMethod || 'email') as LoginMethod,
            approvalRequired: sessionConfig.connection?.approvalRequired || false,
            color: '#3490dc',
            emoji: '🎓'
          },
          discussion: sessionConfig.discussion || {},
          aiInteraction: {
            enabled: true,
            configuration: {
              nuggets: await createAgentConfig('nuggets', sessionConfig),
              lightbulbs: await createAgentConfig('lightbulbs', sessionConfig)
            }
          }
        }
      };

      const { data: session, error: sessionError } = await supabase.rpc('create_session_secure', {
        p_title: sessionData.title,
        p_description: sessionData.description,
        p_settings: sessionData.settings,
        p_max_participants: sessionData.settings.maxParticipants
      });
      
      if (sessionError) throw sessionError;

      // Create agents for the session
      await Promise.all([
        createSessionAgent('nuggets', session.id, sessionConfig, user.id),
        createSessionAgent('lightbulbs', session.id, sessionConfig, user.id)
      ]);

      logger.session('Session created successfully');
      setSuccess('Session créée avec succès !');
      router.push(`/sessions/${session.id}/edit`);
    } catch (err: any) {
      const errorMsg = err.message || 'Une erreur est survenue lors de la création de la session';
      logger.error('Session creation failed');
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
      if (data?.id) {
        router.push(`/sessions/${data.id}`);
      } else {
        throw new Error('No session data returned');
      }
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSessionAgent = async (
    agentType: string,
    sessionId: string,
    config: any,
    userId: string
  ) => {
    try {
      // Créer ou récupérer l'agent
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .upsert([{
          name: agentType === 'nuggets' ? 'Elias' : 'Sonia',
          description: agentType === 'nuggets' ? 
            'Agent spécialisé dans la création de nuggets de connaissances' : 
            'Agent spécialisé dans la génération d\'idées innovantes',
          agent_type: agentType,
          created_by: userId,
          is_active: true
        }], {
          onConflict: 'name, agent_type',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (agentError) throw agentError;

      // Créer la configuration du prompt
      const { data: prompt, error: promptError } = await supabase
        .from('agent_prompts')
        .insert([{
          agent_id: agent.id,
          style: config.aiInteraction?.configuration?.[agentType]?.style || {},
          rules: config.aiInteraction?.configuration?.[agentType]?.rules || [],
          questions: config.aiInteraction?.configuration?.[agentType]?.questions || [],
          template_version: '1.0',
          base_prompt: config.aiInteraction?.configuration?.[agentType]?.basePrompt || '',
          created_by: userId
        }])
        .select()
        .single();

      if (promptError) throw promptError;

      // Créer la configuration d'analyse
      const { data: analysis, error: analysisError } = await supabase
        .from('agent_analysis_config')
        .insert([{
          agent_id: agent.id,
          analysis_type: agentType === 'nuggets' ? 'knowledge_extraction' : 'idea_generation',
          parameters: {
            format: 'structured',
            criteria: agentType === 'nuggets' ? 
              ['relevance', 'accuracy', 'clarity'] : 
              ['innovation', 'feasibility', 'impact'],
            settings: config.aiInteraction?.configuration?.[agentType]?.analysisSettings || {}
          },
          enabled: true
        }])
        .select()
        .single();

      if (analysisError) throw analysisError;

      // Lier l'agent à la session
      const { error: sessionAgentError } = await supabase.rpc('create_session_agent', {
        p_session_id: sessionId,
        p_agent_id: agent.id,
        p_is_primary: agentType === 'nuggets',
        p_configuration: {
          temperature: 0.7,
          max_tokens: 2000,
          prompt_template: prompt.base_prompt
        },
        p_settings: {
          visibility: true,
          interaction_mode: 'auto',
          response_delay: 0,
          participation_rules: config.aiInteraction?.configuration?.[agentType]?.participationRules || {}
        }
      });

      if (sessionAgentError) throw sessionAgentError;

      logger.session(`Agent ${agentType} created and configured successfully`);
      return agent.id;
    } catch (error) {
      logger.error(`Failed to create session agent ${agentType}:`, error);
      throw error;
    }
  };

  if (!canCreateSession()) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="first-level-block p-6 rounded-xl text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Une erreur est survenue
          </h2>
          <p className="text-gray-600 mb-6">
            Impossible de créer une session pour le moment. Veuillez réessayer ultérieurement.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="cm-button"
          >
            Retour au tableau de bord
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
            {step === 'ai' && "Configuration de l'IA"}
            {step === 'review' && 'Vérification finale'}
          </h1>
          <p className="mt-2 text-gray-600">
            {step === 'basic' && 'Commencez par définir les informations de base de votre session.'}
            {step === 'ai' && "Configurez les paramètres de l'IA pour votre session."}
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
                    value={sessionData.title}
                    onChange={(e) => setSessionData({ ...sessionData, title: e.target.value })}
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
                    max="9999"
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
                      <dd className="mt-1 text-sm text-gray-900">{sessionData.title}</dd>
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