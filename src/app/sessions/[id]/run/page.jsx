/**
 * Page d'exécution de session pour le professeur
 * 
 * Cette page permet au professeur de:
 * 1. Superviser la session en cours
 * 2. Voir l'activité des participants en temps réel
 * 3. Lancer les analyses des discussions
 * 4. Visualiser les résultats d'analyse
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import ProfessorDashboard from '@/components/analysis/ProfessorDashboard';
import logger from '@/lib/logger';

export default function RunSessionPage({ params }) {
  const sessionId = params.id;
  const router = useRouter();
  const { user } = useStore();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionConfig, setSessionConfig] = useState(null);
  
  // Vérifier l'authentification et charger la session
  useEffect(() => {
    const checkAuth = async () => {
      if (!user) {
        router.push('/auth/login?redirect=' + encodeURIComponent(`/sessions/${sessionId}/run`));
        return;
      }
      
      try {
        setLoading(true);
        
        // Charger les données de la session
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single();
        
        if (sessionError) {
          throw sessionError;
        }
        
        // Vérifier que l'utilisateur est bien le propriétaire de la session
        if (sessionData.user_id !== user.id) {
          setError('Vous n\'êtes pas autorisé à accéder à cette session.');
          setLoading(false);
          return;
        }
        
        setSession(sessionData);
        
        // Récupérer la configuration spécifique à l'analyse depuis les settings
        if (sessionData.settings) {
          // Si settings est stocké en JSON dans la base de données
          const settings = typeof sessionData.settings === 'string'
            ? JSON.parse(sessionData.settings)
            : sessionData.settings;
            
          setSessionConfig({
            nuggetsRules: settings?.aiInteraction?.nuggets || {
              focusOnKeyInsights: true,
              discoverPatterns: true,
              quoteRelevantExamples: true
            },
            lightbulbsRules: settings?.aiInteraction?.lightbulbs || {
              captureInnovativeThinking: true,
              identifyCrossPollination: true,
              evaluatePracticalApplications: true
            },
            overallRules: settings?.aiInteraction?.overall || {
              synthesizeAllInsights: true,
              extractActionableRecommendations: true,
              provideSessionSummary: true
            }
          });
        } else {
          // Configuration par défaut si aucune configuration n'est trouvée
          setSessionConfig({
            nuggetsRules: {
              focusOnKeyInsights: true,
              discoverPatterns: true,
              quoteRelevantExamples: true
            },
            lightbulbsRules: {
              captureInnovativeThinking: true,
              identifyCrossPollination: true,
              evaluatePracticalApplications: true
            },
            overallRules: {
              synthesizeAllInsights: true,
              extractActionableRecommendations: true,
              provideSessionSummary: true
            }
          });
        }
        
        // Mettre à jour le statut de la session si elle est en brouillon
        if (sessionData.status === 'draft') {
          const { error: updateError } = await supabase
            .from('sessions')
            .update({
              status: 'active',
              started_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', sessionId);
            
          if (updateError) {
            logger.error('Erreur lors de l\'activation de la session:', updateError);
          } else {
            logger.session('Session activée avec succès');
            setSession(prev => ({ ...prev, status: 'active', started_at: new Date().toISOString() }));
          }
        }
        
        setLoading(false);
      } catch (error) {
        logger.error('Erreur lors du chargement de la session:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [sessionId, user, router]);
  
  // Gérer la fin de la session
  const handleEndSession = async () => {
    if (!confirm('Êtes-vous sûr de vouloir terminer cette session ? Les participants ne pourront plus interagir.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      if (error) {
        throw error;
      }
      
      logger.session('Session terminée avec succès');
      setSession(prev => ({ ...prev, status: 'ended', ended_at: new Date().toISOString() }));
    } catch (error) {
      logger.error('Erreur lors de la fin de la session:', error);
      setError('Erreur lors de la fin de la session: ' + error.message);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de la session...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
        <div className="mt-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Session introuvable.</p>
        </div>
        <div className="mt-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 pb-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Retour au tableau de bord
          </Link>
          <h1 className="text-3xl font-bold">Session: {session.name}</h1>
        </div>
        
        {session.status === 'active' && (
          <button
            onClick={handleEndSession}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
          >
            Terminer la session
          </button>
        )}
        
        {session.status === 'ended' && (
          <div className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg">
            Session terminée le {new Date(session.ended_at).toLocaleString()}
          </div>
        )}
      </div>
      
      <ProfessorDashboard 
        sessionId={sessionId}
        sessionConfig={sessionConfig}
      />
    </div>
  );
} 