import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import ParticipantCard from './ParticipantCard';

const ParticipantVoting = ({ 
  sessionId, 
  participantId, 
  votedFor = [], 
  voteSettings,
  onVoteSubmit,
  remainingVotes
}) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [voteReasons, setVoteReasons] = useState({});
  const [remainingTime, setRemainingTime] = useState(null);

  // Chargement des participants disponibles pour voter
  useEffect(() => {
    async function loadParticipants() {
      setLoading(true);
      try {
        // On exclut le participant actuel de la liste
        const { data, error } = await supabase
          .from('session_participants')
          .select(`
            id, 
            display_name, 
            anonymous_id, 
            profile_image_url,
            selected_emoji,
            profile_color,
            joined_at
          `)
          .eq('session_id', sessionId)
          .neq('id', participantId)
          .order('joined_at', { ascending: true });

        if (error) throw error;
        setParticipants(data || []);
      } catch (err) {
        console.error('Error loading participants:', err);
        setError('Impossible de charger les participants. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    }

    if (sessionId && participantId) {
      loadParticipants();
    }
  }, [sessionId, participantId]);

  // Permet de soumettre un vote pour un participant
  const handleVote = async (votedParticipantId) => {
    if (!onVoteSubmit) return;
    
    try {
      const reason = voteSettings?.require_reason ? voteReasons[votedParticipantId] || '' : null;
      await onVoteSubmit(votedParticipantId, reason);
      
      // Réinitialiser la raison après vote
      if (voteSettings?.require_reason) {
        setVoteReasons(prev => {
          const newReasons = {...prev};
          delete newReasons[votedParticipantId];
          return newReasons;
        });
      }
    } catch (err) {
      console.error('Error submitting vote:', err);
      setError('Impossible de soumettre votre vote. Veuillez réessayer.');
    }
  };

  // Vérifier si l'utilisateur a déjà voté pour un participant
  const hasVotedFor = (participantId) => {
    return votedFor.includes(participantId);
  };

  // Gérer le changement de raison
  const handleReasonChange = (participantId, reason) => {
    setVoteReasons(prev => ({
      ...prev,
      [participantId]: reason
    }));
  };

  // Formater le temps restant
  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4">Chargement des participants...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
        <button 
          className="mt-2 text-sm underline"
          onClick={() => window.location.reload()}
        >
          Rafraîchir la page
        </button>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-600">Aucun autre participant n'a rejoint cette session pour l'instant.</p>
        <p className="mt-2 text-sm text-gray-500">Attendez que d'autres participants rejoignent la session pour pouvoir voter.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec info sur les votes restants et timer */}
      <div className="flex justify-between items-center">
        <div className="bg-blue-50 px-4 py-2 rounded-md">
          <span className="font-medium text-blue-800">
            Votes restants: <b>{remainingVotes}</b> / {voteSettings?.max_votes_per_participant || 3}
          </span>
        </div>
        
        {remainingTime !== null && (
          <div className="bg-gray-100 px-4 py-2 rounded-md">
            <span className="font-medium">
              Temps restant: <b>{formatTime(remainingTime)}</b>
            </span>
          </div>
        )}
      </div>

      {/* Liste des participants avec le nouveau composant ParticipantCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {participants.map((participant) => {
          const hasVoted = hasVotedFor(participant.id);
          
          return (
            <div 
              key={participant.id} 
              className={`border rounded-lg transition-all ${
                hasVoted 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <ParticipantCard 
                    name={participant.display_name}
                    anonymousId={participant.anonymous_id}
                    profileImage={participant.profile_image_url}
                    emoji={participant.selected_emoji}
                    color={participant.profile_color || '#3B82F6'}
                    isSelected={hasVoted}
                  />
                  
                  <div>
                    {hasVoted ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Voté
                      </span>
                    ) : (
                      remainingVotes > 0 && (
                        <button 
                          onClick={() => handleVote(participant.id)}
                          disabled={remainingVotes <= 0}
                          className="cm-button-outlined"
                        >
                          Voter
                        </button>
                      )
                    )}
                  </div>
                </div>
                
                {/* Zone de raison (uniquement si nécessaire et si pas encore voté) */}
                {voteSettings?.require_reason && !hasVoted && remainingVotes > 0 && (
                  <div className="mt-3">
                    <textarea
                      placeholder="Pourquoi voulez-vous voter pour cette personne? (obligatoire)"
                      value={voteReasons[participant.id] || ''}
                      onChange={(e) => handleReasonChange(participant.id, e.target.value)}
                      className="cm-input w-full"
                      rows={2}
                    />
                    <div className="flex justify-end mt-2">
                      <button 
                        onClick={() => handleVote(participant.id)}
                        disabled={!voteReasons[participant.id]?.trim()}
                        className={`cm-button ${!voteReasons[participant.id]?.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Confirmer mon vote
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Afficher la raison si déjà voté */}
                {hasVoted && votedFor.find(v => v === participant.id)?.reason && (
                  <div className="mt-3">
                    <div className="text-sm text-gray-600 italic">
                      <p>Votre raison: {votedFor.find(v => v === participant.id)?.reason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {remainingVotes === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          <p className="font-medium">Vous avez utilisé tous vos votes disponibles.</p>
          <p className="text-sm mt-1">Attendez la fin de la phase de vote pour voir les résultats.</p>
        </div>
      )}
    </div>
  );
};

export default ParticipantVoting; 