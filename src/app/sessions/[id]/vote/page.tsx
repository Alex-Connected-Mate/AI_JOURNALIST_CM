'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

interface VotePageProps {
  params: {
    id: string;
  };
}

export default function SessionVotePage({ params }: VotePageProps) {
  const sessionId = params.id;
  const router = useRouter();
  const { user } = useStore();
  
  const [session, setSession] = useState<any>(null);
  const [voteSettings, setVoteSettings] = useState<any>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  const [userVotes, setUserVotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voteReason, setVoteReason] = useState('');
  const [showVoteReasonModal, setShowVoteReasonModal] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
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
        
        // Vérifier si la session est active
        if (sessionData.status !== 'active') {
          if (sessionData.status === 'ended') {
            router.push(`/sessions/${sessionId}/results`);
            return;
          } else {
            router.push(`/sessions/${sessionId}`);
            return;
          }
        }
        
        setSession(sessionData);
        
        // Charger les paramètres de vote
        const { data: voteSettingsData, error: voteSettingsError } = await supabase
          .from('vote_settings')
          .select('*')
          .eq('session_id', sessionId)
          .single();
          
        if (voteSettingsError && voteSettingsError.code !== 'PGRST116') {
          throw voteSettingsError;
        }
        
        setVoteSettings(voteSettingsData || {
          max_votes_per_participant: 3,
          require_reason: false,
          voting_duration: 1200,
          top_voted_count: 3
        });
        
        // Charger les contributions
        const { data: contributionsData, error: contributionsError } = await supabase
          .from('contributions')
          .select(`
            *,
            votes:contribution_votes(*)
          `)
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });
          
        if (contributionsError) throw contributionsError;
        setContributions(contributionsData || []);
        
        // Charger les votes de l'utilisateur
        const { data: userVotesData, error: userVotesError } = await supabase
          .from('contribution_votes')
          .select('contribution_id')
          .eq('session_id', sessionId)
          .eq('user_id', user.id);
          
        if (userVotesError) throw userVotesError;
        setUserVotes(userVotesData?.map(vote => vote.contribution_id) || []);
        
      } catch (err: any) {
        console.error('Error loading session data:', err);
        setError('Impossible de charger les données de la session. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    }
    
    loadSessionData();
  }, [sessionId, user, router]);
  
  // Gérer le vote pour une contribution
  const handleVote = async (contributionId: string) => {
    if (!user || !session) return;
    
    // Vérifier si l'utilisateur a déjà voté pour cette contribution
    if (userVotes.includes(contributionId)) {
      // Annuler le vote
      try {
        const { error } = await supabase
          .from('contribution_votes')
          .delete()
          .eq('contribution_id', contributionId)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        // Mettre à jour l'état local
        setUserVotes(userVotes.filter(id => id !== contributionId));
        setSuccessMessage('Vote retiré avec succès');
        setTimeout(() => setSuccessMessage(null), 3000);
        
      } catch (err: any) {
        console.error('Error removing vote:', err);
        setError('Impossible de retirer votre vote. Veuillez réessayer.');
      }
      
      return;
    }
    
    // Vérifier si l'utilisateur a atteint le nombre maximum de votes
    if (userVotes.length >= (voteSettings?.max_votes_per_participant || 3)) {
      setError(`Vous avez atteint le nombre maximum de votes (${voteSettings?.max_votes_per_participant || 3})`);
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    // Si une raison est requise, afficher le modal
    if (voteSettings?.require_reason) {
      setSelectedContribution(contributionId);
      setVoteReason('');
      setShowVoteReasonModal(true);
      return;
    }
    
    // Sinon, voter directement
    await submitVote(contributionId);
  };
  
  // Soumettre le vote avec ou sans raison
  const submitVote = async (contributionId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('contribution_votes')
        .insert({
          session_id: sessionId,
          contribution_id: contributionId,
          user_id: user?.id,
          reason: reason || null
        });
        
      if (error) throw error;
      
      // Mettre à jour l'état local
      setUserVotes([...userVotes, contributionId]);
      setSuccessMessage('Vote enregistré avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Fermer le modal si ouvert
      setShowVoteReasonModal(false);
      
    } catch (err: any) {
      console.error('Error submitting vote:', err);
      setError('Impossible d\'enregistrer votre vote. Veuillez réessayer.');
    }
  };
  
  // Soumettre le vote avec raison depuis le modal
  const handleSubmitVoteWithReason = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedContribution) return;
    
    if (!voteReason.trim() && voteSettings?.require_reason) {
      setError('Veuillez fournir une raison pour votre vote');
      return;
    }
    
    submitVote(selectedContribution, voteReason);
  };
  
  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center p-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-6 text-lg">Chargement de la session...</p>
        </div>
      </div>
    );
  }
  
  if (error && !successMessage) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Erreur</h2>
          <p>{error}</p>
          <div className="mt-6">
            <Link href={`/sessions/${sessionId}`} className="cm-button">
              Retour à la session
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
      
      {/* En-tête de la page */}
      <div className="bento-card mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-bricolage">Phase de vote</h1>
          <p className="text-gray-600 mt-1">{session.name}</p>
        </div>
        
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-500 mt-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-blue-800">Instructions</h3>
              <p className="text-blue-700 text-sm mt-1">
                Vous pouvez voter pour {voteSettings?.max_votes_per_participant || 3} contributions maximum.
                {voteSettings?.require_reason && " Vous devez fournir une raison pour chaque vote."}
              </p>
              <p className="text-blue-700 text-sm mt-2">
                Votes utilisés: <span className="font-semibold">{userVotes.length} / {voteSettings?.max_votes_per_participant || 3}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Message de succès */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6 fade-in flex justify-between items-center">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-700 hover:text-green-800">
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Liste des contributions */}
      <div className="bento-card">
        <h2 className="text-xl font-semibold mb-4">Contributions ({contributions.length})</h2>
        
        {contributions.length === 0 ? (
          <p className="text-gray-600">
            Aucune contribution n'a été faite durant cette session.
          </p>
        ) : (
          <div className="space-y-4">
            {contributions.map((contribution) => {
              const hasVoted = userVotes.includes(contribution.id);
              const voteCount = contribution.votes?.length || 0;
              
              return (
                <div 
                  key={contribution.id} 
                  className={`p-4 rounded-lg border ${
                    hasVoted ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-gray-900">{contribution.content}</p>
                      
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
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
                    
                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                      <button
                        onClick={() => handleVote(contribution.id)}
                        className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                          hasVoted 
                            ? 'text-blue-700 hover:text-blue-800' 
                            : 'text-gray-500 hover:text-blue-600'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                        </svg>
                        <span className="text-sm font-medium mt-1">
                          {hasVoted ? 'Voté' : 'Voter'}
                        </span>
                      </button>
                      
                      {voteSettings?.show_votes_real_time && (
                        <div className="text-sm font-semibold">
                          {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Modal pour la raison du vote */}
      {showVoteReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Pourquoi votez-vous pour cette contribution ?</h3>
            
            <form onSubmit={handleSubmitVoteWithReason}>
              <textarea
                value={voteReason}
                onChange={(e) => setVoteReason(e.target.value)}
                placeholder="Expliquez pourquoi vous trouvez cette contribution pertinente..."
                className="cm-input min-h-[100px] mb-4"
                required={voteSettings?.require_reason}
              />
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {error}
                </div>
              )}
              
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowVoteReasonModal(false);
                    setError(null);
                  }}
                  className="cm-button-secondary"
                >
                  Annuler
                </button>
                
                <button
                  type="submit"
                  className="cm-button"
                >
                  Confirmer le vote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 