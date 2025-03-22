'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const sessionId = params?.id;
  const router = useRouter();
  
  // États de base
  const [session, setSession] = useState(null);
  const [currentPhase, setCurrentPhase] = useState(PHASES.JOIN);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États des participants
  const [participants, setParticipants] = useState([]);
  const [topParticipants, setTopParticipants] = useState([]);
  const [newParticipantIds, setNewParticipantIds] = useState([]);
  
  // États de la session
  const [shareUrl, setShareUrl] = useState('');
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerDuration, setTimerDuration] = useState(0);
  
  // États des analyses
  const [interactions, setInteractions] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  
  // États des préférences
  const [playSoundEnabled, setPlaySoundEnabled] = useState(true);
  
  // Refs
  const audioRef = useRef(null);
  const phaseChannelRef = useRef(null);
  
  // Chargement initial de la session
  useEffect(() => {
    let isMounted = true;
    
    const loadSession = async () => {
      if (!sessionId) {
        setError('ID de session non valide');
        setLoading(false);
        return;
      }

      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (sessionError) throw sessionError;
        if (!sessionData) throw new Error('Session non trouvée');
        
        if (!isMounted) return;
        
        setSession(sessionData);
        
        // Générer l'URL de partage
        if (typeof window !== 'undefined') {
          const baseUrl = window.location.origin;
          const shareUrl = `${baseUrl}/join/${sessionData.code || ''}`;
          setShareUrl(shareUrl);
        }
        
        // Configurer le timer
        if (sessionData.settings?.ai_configuration?.timerEnabled) {
          const duration = parseInt(sessionData.settings.ai_configuration.timerDuration) || 0;
          setTimerDuration(duration * 60);
        }
        
        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error loading session:', err);
        setError(err.message || 'Erreur lors du chargement de la session');
        setLoading(false);
      }
    };

    loadSession();
    
    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  // Gestionnaire du timer optimisé
  useEffect(() => {
    let interval = null;
    
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(prevTimer => {
          const newTimer = prevTimer - 1;
          if (newTimer === 0) {
            setTimerActive(false);
            playTimerEndSound();
            handleTimerEnd();
          }
          return newTimer;
        });
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timer]);

  // Fonction pour gérer la fin du timer
  const handleTimerEnd = useCallback(() => {
    switch (currentPhase) {
      case PHASES.DISCUSSION:
        setCurrentPhase(PHASES.VOTING);
        broadcastPhaseChange(PHASES.VOTING);
        break;
      case PHASES.VOTING:
        handleVotingComplete();
        break;
      case PHASES.INTERACTION:
        setCurrentPhase(PHASES.ANALYSIS);
        const analysesData = generateMockAnalyses();
        setAnalyses(analysesData);
        broadcastPhaseChange(PHASES.ANALYSIS, { analyses: analysesData });
        break;
      default:
        break;
    }
  }, [currentPhase]);

  // Fonction pour diffuser les changements de phase
  const broadcastPhaseChange = useCallback((phase, additionalData = {}) => {
    if (!phaseChannelRef.current) return;
    
    const payload = {
      phase,
      ...additionalData
    };
    
    if (phase === PHASES.DISCUSSION || phase === PHASES.VOTING || phase === PHASES.INTERACTION) {
      payload.timer = timer;
    }
    
    phaseChannelRef.current.send({
      type: 'broadcast',
      event: 'phase_change',
      payload
    }).catch(error => console.error('Erreur lors de la diffusion de la phase:', error));
  }, [timer]);

  // Fonction pour générer des analyses
  const generateMockAnalyses = useCallback(() => {
    if (!Array.isArray(topParticipants) || !session?.topic) return [];
    
    return topParticipants.map(participant => ({
      participant: participant?.display_name || 'Anonyme',
      participant_id: participant?.id || 'unknown',
      content: `Analyse des idées de ${participant?.display_name || 'Anonyme'} sur ${session.topic}. Points clés abordés: vision unique, approche innovante et perspectives d'avenir.`,
      tags: ['Idée principale', 'Innovation', 'Perspective']
    }));
  }, [topParticipants, session]);

  // Fonction pour jouer le son de fin
  const playTimerEndSound = useCallback(() => {
    if (playSoundEnabled && audioRef.current) {
      audioRef.current.play().catch(err => console.error('Erreur lors de la lecture du son:', err));
    }
  }, [playSoundEnabled]);

  // Fonction pour passer à la phase suivante
  const goToNextPhase = useCallback(() => {
    setTimerActive(false);
    
    switch (currentPhase) {
      case PHASES.JOIN:
        setCurrentPhase(PHASES.INSTRUCTIONS);
        broadcastPhaseChange(PHASES.INSTRUCTIONS);
        break;
      case PHASES.INSTRUCTIONS:
        setTimer(timerDuration);
        setTimerActive(true);
        setCurrentPhase(PHASES.DISCUSSION);
        broadcastPhaseChange(PHASES.DISCUSSION, { timer: timerDuration });
        break;
      case PHASES.DISCUSSION:
        const votingDuration = Math.min(timerDuration, 3 * 60);
        setTimer(votingDuration);
        setTimerActive(true);
        setCurrentPhase(PHASES.VOTING);
        broadcastPhaseChange(PHASES.VOTING, { timer: votingDuration });
        break;
      case PHASES.VOTING:
        handleVotingComplete();
        break;
      case PHASES.INTERACTION:
        setCurrentPhase(PHASES.ANALYSIS);
        const analysesData = generateMockAnalyses();
        setAnalyses(analysesData);
        broadcastPhaseChange(PHASES.ANALYSIS, { analyses: analysesData });
        break;
      case PHASES.ANALYSIS:
        setCurrentPhase(PHASES.CONCLUSION);
        broadcastPhaseChange(PHASES.CONCLUSION);
        break;
      default:
        break;
    }
  }, [currentPhase, timerDuration]);

  // Fonction pour gérer la fin des votes
  const handleVotingComplete = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('id, display_name, votes')
        .eq('session_id', sessionId)
        .order('votes', { ascending: false })
        .limit(5);
        
      if (error) {
        if (error.code === '42P01') {
          console.error("La table 'participants' n'existe pas. Utilisation de données simulées.");
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
        setTopParticipants(data || []);
      }
      
      setCurrentPhase(PHASES.INTERACTION);
      const interactionDuration = 5 * 60;
      setTimer(interactionDuration);
      setTimerActive(true);
      
      broadcastPhaseChange(PHASES.INTERACTION, { 
        selected_participants: (data || []).map(p => p.id),
        timer: interactionDuration
      });
    } catch (err) {
      console.error('Erreur lors de la récupération des participants:', err);
      setTopParticipants([]);
      setCurrentPhase(PHASES.INTERACTION);
      broadcastPhaseChange(PHASES.INTERACTION, { selected_participants: [] });
    }
  }, [sessionId]);

  // Formater le temps restant
  const formatTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Rendu du contenu de la phase actuelle
  const renderPhaseContent = () => {
    if (!session) {
      return (
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-center">Session non disponible</h2>
          </div>
        </div>
      );
    }

    // Ensure shareUrl is a string
    const displayShareUrl = typeof shareUrl === 'string' ? shareUrl : '';

    switch (currentPhase) {
      case PHASES.JOIN:
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-center mb-6">Join Session</h2>
              
              <div className="flex justify-center mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <QRCode value={displayShareUrl} size={200} />
                </div>
              </div>
              
              <div className="text-center mb-8">
                <p className="text-gray-600 mb-2">Go to this URL:</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="bg-gray-100 px-4 py-2 rounded">{displayShareUrl}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(displayShareUrl);
                    }}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-gray-600">
                  Connected Participants: {Array.isArray(participants) ? participants.length : 0} / {session?.max_participants || 30}
                </p>
              </div>
            </div>
          </div>
        );
        
      case PHASES.INSTRUCTIONS:
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-center mb-6">Instructions</h2>
              
              <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-100 mb-8">
                <p className="text-xl text-center">
                  {session?.discussion_instructions || 
                   "Les participants vont maintenant discuter entre eux. Échangez vos idées sur le sujet proposé."}
                </p>
              </div>
              
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border-2 shadow-md">
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
              </div>
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
                  {Array.isArray(topParticipants) && topParticipants.map((participant, index) => (
                    <motion.div 
                      key={participant?.id || index}
                      className="bg-white p-4 rounded-lg border-2 shadow-md"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + (index * 0.1) }}
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl mb-3">
                          {(participant?.display_name || 'A').charAt(0).toUpperCase()}
                        </div>
                        <p className="text-xl font-semibold mb-1">{participant?.display_name || 'Anonyme'}</p>
                        <p className="text-gray-500 text-sm mb-2">
                          ID: {participant?.id ? participant.id.substring(0, 8) : 'N/A'}
                        </p>
                        <div className="bg-primary/10 px-3 py-1 rounded-full text-primary font-medium">
                          {participant?.votes || 0} votes
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {(!Array.isArray(topParticipants) || topParticipants.length === 0) && (
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
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-center">Phase non disponible</h2>
            </div>
          </div>
        );
    }
  };

  // Vérifications de sécurité pour le rendu
  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
          <p className="text-gray-700 mb-6">ID de session non valide</p>
          <Link 
            href="/sessions"
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
          >
            Retour aux sessions
          </Link>
        </div>
      </div>
    );
  }

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link 
            href="/sessions"
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90"
          >
            Retour aux sessions
          </Link>
        </div>
      </div>
    );
  }

  // Rendu principal
  return (
    <div className="min-h-screen bg-gray-50 py-6 relative overflow-hidden">
      <DotPattern className="absolute inset-0 z-0" />
      
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/timer-end.mp3" type="audio/mpeg" />
      </audio>
      
      <div className="container mx-auto px-4 min-h-screen flex flex-col">
        <div className="flex-grow flex items-center justify-center">
          {renderPhaseContent()}
        </div>
        
        <div className="fixed bottom-6 right-6 flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-30">
          <div className="flex items-center gap-1 mr-2">
            {Object.values(PHASES).map((phase) => (
              <div 
                key={phase} 
                className={`h-2 w-2 rounded-full ${currentPhase === phase ? 'bg-primary' : 'bg-gray-300'}`}
              />
            ))}
          </div>
          
          <button
            onClick={goToNextPhase}
            disabled={loading}
            className="cm-button flex items-center justify-center gap-1 text-sm py-1 px-2"
          >
            Next Phase
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 010-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
} 