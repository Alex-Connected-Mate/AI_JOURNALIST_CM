'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import SessionCreationFlow from '@/components/SessionCreationFlow';
import LogViewer from '@/components/LogViewer';
import sessionTracker from '@/lib/sessionTracker';
import logger from '@/lib/logger';
import AIConfigurationForm from '@/components/AIConfigurationForm';
import { supabase } from '@/lib/supabase';
import { validateSessionSettings } from '@/lib/validation/sessionSchema';
import { validateAIConfiguration, validateAISettings } from '@/lib/validation/aiConfigSchema';
import { SessionConfigType } from '@/types/session';

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
    style: config.aiInteraction?.configuration?.[agentType]?.style || {},
    rules: config.aiInteraction?.configuration?.[agentType]?.rules || [],
    enabled: true
  };
};

export default function NewSessionPage() {
  const router = useRouter();
  const { user } = useStore();
  
  // Session creation states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [step, setStep] = useState<'basic' | 'ai' | 'review'>('basic');
  const [sessionConfig, setSessionConfig] = useState<SessionConfigType>({
    title: '',
    description: '',
    maxParticipants: 30,
    institution: '',
    professorName: '',
    showProfessorName: true,
    connection: {
      anonymityLevel: 'semi-anonymous',
      loginMethod: 'email',
      approvalRequired: false
    },
    aiInteraction: {
      enabled: true,
      configuration: {
        nuggets: {
          style: {},
          rules: [],
          enabled: true
        },
        lightbulbs: {
          style: {},
          rules: [],
          enabled: true
        }
      }
    }
  });

  // Vérifier les limites d'utilisation selon l'abonnement
  const canCreateSession = () => {
    return true; // Toujours permettre la création de sessions, indépendamment de l'abonnement
  };

  const handleStepChange = (newStep: 'basic' | 'ai' | 'review') => {
    setStep(newStep);
  };

  const handleCreateSession = async (config: Partial<SessionConfigType>) => {
    if (!user) {
      const errorMsg = 'Vous devez être connecté pour créer une session';
      setError(errorMsg);
      sessionTracker.trackSessionCreation.error(config, new Error(errorMsg));
      router.push('/auth/login?redirect=/sessions/new');
      return;
    }
    
    // Si nous ne sommes pas à l'étape de review, mettre à jour la config et passer à l'étape suivante
    if (step !== 'review') {
      setSessionConfig(prevConfig => ({
        ...prevConfig,
        ...config
      }));
      handleStepChange(step === 'basic' ? 'ai' : 'review');
      return;
    }
    
    // Validation finale avant création
    try {
      const mergedConfig = {
        ...sessionConfig,
        ...config
      };

      // Vérification des champs requis
      if (!mergedConfig.title?.trim()) {
        throw new Error('Le nom de la session est requis');
      }

      if (!mergedConfig.maxParticipants || mergedConfig.maxParticipants < 1) {
        throw new Error('Le nombre maximum de participants doit être supérieur à 0');
      }

      setLoading(true);
      setError(null);
      
      // Track creation start
      sessionTracker.trackSessionCreation.start(mergedConfig);
      
      // Création de la session
      const { data: session, error: sessionError } = await supabase.rpc('create_session_secure', {
        p_title: mergedConfig.title,
        p_description: mergedConfig.description || '',
        p_settings: {
          institution: mergedConfig.institution || '',
          professorName: mergedConfig.professorName || '',
          showProfessorName: mergedConfig.showProfessorName ?? true,
          maxParticipants: mergedConfig.maxParticipants || 30,
          connection: mergedConfig.connection,
          aiInteraction: {
            enabled: true,
            configuration: {
              nuggets: await createAgentConfig('nuggets', mergedConfig),
              lightbulbs: await createAgentConfig('lightbulbs', mergedConfig)
            }
          }
        },
        p_max_participants: mergedConfig.maxParticipants || 30
      });
      
      if (sessionError) throw sessionError;

      // Création des agents
      await Promise.all([
        createSessionAgent('nuggets', session.id, mergedConfig, user.id),
        createSessionAgent('lightbulbs', session.id, mergedConfig, user.id)
      ]);

      sessionTracker.trackSessionCreation.success(mergedConfig, session);
      setSuccess('Session créée avec succès !');
      
      // Redirection après un court délai
      setTimeout(() => {
        router.push(`/sessions/${session.id}/edit`);
      }, 1500);

    } catch (err: any) {
      const errorMsg = err.message || 'Une erreur est survenue lors de la création de la session';
      sessionTracker.trackSessionCreation.error(config, err);
      setError(errorMsg);
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
      // Validate AI configuration
      const aiConfig = {
        type: agentType === 'nuggets' ? 'knowledge_extraction' : 'idea_generation',
        parameters: {
          temperature: 0.7,
          max_tokens: 2000,
          prompt_template: config.aiInteraction?.configuration?.[agentType]?.basePrompt || ''
        },
        enabled: true
      };
      
      const aiSettings = {
        visibility: true,
        interaction_mode: 'auto',
        response_delay: 0,
        participation_rules: config.aiInteraction?.configuration?.[agentType]?.participationRules || {}
      };

      validateAIConfiguration(aiConfig);
      validateAISettings(aiSettings);

      // Créer ou récupérer l'agent en utilisant la fonction sécurisée
      const { data: agent, error: agentError } = await supabase.rpc('create_agent_secure', {
        p_name: agentType === 'nuggets' ? 'Elias' : 'Sonia',
        p_description: agentType === 'nuggets' ? 
          'Agent spécialisé dans la création de nuggets de connaissances' : 
          'Agent spécialisé dans la génération d\'idées innovantes',
        p_agent_type: agentType,
        p_is_active: true
      });

      if (agentError) throw agentError;

      // Créer la configuration du prompt en utilisant la fonction sécurisée
      const { data: prompt, error: promptError } = await supabase.rpc('create_agent_prompt_secure', {
        p_agent_id: agent,
        p_style: config.aiInteraction?.configuration?.[agentType]?.style || {},
        p_rules: config.aiInteraction?.configuration?.[agentType]?.rules || [],
        p_questions: config.aiInteraction?.configuration?.[agentType]?.questions || [],
        p_template_version: '1.0',
        p_base_prompt: config.aiInteraction?.configuration?.[agentType]?.basePrompt || ''
      });

      if (promptError) throw promptError;

      // Créer la configuration d'analyse en utilisant la fonction sécurisée
      const { data: analysis, error: analysisError } = await supabase.rpc('create_agent_analysis_config_secure', {
        p_agent_id: agent,
        p_analysis_type: agentType === 'nuggets' ? 'knowledge_extraction' : 'idea_generation',
        p_parameters: {
          format: 'structured',
          criteria: agentType === 'nuggets' ? 
            ['relevance', 'accuracy', 'clarity'] : 
            ['innovation', 'feasibility', 'impact'],
          settings: config.aiInteraction?.configuration?.[agentType]?.analysisSettings || {}
        },
        p_enabled: true
      });

      if (analysisError) throw analysisError;

      // Lier l'agent à la session
      const { error: sessionAgentError } = await supabase.rpc('create_session_agent', {
        p_agent_id: agent,
        p_configuration: aiConfig,
        p_is_primary: agentType === 'nuggets',
        p_settings: aiSettings,
        p_session_id: sessionId
      });

      if (sessionAgentError) throw sessionAgentError;

      logger.session(`Agent ${agentType} created and configured successfully`);
      return agent;
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
            Redirection vers l'édition de la session dans quelques secondes...
          </div>
        </div>
      )}
      
      <div className="bento-card mb-8">
        <SessionCreationFlow 
          initialConfig={sessionConfig} 
          onSubmit={handleCreateSession}
          isSubmitting={loading}
          currentStep={step}
          onStepChange={handleStepChange}
        />
      </div>
      
      <LogViewer />
    </div>
  );
} 