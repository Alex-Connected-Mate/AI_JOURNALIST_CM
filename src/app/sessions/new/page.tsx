'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import SessionCreationFlow from '@/components/SessionCreationFlow';
import LogViewer from '@/components/LogViewer';
// Import commenté pour le mode développement
// import { createSession } from '@/lib/supabase';

export default function NewSessionPage() {
  const router = useRouter();
  const { user } = useStore();
  
  // Session creation states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle the session creation process when the form is submitted
  const handleCreateSession = async (sessionConfig: any) => {
    if (!user) {
      setError('Vous devez être connecté pour créer une session');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Mode développement: simuler la création de session
      console.log('Création de session (mode développement):', {
        ...sessionConfig,
        user_id: user.id,
        status: 'draft',
      });
      
      // Simuler un délai pour l'expérience utilisateur
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // En mode production, nous utiliserions:
      /*
      const { data, error: createError } = await createSession({
        ...sessionConfig,
        user_id: user.id,
        status: 'draft',
      });
      
      if (createError) {
        console.error('Error creating session:', createError);
        throw createError;
      }
      */
      
      // Rediriger vers le tableau de bord avec un message de succès
      router.push('/dashboard?success=session-created');
    } catch (err: any) {
      console.error('Error creating session:', err);
      setError(`Une erreur s'est produite lors de la création de la session: ${err.message || JSON.stringify(err)}`);
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
      
      {/* Use the new LogViewer component instead of the inline logger */}
      <LogViewer />
    </div>
  );
} 