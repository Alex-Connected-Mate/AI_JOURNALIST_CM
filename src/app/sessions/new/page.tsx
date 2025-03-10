'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import logger from '@/lib/logger';
import { validateSessionData } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import SessionCreationFlow from '@/components/SessionCreationFlow';
import LogViewer from '@/components/LogViewer';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define types
type CreationStep = 'basic_info' | 'connection' | 'discussion' | 'ai_interaction' | 'lightbulb' | 'analysis' | 'ready';

interface SessionConfig {
  title?: string;
  sessionName?: string;
  basicInfo?: {
    title?: string;
    description?: string;
  };
  connection?: {
    anonymityLevel?: 'anonymous' | 'semi-anonymous' | 'non-anonymous';
    maxParticipants?: number;
  };
  settings?: {
    aiInteraction?: {
      nuggetsRules?: {
        customRules?: string;
      };
      lightbulbsRules?: {
        customRules?: string;
      };
    };
  };
}

interface CurrentSession {
  settings: SessionConfig;
  creation_step: CreationStep;
}

export default function NewSessionPage() {
  const router = useRouter();
  const { user } = useStore();
  
  // Session creation states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<CurrentSession | null>(null);
  
  // Handle the session creation process when the form is submitted
  const handleCreateSession = async (sessionConfig: SessionConfig) => {
    if (!user) {
      const errorMsg = 'Vous devez être connecté pour créer une session';
      setError(errorMsg);
      logger.error('Session creation failed: ' + errorMsg);
      router.push('/auth/login?redirect=/sessions/new');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    // Track creation start
    logger.session('Starting session creation');

    try {
      // Validate session data
      const validationResult = validateSessionData({
        title: sessionConfig.title || sessionConfig.sessionName,
        user_id: user.id,
        settings: sessionConfig
      });

      if (!validationResult.isValid && validationResult.error) {
        logger.error('Session validation failed: ' + validationResult.error);
        setError(validationResult.error);
        return;
      }

      // Create session
      const { data: session, error: createError } = await supabase
        .from('sessions')
        .insert([
          {
            title: sessionConfig.title || sessionConfig.sessionName,
            user_id: user.id,
            settings: sessionConfig,
            status: 'draft'
          }
        ])
        .select()
        .single();

      if (createError) {
        logger.error('Session creation failed: ' + createError.message);
        throw createError;
      }

      if (session) {
        logger.session('Session created successfully');
        setSuccess('Session créée avec succès !');
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Une erreur est survenue lors de la création de la session';
      logger.error('Session creation failed: ' + errorMsg);
      setError(errorMsg);
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
          initialConfig={currentSession?.settings || {}} 
          onSubmit={handleCreateSession}
          isSubmitting={loading}
          currentStep={currentSession?.creation_step}
        />
      </div>
      
      <LogViewer />
    </div>
  );
} 