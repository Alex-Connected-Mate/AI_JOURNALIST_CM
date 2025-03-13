'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import DotPattern from '@/components/ui/DotPattern';
import QRCode from '@/components/QRCode';
import { motion, AnimatePresence } from 'framer-motion';

// Constantes pour les phases de la session
const PHASES = {
  JOIN: 'join',              // Participants rejoignent
  INSTRUCTIONS: 'instructions', // Instructions avant discussion
  DISCUSSION: 'discussion',   // Les participants discutent
  VOTING: 'voting',          // Phase de vote
  INTERACTION: 'interaction', // Interaction avec l'IA
  ANALYSIS: 'analysis',      // Analyse des résultats
  CONCLUSION: 'conclusion'   // Conclusion
};

export default function SessionRunPage({ params }) {
  const sessionId = params.id;
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [currentPhase, setCurrentPhase] = useState(PHASES.JOIN);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [shareUrl, setShareUrl] = useState('');
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(0);
  const [topParticipants, setTopParticipants] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [playSoundEnabled, setPlaySoundEnabled] = useState(true);
  const audioRef = useRef(null);
  
  // Référence au canal de broadcast Supabase
  const phaseChannelRef = useRef(null);
  
  // Référence pour les nouveaux participants avec animation
  const [newParticipantIds, setNewParticipantIds] = useState([]);
  
  // Traitement du son à la fin du chronomètre
  const playTimerEndSound = () => {
    if (playSoundEnabled && audioRef.current) {
      audioRef.current.play().catch(err => console.error('Erreur lors de la lecture du son:', err));
    }
  };

  // Chargement des données de la session
  useEffect(() => {
    async function loadSessionData() {
      try {
        // Charger les informations de base de la session
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single();
          
        if (sessionError) {
          if (sessionError.code === '42P01') {
            console.error("La table 'sessions' n'existe pas dans la base de données:", sessionError);
            setError("La table 'sessions' n'existe pas dans la base de données. Veuillez suivre les instructions dans DATABASE_SETUP.md pour configurer la base de données.");
            setLoading(false);
            return;
          }
          throw sessionError;
        }
        
        setSession(sessionData);
        
        // Définir la durée du timer à partir des réglages
        if (sessionData.voting_duration) {
          setTimerDuration(sessionData.voting_duration);
        } else {
          // Valeur par défaut (5 minutes)
          setTimerDuration(5 * 60);
        }

        try {
          // Charger les participants
          const { data: participantsData, error: participantsError } = await supabase
            .from('participants')
            .select('*')
            .eq('session_id', sessionId);
            
          if (participantsError) {
            if (participantsError.code === '42P01') {
              console.error("La table 'participants' n'existe pas dans la base de données:", participantsError);
              // Afficher un message mais continuer le flux
              setError("La table 'participants' n'existe pas dans la base de données. Certaines fonctionnalités seront limitées. Veuillez suivre les instructions dans DATABASE_SETUP.md pour configurer correctement la base de données.");
              setParticipants([]);
            } else {
              throw participantsError;
            }
          } else {
            setParticipants(participantsData || []);
          }
        } catch (participantsErr) {
          console.error("Erreur lors du chargement des participants:", participantsErr);
          // Continuer le flux sans planter l'application
          setParticipants([]);
        }

        // Générer l'URL de partage
        if (typeof window !== 'undefined') {
          // Utiliser session_code, code ou access_code selon ce qui est disponible
          const sessionCode = sessionData?.session_code || sessionData?.code || sessionData?.access_code;
          if (sessionCode) {
            const baseUrl = window.location.origin;
            setShareUrl(`${baseUrl}/join?code=${sessionCode}`);
          } else {
            console.error("Aucun code de session trouvé dans les données de session:", sessionData);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading session data:', err);
        setError(err.message || 'Impossible de charger les données de la session');
        setLoading(false);
      }
    }
    
    loadSessionData();
    
    // Configurer une mise à jour en temps réel des participants
    const participantsSubscription = supabase
      .channel(`session_${sessionId}_participants`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'participants',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        // Mettre à jour la liste des participants
        if (payload.eventType === 'INSERT') {
          setParticipants(prev => [...prev, payload.new]);
          // Ajouter à la liste des nouveaux pour l'animation
          setNewParticipantIds(prev => [...prev, payload.new.id]);
          // Après 2 secondes, supprimer de la liste des nouveaux
          setTimeout(() => {
            setNewParticipantIds(prev => prev.filter(id => id !== payload.new.id));
          }, 2000);
        } else if (payload.eventType === 'DELETE') {
          setParticipants(prev => prev.filter(p => p.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setParticipants(prev => 
            prev.map(p => p.id === payload.new.id ? payload.new : p)
          );
        }
      })
      .subscribe();
    
    // Initialiser le canal de broadcast pour les changements de phase
    phaseChannelRef.current = supabase
      .channel(`session_${sessionId}_phase`)
      .subscribe();
      
    return () => {
      supabase.removeChannel(participantsSubscription);
      if (phaseChannelRef.current) {
        supabase.removeChannel(phaseChannelRef.current);
      }
    };
  }, [sessionId]);
  
  // Gestionnaire du timer
  useEffect(() => {
    let interval = null;
    
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
    } else if (timerActive && timer === 0) {
      setTimerActive(false);
      
      // Jouer un son à la fin du compteur
      playTimerEndSound();
      
      // Logique de fin de phase selon la phase actuelle
      if (currentPhase === PHASES.DISCUSSION) {
        // Passer à la phase de vote après la discussion
        setCurrentPhase(PHASES.VOTING);
        broadcastPhaseChange(PHASES.VOTING);
      } else if (currentPhase === PHASES.VOTING) {
        // Passer à la phase d'interaction après le vote
        handleVotingComplete();
      } else if (currentPhase === PHASES.INTERACTION) {
        // Passer à la phase d'analyse après l'interaction
        setCurrentPhase(PHASES.ANALYSIS);
        broadcastPhaseChange(PHASES.ANALYSIS, { analyses: generateMockAnalyses() });
      }
    }
    
    return () => clearInterval(interval);
  }, [timerActive, timer, currentPhase]);
  
  // Fonction pour diffuser les changements de phase à tous les participants
  const broadcastPhaseChange = (phase, additionalData = {}) => {
    if (!phaseChannelRef.current) return;
    
    // Préparer les données à diffuser
    const payload = {
      phase: phase,
      ...additionalData
    };
    
    // Ajouter des informations sur le timer si nécessaire
    if (phase === PHASES.DISCUSSION || phase === PHASES.VOTING || phase === PHASES.INTERACTION) {
      payload.timer = timer;
    }
    
    // Diffuser le changement de phase
    phaseChannelRef.current.send({
      type: 'broadcast',
      event: 'phase_change',
      payload: payload
    }).then(
      () => console.log(`Phase diffusée: ${phase}`),
      (error) => console.error('Erreur lors de la diffusion de la phase:', error)
    );
  };
  
  // Générer des analyses simulées pour la démo
  const generateMockAnalyses = () => {
    return topParticipants.map(participant => ({
      participant: participant.display_name,
      participant_id: participant.id,
      content: `Analyse des idées de ${participant.display_name} sur ${session?.topic || 'le sujet de la session'}. Points clés abordés: vision unique, approche innovante et perspectives d'avenir.`,
      tags: ['Idée principale', 'Innovation', 'Perspective']
    }));
  };
  
  // Gestion des votes complets
  const handleVotingComplete = async () => {
    try {
      // Récupérer les participants avec le plus de votes
      const { data, error } = await supabase
        .from('participants')
        .select('id, display_name, votes')
        .eq('session_id', sessionId)
        .order('votes', { ascending: false })
        .limit(5);
        
      if (error) {
        if (error.code === '42P01') {
          console.error("La table 'participants' n'existe pas dans la base de données. Utilisation de données simulées pour la démo.");
          // Utiliser des données simulées pour la démo
          const mockParticipants = [
            { id: '1', display_name: 'Participant Demo 1', votes: 5 },
            { id: '2', display_name: 'Participant Demo 2', votes: 3 },
            { id: '3', display_name: 'Participant Demo 3', votes: 2 }
          ];
          setTopParticipants(mockParticipants);
        } else {
          throw error;
        }
      } else {
        const selectedParticipants = data || [];
        setTopParticipants(selectedParticipants);
      }
      
      setCurrentPhase(PHASES.INTERACTION);
      
      // Diffuser la liste des participants sélectionnés
      broadcastPhaseChange(PHASES.INTERACTION, { 
        selected_participants: topParticipants.map(p => p.id)
      });
    } catch (err) {
      console.error('Erreur lors de la récupération des participants avec le plus de votes:', err);
      // Continuer avec une liste vide en cas d'erreur
      setTopParticipants([]);
      setCurrentPhase(PHASES.INTERACTION);
      broadcastPhaseChange(PHASES.INTERACTION, { selected_participants: [] });
    }
  };
  
  // Observer les changements de phase pour les diffuser
  useEffect(() => {
    // Si la phase change et que ce n'est pas dû à un timer qui se termine
    if (currentPhase && !timerActive) {
      // Diffuser le changement de phase
      if (currentPhase === PHASES.INSTRUCTIONS) {
        broadcastPhaseChange(PHASES.INSTRUCTIONS);
      } else if (currentPhase === PHASES.CONCLUSION) {
        broadcastPhaseChange(PHASES.CONCLUSION);
      }
      // Les autres phases sont diffusées avec leurs données spécifiques dans leurs fonctions respectives
    }
  }, [currentPhase]);
  
  // Commencer la discussion
  const startDiscussion = () => {
    setTimer(timerDuration);
    setTimerActive(true);
    setCurrentPhase(PHASES.DISCUSSION);
    broadcastPhaseChange(PHASES.DISCUSSION, { timer: timerDuration });
  };
  
  // Commencer le vote
  const startVoting = () => {
    // Durée de vote (vous pouvez la personnaliser selon vos besoins)
    const votingDuration = Math.min(timerDuration, 3 * 60); // Maximum 3 minutes ou la durée définie
    setTimer(votingDuration);
    setTimerActive(true);
    setCurrentPhase(PHASES.VOTING);
    broadcastPhaseChange(PHASES.VOTING, { timer: votingDuration });
  };
  
  // Commencer la phase d'interaction avec l'IA
  const startInteraction = () => {
    // Durée d'interaction (personnalisable)
    const interactionDuration = 5 * 60; // 5 minutes par défaut
    setTimer(interactionDuration);
    setTimerActive(true);
    
    // Cette diffusion est gérée dans handleVotingComplete
  };
  
  // Passer à la phase suivante manuellement
  const goToNextPhase = () => {
    setTimerActive(false); // Arrêter le timer actuel
    
    switch (currentPhase) {
      case PHASES.JOIN:
        setCurrentPhase(PHASES.INSTRUCTIONS);
        break;
      case PHASES.INSTRUCTIONS:
        startDiscussion();
        break;
      case PHASES.DISCUSSION:
        startVoting();
        break;
      case PHASES.VOTING:
        handleVotingComplete();
        break;
      case PHASES.INTERACTION:
        setCurrentPhase(PHASES.ANALYSIS);
        broadcastPhaseChange(PHASES.ANALYSIS, { analyses: generateMockAnalyses() });
        break;
      case PHASES.ANALYSIS:
        setCurrentPhase(PHASES.CONCLUSION);
        broadcastPhaseChange(PHASES.CONCLUSION);
        break;
      default:
        break;
    }
  };
  
  // Formater le temps restant
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
        <DotPattern className="absolute inset-0 z-0" />
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
          <p className="mt-6 text-xl text-gray-600">Chargement de la présentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden">
        <DotPattern className="absolute inset-0 z-0" />
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md relative z-10">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link 
            href={`/sessions/${sessionId}`}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
          >
            Retour à la session
          </Link>
        </div>
      </div>
    );
  }

  // Rendu du contenu de la phase actuelle
  const renderPhaseContent = () => {
    switch (currentPhase) {
      case PHASES.JOIN:
        return (
          <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md relative z-10 border border-gray-200">
            <div className="p-8 text-center">
              <motion.h2 
                className="text-3xl font-bold mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Rejoindre la session
              </motion.h2>
              
              <div className="flex flex-col lg:flex-row gap-8 items-center justify-center">
                {shareUrl ? (
                  <motion.div 
                    className="flex-shrink-0 bg-white p-4 border-3 border-gray-200 rounded-lg shadow-lg"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="mb-3 text-base font-medium">Scanner le QR code</div>
                    <QRCode 
                      value={shareUrl}
                      size={200}
                      fgColor="#000000"
                      bgColor="#ffffff"
                      level="H"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    className="flex-shrink-0 bg-white p-4 border-3 border-gray-200 rounded-lg shadow-lg flex items-center justify-center"
                    style={{ width: 200, height: 200 }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="text-gray-500 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
                      <p>Génération du QR code...</p>
                    </div>
                  </motion.div>
                )}
                
                <motion.div 
                  className="flex-1 max-w-md"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="text-left mb-6">
                    <p className="text-xl mb-2 font-medium">
                      Instructions pour rejoindre:
                    </p>
                    <ol className="list-decimal pl-6 text-base space-y-3 mb-4">
                      <li>Ouvrez votre navigateur</li>
                      <li>Allez sur <span className="font-bold">{shareUrl ? new URL(shareUrl).origin : window.location.origin}</span></li>
                      <li>Cliquez sur "Rejoindre une session"</li>
                      <li>Entrez le code ci-dessous</li>
                    </ol>
                  </div>
                  
                  <div className="text-left mb-6">
                    <p className="text-xl mb-2 font-medium">
                      Code de session:
                    </p>
                    <div className="bg-primary p-4 rounded-lg text-center border-2 border-primary shadow-md">
                      <p className="font-mono text-3xl font-bold tracking-wider text-white">
                        {session?.session_code || session?.code || session?.access_code || 'CODE'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-left">
                    <p className="text-xl mb-2 font-medium">
                      Participants connectés:
                    </p>
                    <div className="flex items-baseline">
                      <p className="text-3xl font-bold text-primary">
                        {participants.length}
                      </p>
                      <span className="text-gray-500 text-xl ml-2">/ {session?.max_participants || 30}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
            
            <motion.div 
              className="bg-gray-50 p-6 rounded-b-lg border-t"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h3 className="text-xl font-semibold mb-4">Participants</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                <AnimatePresence>
                  {participants.map(participant => (
                    <motion.div 
                      key={participant.id} 
                      className={`bg-white p-2 rounded-lg border-2 ${
                        newParticipantIds.includes(participant.id) ? 'border-primary' : 'border-gray-200'
                      }`}
                      initial={newParticipantIds.includes(participant.id) ? { scale: 0.8, opacity: 0 } : false}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-base ${
                          newParticipantIds.includes(participant.id) ? 'bg-primary' : 'bg-gray-500'
                        }`}>
                          {participant.display_name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <span className="truncate text-sm">{participant.display_name || 'Anonyme'}</span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {participants.length === 0 && (
                  <p className="text-gray-500 col-span-6 text-base text-center py-4">En attente de participants...</p>
                )}
              </div>
            </motion.div>
          </div>
        );
        
      case PHASES.INSTRUCTIONS:
        return (
          <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md relative z-10 border border-gray-200">
            <div className="p-8 text-center">
              <motion.h2 
                className="text-3xl font-bold mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Instructions
              </motion.h2>
              
              <motion.div 
                className="bg-blue-50 p-8 rounded-lg border-2 border-blue-100 mb-8"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.p 
                  className="text-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {session?.discussion_instructions || 
                   "Les participants vont maintenant discuter entre eux. Échangez vos idées sur le sujet proposé."}
                </motion.p>
              </motion.div>
              
              <motion.div 
                className="mt-8 flex justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="inline-block bg-white p-4 rounded-lg border-2 shadow-md">
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="text-center">
                      <p className="text-base text-gray-600 mb-1">Participants</p>
                      <p className="font-mono text-2xl font-semibold text-primary">{participants.length}</p>
                    </div>
                    
                    <div className="h-10 w-px bg-gray-300 hidden md:block"></div>
                    
                    <div className="text-center">
                      <p className="text-base text-gray-600 mb-1">Durée prévue</p>
                      <p className="font-mono text-2xl font-semibold text-primary">{formatTime(timerDuration)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        );
        
      case PHASES.DISCUSSION:
        return (
          <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md relative z-10 border border-gray-200">
            <div className="p-12 text-center">
              <motion.h2 
                className="text-4xl font-bold mb-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Phase de discussion
              </motion.h2>
              
              <motion.div 
                className="bg-blue-50 p-10 rounded-lg border-2 border-blue-100 mb-8"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.p 
                  className="text-2xl mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {session?.discussion_topic || 
                   "Les participants échangent leurs idées sur le sujet de la session."}
                </motion.p>
                
                {timerActive && (
                  <motion.div 
                    className="bg-white p-6 rounded-lg border-2 border-blue-200 mx-auto max-w-xs"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <p className="text-center text-5xl font-bold text-primary">{formatTime(timer)}</p>
                    <p className="text-center text-lg text-gray-600 mt-2">Temps restant</p>
                  </motion.div>
                )}
              </motion.div>
              
              <motion.div 
                className="bg-gray-50 p-8 rounded-lg border border-gray-200 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <h3 className="text-xl font-semibold mb-4">Instructions pour les participants</h3>
                <ul className="text-left space-y-3 text-lg">
                  <li>🗣️ <span className="font-medium">Discutez</span> ensemble du sujet proposé</li>
                  <li>🤝 <span className="font-medium">Échangez</span> des idées et perspectives différentes</li>
                  <li>📝 <span className="font-medium">Prenez note</span> des participants avec qui vous avez des échanges intéressants</li>
                  <li>⭐ Vous pourrez <span className="font-medium">voter</span> pour vos interlocuteurs favoris lors de la prochaine phase</li>
                </ul>
              </motion.div>
            </div>
          </div>
        );
        
      case PHASES.VOTING:
        return (
          <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md relative z-10 border border-gray-200">
            <div className="p-12 text-center">
              <motion.h2 
                className="text-4xl font-bold mb-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Phase de vote
              </motion.h2>
              
              <motion.div 
                className="bg-purple-50 p-10 rounded-lg border-2 border-purple-100 mb-8"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.p 
                  className="text-2xl mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  C'est le moment de voter pour les participants qui ont apporté les meilleures contributions !
                </motion.p>
                
                {timerActive && (
                  <motion.div 
                    className="bg-white p-6 rounded-lg border-2 border-purple-200 mx-auto max-w-xs"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <p className="text-center text-5xl font-bold text-primary">{formatTime(timer)}</p>
                    <p className="text-center text-lg text-gray-600 mt-2">Temps restant</p>
                  </motion.div>
                )}
              </motion.div>
              
              <motion.div 
                className="bg-gray-50 p-8 rounded-lg border border-gray-200 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <h3 className="text-xl font-semibold mb-4">Instructions pour les participants</h3>
                <ul className="text-left space-y-3 text-lg">
                  <li>✨ <span className="font-medium">Utilisez vos votes</span> pour les participants les plus pertinents</li>
                  <li>🔍 <span className="font-medium">Recherchez</span> les identifiants des participants que vous souhaitez soutenir</li>
                  <li>💡 <span className="font-medium">Pensez aux participants</span> qui ont partagé des idées originales ou utiles</li>
                  <li>⏱️ <span className="font-medium">Votez rapidement</span> avant la fin du décompte</li>
                </ul>
              </motion.div>
              
              <motion.div 
                className="mt-8 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <p className="text-gray-600">
                  Les participants les plus votés pourront interagir avec l'Intelligence Artificielle !
                </p>
              </motion.div>
            </div>
          </div>
        );
        
      case PHASES.INTERACTION:
        return (
          <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md relative z-10 border border-gray-200">
            <div className="p-12 text-center">
              <motion.h2 
                className="text-4xl font-bold mb-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Interaction avec l'IA
              </motion.h2>
              
              <motion.div 
                className="bg-blue-50 p-10 rounded-lg border-2 border-blue-100 mb-8"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.p 
                  className="text-2xl mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  Les participants sélectionnés peuvent maintenant interagir avec l'IA pour approfondir leurs idées.
                </motion.p>
                
                {timerActive && (
                  <motion.div 
                    className="bg-white p-6 rounded-lg border-2 border-blue-200 mx-auto max-w-xs"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <p className="text-center text-5xl font-bold text-primary">{formatTime(timer)}</p>
                    <p className="text-center text-lg text-gray-600 mt-2">Temps restant</p>
                  </motion.div>
                )}
              </motion.div>
              
              <motion.div 
                className="mt-8 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <h3 className="text-2xl font-semibold mb-6">Participants sélectionnés</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {topParticipants.map((participant, index) => (
                    <motion.div 
                      key={participant.id}
                      className="bg-white p-4 rounded-lg border-2 shadow-md"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + (index * 0.1) }}
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl mb-3">
                          {participant.display_name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <p className="text-xl font-semibold mb-1">{participant.display_name || 'Anonyme'}</p>
                        <p className="text-gray-500 text-sm mb-2">ID: {participant.id.substring(0, 8)}</p>
                        <div className="bg-primary/10 px-3 py-1 rounded-full text-primary font-medium">
                          {participant.votes || 0} votes
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {topParticipants.length === 0 && (
                    <p className="text-gray-500 col-span-3 text-center py-4">Aucun participant sélectionné</p>
                  )}
                </div>
              </motion.div>
              
              <motion.div 
                className="mt-10 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <p className="text-gray-600">
                  Les participants interagissent avec l'IA sur leurs appareils mobiles.
                </p>
              </motion.div>
            </div>
          </div>
        );
        
      case PHASES.ANALYSIS:
        return (
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md relative z-10 border border-gray-200">
            <div className="p-8">
              <h2 className="text-3xl font-bold text-center mb-6">Analyse des interactions</h2>
              
              <motion.div 
                className="bg-purple-50 p-6 rounded-lg border border-purple-100 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <p className="text-xl text-center mb-4">
                  Voici l'analyse des discussions avec l'AI journaliste.
                </p>
                
                <p className="text-center text-gray-600 mb-4">
                  Ces "books" résument les échanges et mettent en avant les idées principales.
                </p>
              </motion.div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {topParticipants.slice(0, 4).map((participant, index) => (
                  <motion.div 
                    key={participant.id} 
                    className="bg-white p-6 rounded-lg border shadow-md h-full"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.2, duration: 0.5 }}
                  >
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-primary mr-3">
                        {participant.display_name?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{participant.display_name || 'Anonyme'}</h3>
                        <p className="text-sm text-gray-600">ID: {participant.id.substring(0, 8)}</p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Résumé de l'échange</h4>
                      <p className="text-gray-600">
                        {/* Ici, vous pourriez afficher le vrai résumé d'analyse depuis votre backend */}
                        Analyse détaillée des idées échangées lors de la discussion avec l'IA journaliste.
                        Les points clés abordés incluent des réflexions sur {session?.topic || 'le sujet de la session'}.
                      </p>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Idée clé</span>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Innovation</span>
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Perspective</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              <div className="text-center">
                <button
                  onClick={() => {}} // Ajouter une action pour voir toutes les analyses
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Voir toutes les analyses
                </button>
              </div>
            </div>
          </div>
        );
        
      case PHASES.CONCLUSION:
        return (
          <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md relative z-10 border border-gray-200">
            <div className="p-12 text-center">
              <motion.h2 
                className="text-4xl font-bold mb-10"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Session terminée
              </motion.h2>
              
              <motion.div 
                className="bg-green-50 p-10 rounded-lg border-2 border-green-100 mb-10"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="bg-white rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6 shadow-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <motion.p 
                  className="text-2xl font-medium mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  Merci à tous les participants pour cette session !
                </motion.p>
                
                <motion.p 
                  className="text-xl text-gray-600"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  Les participants peuvent se reconnecter à la session avec le même code pour accéder aux analyses et aux résultats.
                </motion.p>
              </motion.div>
              
              <motion.div 
                className="bg-gray-50 p-8 rounded-lg border border-gray-200 max-w-2xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <h3 className="text-xl font-semibold mb-4">Statistiques de la session</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-gray-600 mb-2">Participants</p>
                    <p className="text-4xl font-bold text-primary">{participants.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600 mb-2">Votes totaux</p>
                    <p className="text-4xl font-bold text-primary">
                      {participants.reduce((sum, p) => sum + (p.votes || 0), 0)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-600 mb-2">Idées exploréees</p>
                    <p className="text-4xl font-bold text-primary">{topParticipants.length}</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="flex justify-center gap-4 mt-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Link
                  href={`/sessions/${sessionId}/results`}
                  className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-lg"
                >
                  Voir les résultats détaillés
                </Link>
                
                <Link
                  href={`/sessions/${sessionId}`}
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-800 rounded-md hover:bg-gray-50 transition-colors text-lg"
                >
                  Retour à la session
                </Link>
              </motion.div>
            </div>
          </div>
        );
        
      default:
        return <div>Contenu non disponible</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 relative overflow-hidden">
      <DotPattern className="absolute inset-0 z-0" />
      
      {/* Élément audio pour le son de fin de timer */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/timer-end.mp3" type="audio/mpeg" />
      </audio>
      
      {/* Contenu du slide actuel */}
      <div className="container mx-auto px-4 min-h-screen flex flex-col">
        <div className="flex-grow flex items-center justify-center">
          {renderPhaseContent()}
        </div>
        
        {/* Navigation entre phases - redesigned and moved to bottom right */}
        <div className="fixed bottom-6 right-6 flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
          <div className="flex items-center gap-1 mr-2">
            {Object.values(PHASES).map((phase) => (
              <div 
                key={phase} 
                className={`h-2 w-2 rounded-full ${currentPhase === phase ? 'bg-primary' : 'bg-gray-300'}`}
              ></div>
            ))}
          </div>
          
          <button
            onClick={goToNextPhase}
            disabled={loading}
            className="cm-button flex items-center justify-center gap-1 text-sm py-1 px-2"
          >
            Phase suivante
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 010-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 