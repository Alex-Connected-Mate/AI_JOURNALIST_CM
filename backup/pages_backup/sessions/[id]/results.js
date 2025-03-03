import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useStore } from '../../../lib/store';
import { supabase } from '../../../lib/supabase';

export default function VoteResultsPage() {
  const router = useRouter();
  const { id: sessionId } = router.query;
  const { user, profile } = useStore();
  
  const [session, setSession] = useState(null);
  const [voteSettings, setVoteSettings] = useState(null);
  const [voteResults, setVoteResults] = useState([]);
  const [topVoted, setTopVoted] = useState([]);
  const [yourVotes, setYourVotes] = useState([]);
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHost, setIsHost] = useState(false);
  
  // Charger les données de la session et les résultats des votes
  useEffect(() => {
    async function loadResultsData() {
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
        setIsHost(sessionData.user_id === user.id);
        
        // Vérifier si la session a dépassé la phase de vote
        if (sessionData.status !== 'active' && sessionData.status !== 'ended') {
          router.push(`/sessions/${sessionId}`);
          return;
        }
        
        // Charger les paramètres de vote
        const { data: voteSettingsData, error: voteSettingsError } = await supabase
          .from('vote_settings')
          .select('*')
          .eq('session_id', sessionId)
          .single();
          
        if (voteSettingsError && voteSettingsError.code !== 'PGRST116') {
          throw voteSettingsError;
        }
        
        const settings = voteSettingsData || {
          max_votes_per_participant: 3,
          require_reason: false,
          voting_duration: 1200,
          top_voted_count: 3
        };
        
        setVoteSettings(settings);
        
        // Charger les informations du participant connecté
        const { data: participantData, error: participantError } = await supabase
          .from('session_participants')
          .select('*')
          .eq('session_id', sessionId)
          .eq('user_id', user.id)
          .single();
          
        if (participantError && participantError.code !== 'PGRST116') {
          throw participantError;
        }
        
        if (participantData) {
          setParticipant(participantData);
          
          // Charger les votes que l'utilisateur a effectués
          const { data: userVotesData, error: userVotesError } = await supabase
            .from('participant_votes')
            .select(`
              voted_for_id,
              reason,
              session_participants:voted_for_id (
                id,
                display_name,
                anonymous_id,
                profile_image_url,
                selected_emoji,
                profile_color
              )
            `)
            .eq('session_id', sessionId)
            .eq('voter_id', participantData.id);
            
          if (userVotesError) throw userVotesError;
          setYourVotes(userVotesData || []);
        }
        
        // Charger les résultats des votes
        const { data: votesResultsData, error: votesResultsError } = await supabase
          .from('vote_results')
          .select(`
            participant_id,
            vote_count,
            session_participants:participant_id (
              id,
              display_name,
              anonymous_id,
              profile_image_url,
              selected_emoji,
              profile_color
            )
          `)
          .eq('session_id', sessionId)
          .order('vote_count', { ascending: false });
          
        if (votesResultsError) throw votesResultsError;
        
        setVoteResults(votesResultsData || []);
        
        // Identifier les participants les plus votés
        const topCount = settings.top_voted_count || 3;
        setTopVoted(votesResultsData?.slice(0, topCount) || []);
        
      } catch (err) {
        console.error('Error loading vote results:', err);
        setError('Impossible de charger les résultats des votes. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    }
    
    loadResultsData();
  }, [sessionId, user, router]);
  
  // Démarrer la phase de discussion AI
  const handleStartAIDiscussion = async () => {
    if (!session || !isHost) return;
    
    try {
      // Mettre à jour le statut de la session
      const { error } = await supabase
        .from('sessions')
        .update({ 
          status: 'ai_discussion',
          ai_discussion_started_at: new Date().toISOString()
        })
        .eq('id', sessionId);
        
      if (error) throw error;
      
      // Rediriger vers la page de discussion AI
      router.push(`/sessions/${sessionId}/ai-discussion`);
    } catch (err) {
      console.error('Error starting AI discussion:', err);
      setError('Impossible de démarrer la phase de discussion AI. Veuillez réessayer.');
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center p-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-6 text-lg">Chargement des résultats de vote...</p>
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

  // Format d'affichage pour un participant
  const renderParticipantCard = (participant, voteCount = null, rank = null) => {
    if (!participant || !participant.session_participants) return null;
    
    const profile = participant.session_participants;
    const displayName = profile.anonymous_id || profile.display_name || 'Participant';
    
    return (
      <div key={profile.id} className="border rounded-lg p-4 flex items-center">
        {rank && (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 text-blue-800 font-bold">
            {rank}
          </div>
        )}
        
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl mr-4" 
          style={{ backgroundColor: profile.profile_color || '#3B82F6' }}
        >
          {profile.selected_emoji || profile.display_name?.charAt(0) || '?'}
        </div>
        
        <div className="flex-grow">
          <h3 className="font-medium">{displayName}</h3>
          {voteCount !== null && (
            <p className="text-sm text-gray-500">
              {voteCount} vote{voteCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        
        {rank <= (voteSettings?.top_voted_count || 3) && (
          <div className="ml-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              Nugget
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 min-h-screen">
      {/* En-tête de la session */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold font-bricolage">{session.name}</h1>
            <p className="text-gray-600">{session.institution}</p>
          </div>
          
          <div className="text-lg font-medium text-blue-600">
            Résultats des votes
          </div>
        </div>
      </div>
      
      {/* Résumé des votes */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-blue-800 mb-4">Phase de vote terminée</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {voteResults.length > 0 ? voteResults[0].vote_count : 0}
            </div>
            <div className="text-sm text-gray-600">Votes reçus par le participant le plus populaire</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {voteResults.reduce((sum, result) => sum + result.vote_count, 0)}
            </div>
            <div className="text-sm text-gray-600">Nombre total de votes</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {voteSettings?.top_voted_count || 3}
            </div>
            <div className="text-sm text-gray-600">Participants "Nuggets" sélectionnés</div>
          </div>
        </div>
        
        <div className="text-blue-700">
          <p>Les participants sélectionnés comme "Nuggets" pourront interagir avec l'IA spéciale lors de la prochaine phase.</p>
          {!isHost && participant && (
            <p className="mt-2">
              {topVoted.some(tv => tv.participant_id === participant.id) 
                ? <span className="font-medium">Félicitations ! Vous avez été sélectionné comme Nugget.</span>
                : <span>Vous n'avez pas été sélectionné comme Nugget, mais vous pourrez interagir avec l'IA "Light Bulbs" lors de la prochaine phase.</span>
              }
            </p>
          )}
        </div>
      </div>
      
      {/* Participants les plus votés */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Participants les plus votés</h2>
        
        {voteResults.length === 0 ? (
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Aucun vote n'a été enregistré pour cette session.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {voteResults.map((result, index) => (
              renderParticipantCard(result, result.vote_count, index + 1)
            ))}
          </div>
        )}
      </div>
      
      {/* Vos votes (si l'utilisateur est un participant) */}
      {participant && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Vos votes</h2>
          
          {yourVotes.length === 0 ? (
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <p className="text-gray-600">Vous n'avez voté pour aucun participant.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {yourVotes.map((vote) => (
                <div key={vote.voted_for_id} className="border rounded-lg p-4">
                  {renderParticipantCard({ session_participants: vote.session_participants })}
                  
                  {vote.reason && (
                    <div className="mt-3 ml-16 text-sm text-gray-600 italic">
                      <p>Votre raison: {vote.reason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Actions (seulement pour l'hôte) */}
      {isHost && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions du professeur</h2>
          
          <p className="text-gray-600 mb-4">
            Vous pouvez maintenant démarrer la phase de discussion avec l'IA, où les participants sélectionnés pourront interagir avec l'IA "Nuggets" et les autres avec l'IA "Light Bulbs".
          </p>
          
          <button 
            onClick={handleStartAIDiscussion} 
            className="cm-button w-full md:w-auto"
          >
            Démarrer la phase de discussion IA
          </button>
        </div>
      )}
      
      {/* Navigation */}
      <div className="mt-12 border-t pt-6 text-center">
        <Link href={`/sessions/${sessionId}`} className="text-blue-600 hover:underline">
          Retour à la vue d'ensemble de la session
        </Link>
      </div>
    </div>
  );
} 