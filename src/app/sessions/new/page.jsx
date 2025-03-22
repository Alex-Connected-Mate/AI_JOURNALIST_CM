'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SessionCreationFlow from '@/components/SessionCreationFlow';
import { useStore } from '@/lib/store';
import { createSession } from '@/lib/supabase';
import logger from '@/lib/logger';

export default function NewSessionPage() {
  const router = useRouter();
  const { userProfile } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState('basic');

  const handleStepChange = (step) => {
    setCurrentStep(step);
  };

  const handleCreateSession = async (sessionData) => {
    try {
      setLoading(true);
      setError(null);

      // Validate required fields
      if (!sessionData.title) {
        throw new Error('Le titre de la session est requis');
      }

      if (!sessionData.max_participants || sessionData.max_participants < 1) {
        throw new Error('Le nombre maximum de participants doit être supérieur à 0');
      }

      // Create session
      const { data: session, error: createError } = await createSession({
        ...sessionData,
        user_id: userProfile.id,
        status: 'draft'
      });

      if (createError) {
        throw createError;
      }

      setSuccess(true);
      
      // Redirect to session page after a short delay
      setTimeout(() => {
        router.push(`/sessions/${session.id}`);
      }, 1500);
    } catch (err) {
      logger.error('Error creating session:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Créer une nouvelle session</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configurez votre session en quelques étapes simples.
          </p>
        </div>
        <Link href="/sessions" className="cm-button-outline">
          Retour aux sessions
        </Link>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          Session créée avec succès ! Redirection en cours...
        </div>
      )}

      <SessionCreationFlow
        initialConfig={{
          title: '',
          description: '',
          institution: '',
          professorName: '',
          showProfessorName: true,
          maxParticipants: 30,
          timerEnabled: false,
          timerDuration: 5,
          settings: {
            connection: {
              anonymityLevel: 'semi-anonymous',
              loginMethod: 'email',
              approvalRequired: false
            }
          }
        }}
        onSubmit={handleCreateSession}
        isSubmitting={loading}
        currentStep={currentStep}
        onStepChange={handleStepChange}
      />
    </div>
  );
} 