import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useStore } from '../../../lib/store';
import { supabase } from '../../../lib/supabase';
import ParticipantVoting from '../../../components/ParticipantVoting';

export default function SessionVotingPage() {
  const router = useRouter();
  const { id: sessionId } = router.query;
  const { user, profile } = useStore();
  
  const [session, setSession] = useState(null);
  const [voteSettings, setVoteSettings] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [votedFor, setVotedFor] = useState([]);
  const [remainingVotes, setRemainingVotes] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Charger les informations de la session
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
          router.push(`/sessions/${sessionId}`);
          return;
        }
        
        setSession(sessionData);
        
        // Charger les paramètres de vote
        const { data: voteSettingsData, error: voteSettingsError } = await supabase
          .from('vote_settings')
          .select('*')
          .eq('session_id', sessionId)
          .single();
          
        if (voteSettingsError && voteSettingsError.code !== 'PGRST116') {
          // PGRST116 est "no rows returned" - ce qui est acceptable
          throw voteSettingsError;
        }
        
        const settings = voteSettingsData || {
          max_votes_per_participant: 3,
          require_reason: false,
          voting_duration: 1200,
          top_voted_count: 3
        };
        
        setVoteSettings(settings);
        
        // Charger les informations du participant
        const { data: participantData, error: participantError } = await supabase
          .from('session_participants')
          .select('*')
          .eq('session_id', sessionId)
          .eq('user_id', user.id)
          .single();
          
        if (participantError) throw participantError;
        if (!participantData) {
          // Rediriger vers la page de rejoindre la session si l'utilisateur n'est pas encore participant
          router.push(`/sessions/${sessionId}/join`);
          return;
        }
        
        setParticipant(participantData);
        
        // Charger les votes déjà effectués
        const { data: votesData, error: votesError } = await supabase
          .from('participant_votes')
          .select('voted_for_id, reason')
          .eq('session_id', sessionId)
          .eq('voter_id', participantData.id);
          
        if (votesError) throw votesError;
        
        setVotedFor(votesData || []);
        setRemainingVotes(settings.max_votes_per_participant - (votesData?.length || 0));
        
        // Calculer le temps restant si la session a une date de démarrage
        if (sessionData.started_at) {
          const startTime = new Date(sessionData.started_at);
          const endTime = new Date(startTime.getTime() + settings.voting_duration * 1000);
          const now = new Date();
          
          if (now < endTime) {
            setTimeRemaining(Math.floor((endTime - now) / 1000));
          } else {
            setTimeRemaining(0);
          }
        }
      } catch (err) {
        console.error('Error loading session data:', err);
        setError('Impossible de charger les données de la session. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    }
    
    loadSessionData();
  }, [sessionId, user, router]);
  
  // Mettre à jour le timer
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Rediriger vers la page de résultats lorsque le temps est écoulé
          setTimeout(() => router.push(`/sessions/${sessionId}/results`), 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeRemaining, sessionId, router]);
  
  // Gestion de la soumission d'un vote
  const handleVoteSubmit = async (votedForId, reason) => {
    if (!participant || !sessionId || remainingVotes <= 0) return;
    
    try {
      // Vérifier si l'utilisateur n'a pas déjà voté pour ce participant
      if (votedFor.some(v => v.voted_for_id === votedForId)) {
        return;
      }
      
      // Enregistrer le vote
      const { error } = await supabase.from('participant_votes').insert({
        session_id: sessionId,
        voter_id: participant.id,
        voted_for_id: votedForId,
        reason: reason || null
      });
      
      if (error) throw error;
      
      // Mettre à jour l'interface
      const newVote = { voted_for_id: votedForId, reason };
      setVotedFor(prev => [...prev, newVote]);
      setRemainingVotes(prev => prev - 1);
      
      // Afficher un message de succès
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error('Error submitting vote:', err);
      setError('Impossible de soumettre votre vote. Veuillez réessayer.');
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="text-center p-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-6 text-lg">Chargement de la session de vote...</p>
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
  
  if (!session || !voteSettings || !participant) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Session non trouvée</h2>
          <p>Impossible de trouver les informations de la session ou vous n'êtes pas inscrit comme participant.</p>
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
    <div className="container mx-auto max-w-4xl px-4 py-8 min-h-screen">
      {/* Message de succès */}
      {showSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg z-50 animate-fadeIn">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Vote enregistré avec succès!</span>
          </div>
        </div>
      )}
      
      {/* En-tête de la session */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold font-bricolage">{session.name}</h1>
            <p className="text-gray-600">{session.institution}</p>
          </div>
          
          {timeRemaining === 0 && (
            <div className="text-lg font-medium text-red-600 animate-pulse">
              Phase de vote terminée
            </div>
          )}
        </div>
      </div>
      
      {/* Instructions de vote */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-blue-800 mb-2">Phase de vote en cours</h2>
        <p className="text-blue-700 mb-4">
          Votez pour les participants que vous trouvez les plus intéressants ou pertinents.
          {voteSettings.max_votes_per_participant > 1 
            ? ` Vous pouvez voter pour jusqu'à ${voteSettings.max_votes_per_participant} personnes différentes.`
            : ' Vous ne pouvez voter que pour une seule personne.'}
        </p>
        <div className="text-sm text-blue-600">
          <p>À la fin du temps imparti, les {voteSettings.top_voted_count} participants les plus votés pourront interagir avec l'IA "nuggets".</p>
        </div>
      </div>
      
      {/* Composant de vote */}
      <ParticipantVoting
        sessionId={sessionId}
        participantId={participant.id}
        votedFor={votedFor.map(v => v.voted_for_id)}
        voteSettings={voteSettings}
        onVoteSubmit={handleVoteSubmit}
        remainingVotes={remainingVotes}
        remainingTime={timeRemaining}
      />
      
      {/* Pied de page avec navigation */}
      <div className="mt-12 border-t pt-6 text-center">
        <Link href={`/sessions/${sessionId}`} className="text-blue-600 hover:underline">
          Retour à la vue d'ensemble de la session
        </Link>
      </div>
    </div>
  );
} 