'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

interface ResultsPageProps {
  params: {
    id: string;
  };
}

export default function SessionResultsPage({ params }: ResultsPageProps) {
  const sessionId = params.id;
  const router = useRouter();
  const { user } = useStore();
  
  const [session, setSession] = useState<any>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Charger les informations de la session et les contributions
  useEffect(() => {
    async function loadSessionData() {
      if (!sessionId || !user) return;
      
      try {
        setLoading(true);
        
        // Charger les informations de la session
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single();
          
        if (sessionError) throw sessionError;
        if (!sessionData) throw new Error('Session non trouvée');
        
        setSession(sessionData);
        
        // Charger les contributions avec leurs votes
        const { data: contributionsData, error: contributionsError } = await supabase
          .from('contributions')
          .select(`
            *,
            votes:contribution_votes(*)
          `)
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });
          
        if (contributionsError) throw contributionsError;
        
        // Trier les contributions par nombre de votes
        const sortedContributions = contributionsData?.sort((a, b) => {
          return (b.votes?.length || 0) - (a.votes?.length || 0);
        }) || [];
        
        setContributions(sortedContributions);
        
      } catch (err: any) {
        console.error('Error loading session data:', err);
        setError('Impossible de charger les données de la session. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    }
    
    loadSessionData();
  }, [sessionId, user]);
  
  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center p-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-6 text-lg">Chargement des résultats...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Erreur</h2>
          <p>{error}</p>
          <div className="mt-6">
            <Link href="/dashboard" className="cm-button">
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Session non trouvée</h2>
          <p>Impossible de trouver les informations de la session.</p>
          <div className="mt-6">
            <Link href="/dashboard" className="cm-button">
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6">
        <Link href={`/sessions/${sessionId}`} className="text-blue-600 hover:text-blue-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Retour à la session
        </Link>
      </div>
      
      <div className="bento-card mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-bricolage">Résultats de la session</h1>
            <p className="text-gray-600 mt-1">{session.name}</p>
          </div>
          
          <div>
            <button className="cm-button-secondary flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Exporter les résultats
            </button>
          </div>
        </div>
      </div>
      
      {/* Résumé des résultats */}
      <div className="bento-card mb-6">
        <h2 className="text-xl font-semibold mb-4">Résumé</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="text-blue-700 text-sm font-medium mb-1">Contributions</div>
            <div className="text-2xl font-bold">{contributions.length}</div>
          </div>
          
          <div className="bg-green-50 border border-green-100 rounded-lg p-4">
            <div className="text-green-700 text-sm font-medium mb-1">Votes totaux</div>
            <div className="text-2xl font-bold">
              {contributions.reduce((total, contribution) => total + (contribution.votes?.length || 0), 0)}
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
            <div className="text-purple-700 text-sm font-medium mb-1">Participants</div>
            <div className="text-2xl font-bold">
              {/* Calculer le nombre unique de participants */}
              {new Set(contributions.map(c => c.user_id)).size}
            </div>
          </div>
        </div>
        
        {/* Synthèse IA (placeholder) */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            <h3 className="font-medium">Synthèse IA</h3>
          </div>
          
          <p className="text-gray-700">
            Les principales idées qui ressortent de cette session concernent l'amélioration de l'expérience utilisateur, 
            l'optimisation des performances et l'ajout de nouvelles fonctionnalités. Les participants ont particulièrement 
            mis en avant l'importance de la simplicité d'utilisation et de l'accessibilité.
          </p>
        </div>
      </div>
      
      {/* Liste des contributions */}
      <div className="bento-card">
        <h2 className="text-xl font-semibold mb-4">Contributions les plus votées</h2>
        
        {contributions.length === 0 ? (
          <p className="text-gray-600">
            Aucune contribution n'a été faite durant cette session.
          </p>
        ) : (
          <div className="space-y-4">
            {contributions.slice(0, 10).map((contribution, index) => (
              <div 
                key={contribution.id} 
                className={`p-4 rounded-lg border ${
                  index < 3 ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 rounded-full h-8 w-8 flex items-center justify-center font-semibold ${
                    index < 3 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {index + 1}
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-gray-900">{contribution.content}</p>
                    
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                          {contribution.votes?.length || 0} votes
                        </span>
                        
                        <span>•</span>
                        
                        <span>
                          {new Date(contribution.created_at).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      
                      {contribution.tags && (
                        <div className="flex gap-2">
                          {contribution.tags.map((tag: string) => (
                            <span key={tag} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 