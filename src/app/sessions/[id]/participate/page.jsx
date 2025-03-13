"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import DotPattern from "@/components/ui/DotPattern";
import Image from "next/image";
import { motion } from "framer-motion";
import AIAgentSelector from "@/components/AIAgentSelector";

// Phases alignées avec celles de la page run
const PHASES = {
  JOIN: 'join',              // Participants rejoignent
  INSTRUCTIONS: 'instructions', // Instructions avant discussion
  DISCUSSION: 'discussion',   // Les participants discutent
  VOTING: 'voting',          // Phase de vote
  INTERACTION: 'interaction', // Interaction avec l'IA
  ANALYSIS: 'analysis',      // Analyse des résultats
  CONCLUSION: 'conclusion'   // Conclusion
};

export default function ParticipationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = params.id;
  const displayName = searchParams.get("name") || "";
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [participantName, setParticipantName] = useState(displayName);
  const [joiningComplete, setJoiningComplete] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [currentParticipant, setCurrentParticipant] = useState(null);
  const [currentPhase, setCurrentPhase] = useState(PHASES.JOIN);
  const [searchTerm, setSearchTerm] = useState("");
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [remainingVotes, setRemainingVotes] = useState(3); // Défaut: 3 votes
  const [interactionStatus, setInteractionStatus] = useState('waiting'); // waiting, selected, not_selected
  const [analysisResults, setAnalysisResults] = useState([]);
  const [isInteracting, setIsInteracting] = useState(false);
  const audioRef = useRef(null);
  
  // Jouer un son quand le timer se termine
  const playTimerEndSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.error('Erreur lors de la lecture du son:', err));
    }
  };
  
  // Obtenir les informations de la session et vérifier si l'utilisateur a déjà rejoint
  useEffect(() => {
    const getSessionDetails = async () => {
      try {
        setLoading(true);
        
        // Vérifier si l'utilisateur a déjà rejoint la session
        const savedParticipant = localStorage.getItem(`participant_${sessionId}`);
        if (savedParticipant) {
          try {
            const parsedParticipant = JSON.parse(savedParticipant);
            setCurrentParticipant(parsedParticipant);
            setParticipantName(parsedParticipant.name);
            setJoiningComplete(true);
          } catch (e) {
            console.error("Erreur lors de la lecture du participant sauvegardé:", e);
          }
        }
        
        // Charger les informations de la session
        const { data: sessionData, error: sessionError } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", sessionId)
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
        
        if (!sessionData) {
          throw new Error("Session introuvable");
        }
        
        setSession(sessionData);
        
        // Définir le nombre de votes en fonction des paramètres de la session
        if (sessionData.max_votes_per_participant) {
          setRemainingVotes(sessionData.max_votes_per_participant);
        }
        
        try {
          // Charger les participants actuels
          const { data: participantsData, error: participantsError } = await supabase
            .from("participants")
            .select("*")
            .eq("session_id", sessionId);
            
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
        
      } catch (err) {
        console.error("Erreur lors du chargement de la session:", err);
        setError(err.message || "Impossible de charger cette session. Elle n'existe peut-être plus.");
      } finally {
        setLoading(false);
      }
    };
    
    getSessionDetails();
    
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
        } else if (payload.eventType === 'DELETE') {
          setParticipants(prev => prev.filter(p => p.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          setParticipants(prev => 
            prev.map(p => p.id === payload.new.id ? payload.new : p)
          );
        }
      })
      .subscribe();
    
    // Écouter les notifications de phase de la session
    const phaseSubscription = supabase
      .channel(`session_${sessionId}_phase`)
      .on('broadcast', { event: 'phase_change' }, (payload) => {
        setCurrentPhase(payload.payload.phase);
        
        // Réinitialiser le timer si nécessaire
        if (payload.payload.timer) {
          setTimer(payload.payload.timer);
          setTimerActive(true);
        } else {
          setTimerActive(false);
        }
        
        // Si passage à la phase d'interaction, vérifier si le participant est sélectionné
        if (payload.payload.phase === PHASES.INTERACTION && payload.payload.selected_participants) {
          const isSelected = payload.payload.selected_participants.includes(currentParticipant?.id);
          setInteractionStatus(isSelected ? 'selected' : 'not_selected');
        }
        
        // Si passage à la phase d'analyse, charger les résultats
        if (payload.payload.phase === PHASES.ANALYSIS && payload.payload.analyses) {
          setAnalysisResults(payload.payload.analyses);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(participantsSubscription);
      supabase.removeChannel(phaseSubscription);
    };
  }, [sessionId, displayName, currentParticipant?.id]);
  
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
    }
    
    return () => clearInterval(interval);
  }, [timerActive, timer]);
  
  // Rejoindre la session en tant que participant
  const joinSession = async (e) => {
    e.preventDefault();
    
    if (!participantName.trim()) {
      alert("Veuillez entrer votre nom pour rejoindre la session");
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Vérifier si la session est pleine
      if (participants.length >= (session?.max_participants || 30)) {
        setError(`Cette session est pleine (maximum ${session?.max_participants || 30} participants)`);
        setSubmitting(false);
        return;
      }
      
      // Créer un participant avec un UUID anonyme
      const { data, error } = await supabase
        .from("participants")
        .insert([
          {
            session_id: sessionId,
            display_name: participantName,
            is_anonymous: true,
            votes: 0
          }
        ])
        .select();
        
      if (error) {
        if (error.code === '42P01') {
          setError("La table 'participants' n'existe pas dans la base de données. Veuillez contacter l'administrateur.");
          return;
        }
        throw error;
      }
      
      if (data && data[0]) {
        // Enregistrer les informations du participant localement
        const participantInfo = {
          id: data[0].id,
          name: participantName
        };
        
        localStorage.setItem(`participant_${sessionId}`, JSON.stringify(participantInfo));
        setCurrentParticipant(participantInfo);
        setJoiningComplete(true);
      }
    } catch (err) {
      console.error("Erreur lors de l'inscription à la session:", err);
      setError("Impossible de rejoindre la session. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };
  
  // Voter pour un participant
  const voteForParticipant = async (participantId) => {
    if (remainingVotes <= 0) {
      alert("Vous avez utilisé tous vos votes disponibles.");
      return;
    }
    
    if (participantId === currentParticipant?.id) {
      alert("Vous ne pouvez pas voter pour vous-même.");
      return;
    }
    
    if (selectedParticipants.includes(participantId)) {
      alert("Vous avez déjà voté pour ce participant.");
      return;
    }
    
    try {
      // Mettre à jour le vote du participant
      const { error } = await supabase
        .from("participants")
        .update({ votes: supabase.rpc('increment', { inc: 1 }) })
        .eq("id", participantId);
        
      if (error) throw error;
      
      // Mettre à jour l'état local
      setSelectedParticipants([...selectedParticipants, participantId]);
      setRemainingVotes(remainingVotes - 1);
      
      // Mettre à jour localement le participant dans la liste
      setParticipants(prev => 
        prev.map(p => 
          p.id === participantId ? { ...p, votes: (p.votes || 0) + 1 } : p
        )
      );
    } catch (err) {
      console.error("Erreur lors du vote:", err);
      alert("Impossible de voter pour ce participant. Veuillez réessayer.");
    }
  };
  
  // Commencer l'interaction avec l'IA
  const startAIInteraction = () => {
    setIsInteracting(true);
    // Ici, vous pourriez ajouter la logique pour démarrer une interaction avec l'IA
  };
  
  // Formater le temps restant
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Filtrer les participants selon la recherche
  const filteredParticipants = participants.filter(p => 
    p.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Contenu pour chaque phase
  const renderPhaseContent = () => {
    // Phase de connexion
    if (!joiningComplete || currentPhase === PHASES.JOIN) {
      return (
        <div className="z-10 p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          {!joiningComplete ? (
            <>
              <h1 className="text-2xl font-semibold text-center mb-6">Rejoindre la session</h1>
              
              {session && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-center">{session.name}</h2>
                  <p className="text-center text-gray-600">Organisé par {session.host_name}</p>
                  <div className="mt-2 text-center">
                    <span className="text-sm font-semibold">Code: <span className="font-mono text-primary">{session.session_code}</span></span>
                    <p className="text-xs text-gray-600 mt-1">
                      Participants: {participants.length} / {session.max_participants || 30}
                    </p>
                  </div>
                </div>
              )}
              
              <form onSubmit={joinSession} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Votre nom
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                    placeholder="Entrez votre nom"
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={submitting || participants.length >= (session?.max_participants || 30)}
                  className="w-full cm-button py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {submitting ? "Inscription en cours..." : 
                  participants.length >= (session?.max_participants || 30) ? "Session complète" : 
                  "Rejoindre la session"}
                </button>
                
                {participants.length >= (session?.max_participants || 30) && (
                  <p className="text-xs text-center text-red-500">
                    Cette session est complète ({session?.max_participants || 30} participants maximum)
                  </p>
                )}
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-center mb-2">Participation confirmée !</h1>
              <p className="text-gray-600 text-center mb-6">
                Vous avez rejoint la session <span className="font-semibold">{session.name}</span>.
              </p>
              
              {currentParticipant && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6 w-full">
                  <p className="text-center font-medium mb-1">Votre identifiant pour cette session:</p>
                  <p className="text-center font-mono text-lg font-bold">{currentParticipant.id.substring(0, 8)}</p>
                  <p className="text-xs text-center text-gray-500 mt-1">
                    Les autres participants pourront vous retrouver grâce à cet identifiant
                  </p>
                </div>
              )}
              
              <p className="text-center mb-4">
                En attente du démarrage de la session. Gardez cette page ouverte !
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 w-full">
                <p className="text-sm text-center text-gray-600 mb-2">
                  Participants connectés: <span className="font-semibold">{participants.length} / {session.max_participants || 30}</span>
                </p>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Phase d'instructions
    if (currentPhase === PHASES.INSTRUCTIONS) {
      return (
        <div className="z-10 p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-semibold text-center mb-4">Instructions</h1>
          
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mb-6">
            <p className="text-center font-medium">
              {session?.discussion_instructions || 
               "Les participants doivent maintenant discuter entre eux. Échangez vos idées sur le sujet proposé."}
            </p>
          </div>
          
          <p className="text-center text-gray-600 mb-4">
            La phase de discussion va commencer très bientôt.
            <br />
            Préparez-vous à échanger avec les autres participants.
          </p>
          
          {currentParticipant && (
            <div className="bg-gray-100 p-3 rounded-lg mb-4">
              <p className="text-sm text-center text-gray-700">
                Votre identifiant: <span className="font-mono font-bold">{currentParticipant.id.substring(0, 8)}</span>
              </p>
              <p className="text-xs text-center text-gray-500 mt-1">
                Gardez cette page ouverte pendant toute la session
              </p>
            </div>
          )}
        </div>
      );
    }
    
    // Phase de discussion
    if (currentPhase === PHASES.DISCUSSION) {
      return (
        <div className="z-10 p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-semibold text-center mb-4">Discussion en cours</h1>
          
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mb-6">
            <p className="text-center font-medium mb-4">
              {session?.discussion_instructions || 
               "Échangez vos idées sur le sujet proposé avec les autres participants."}
            </p>
            
            {timerActive && (
              <div className="bg-white p-4 rounded-lg border border-blue-200 mx-auto max-w-xs">
                <p className="text-center text-3xl font-bold text-primary">{formatTime(timer)}</p>
                <p className="text-center text-sm text-gray-600">Temps restant</p>
              </div>
            )}
          </div>
          
          <p className="text-center text-gray-600 mb-6">
            Prenez note des participants avec lesquels vous avez des échanges intéressants.
            <br />
            Vous pourrez voter pour eux lors de la prochaine phase.
          </p>
          
          {currentParticipant && (
            <div className="bg-gray-100 p-3 rounded-lg">
              <p className="text-sm text-center text-gray-700">
                Votre identifiant: <span className="font-mono font-bold">{currentParticipant.id.substring(0, 8)}</span>
              </p>
              <p className="text-xs text-center text-gray-500 mt-1">
                Partagez cet identifiant avec les autres participants
              </p>
            </div>
          )}
        </div>
      );
    }
    
    // Phase de vote
    if (currentPhase === PHASES.VOTING) {
      return (
        <div className="z-10 p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-semibold text-center mb-4">Votez maintenant</h1>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-6">
            <p className="text-center font-medium mb-3">
              {session?.voting_instructions || 
               "Votez pour les participants avec lesquels vous avez eu les échanges les plus intéressants."}
            </p>
            
            {timerActive && (
              <div className="bg-white p-3 rounded-lg border border-green-200 mx-auto max-w-xs mb-2">
                <p className="text-center text-2xl font-bold text-primary">{formatTime(timer)}</p>
                <p className="text-center text-xs text-gray-600">Temps restant pour voter</p>
              </div>
            )}
            
            <p className="text-center text-sm">
              Votes restants: <span className="font-bold">{remainingVotes}</span> sur {session?.max_votes_per_participant || 3}
            </p>
          </div>
          
          <div className="mb-4">
            <input
              type="text"
              placeholder="Rechercher par nom ou identifiant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {filteredParticipants.length > 0 ? (
              filteredParticipants
                .filter(p => p.id !== currentParticipant?.id) // Exclure le participant actuel
                .map(participant => (
                  <motion.div
                    key={participant.id}
                    className={`p-3 border rounded-lg flex items-center justify-between ${
                      selectedParticipants.includes(participant.id) 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white border-gray-200'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 mr-3">
                        {participant.display_name?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <p className="font-medium">{participant.display_name}</p>
                        <p className="text-xs text-gray-500">ID: {participant.id.substring(0, 8)}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => voteForParticipant(participant.id)}
                      disabled={selectedParticipants.includes(participant.id) || remainingVotes <= 0}
                      className={`px-3 py-1 rounded-md text-sm ${
                        selectedParticipants.includes(participant.id)
                          ? 'bg-green-500 text-white cursor-default'
                          : remainingVotes <= 0
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'cm-button'
                      }`}
                    >
                      {selectedParticipants.includes(participant.id) ? 'Voté ✓' : 'Voter'}
                    </button>
                  </motion.div>
                ))
            ) : (
              <p className="text-center text-gray-600 py-4">Aucun participant trouvé</p>
            )}
          </div>
        </div>
      );
    }
    
    // Phase d'interaction
    if (currentPhase === PHASES.INTERACTION) {
      // Déterminer le type d'agent à afficher
      let agentType = 'pause';
      if (interactionStatus === 'selected') {
        agentType = 'nuggets'; // Les participants sélectionnés utilisent AI Nuggets
      } else if (interactionStatus === 'not_selected') {
        agentType = 'lightbulb'; // Les autres participants peuvent utiliser AI Lightbulb
      }
      
      return (
        <div className="z-10 p-8 bg-white rounded-lg shadow-md max-w-xl w-full">
          <h1 className="text-2xl font-semibold text-center mb-4">Phase d'interaction</h1>
          
          {interactionStatus === 'selected' ? (
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-6">
              <h2 className="text-xl font-semibold text-center mb-3">Félicitations!</h2>
              <p className="text-center mb-4">
                Vous avez été sélectionné pour discuter avec notre IA journaliste.
                Vos idées ont été particulièrement appréciées par les autres participants.
              </p>
            </div>
          ) : interactionStatus === 'not_selected' ? (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-6">
              <h2 className="text-xl font-semibold text-center mb-3">Partagez vos idées</h2>
              <p className="text-center mb-4">
                Même si vous n'avez pas été sélectionné pour l'interview principale,
                vos idées sont précieuses ! Discutez avec notre AI Lightbulb pour développer
                vos propres réflexions inspirées par les discussions.
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
              <h2 className="text-xl font-semibold text-center mb-3">En attente</h2>
              <p className="text-center mb-4">
                En attente de l'attribution d'un rôle dans cette phase.
                Veuillez patienter un instant...
              </p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            </div>
          )}
          
          {interactionStatus !== 'waiting' && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mt-6" style={{ height: '500px' }}>
              <AIAgentSelector
                sessionId={sessionId}
                participantName={currentParticipant?.name || participantName}
                programName={session?.name || "Session"}
                teacherName={session?.host_name || "Animateur"}
                agentType={agentType}
                onComplete={(insights) => {
                  console.log("Interaction terminée avec succès:", insights);
                  // Ici vous pourriez sauvegarder les insights dans la base de données
                }}
              />
            </div>
          )}
          
          {timerActive && (
            <div className="bg-white p-3 rounded-lg border mt-4 mx-auto max-w-xs">
              <p className="text-center text-xl font-bold text-primary">{formatTime(timer)}</p>
              <p className="text-center text-xs text-gray-600">Temps restant pour cette phase</p>
            </div>
          )}
        </div>
      );
    }
    
    // Phase d'analyse
    if (currentPhase === PHASES.ANALYSIS) {
      return (
        <div className="z-10 p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-semibold text-center mb-4">Analyses</h1>
          
          <div className="bg-purple-50 p-6 rounded-lg border border-purple-100 mb-6">
            <p className="text-center mb-4">
              Voici les analyses des discussions avec l'IA journaliste.
              Ces "books" résument les échanges et mettent en avant les idées principales.
            </p>
          </div>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {analysisResults.length > 0 ? (
              analysisResults.map((analysis, index) => (
                <motion.div
                  key={index}
                  className="p-4 bg-white border rounded-lg shadow-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-2">
                      {analysis.participant?.charAt(0) || 'A'}
                    </div>
                    <h3 className="font-medium">{analysis.participant || 'Anonyme'}</h3>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-2">
                    {analysis.content || 'Analyse en cours de génération...'}
                  </p>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {analysis.tags?.map((tag, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="bg-white p-6 rounded-lg border text-center">
                <p className="text-gray-600">Les analyses sont en cours de préparation...</p>
                <div className="mt-4 flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Phase de conclusion
    if (currentPhase === PHASES.CONCLUSION) {
      return (
        <div className="z-10 p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-semibold text-center mb-4">Session terminée</h1>
          
          <div className="bg-green-50 p-6 rounded-lg border border-green-100 mb-6">
            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold text-center mb-2">Merci pour votre participation!</h2>
            <p className="text-center text-gray-600">
              Cette session est maintenant terminée. Vous pouvez vous reconnecter à tout moment
              pour accéder aux analyses et aux "books" des discussions.
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              N'hésitez pas à garder le code de session pour y revenir plus tard.
            </p>
            <div className="bg-gray-100 p-3 rounded-lg inline-block">
              <p className="font-mono font-bold text-primary">{session.session_code}</p>
            </div>
          </div>
        </div>
      );
    }
    
    // Par défaut, afficher un message d'attente
    return (
      <div className="z-10 p-8 bg-white rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-xl font-semibold text-center mb-4">En attente</h1>
        <p className="text-center text-gray-600">
          En attente de la prochaine phase de la session...
        </p>
        <div className="flex justify-center mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 relative">
        <DotPattern className="absolute inset-0 z-0" />
        <div className="z-10 p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-xl font-semibold text-center mb-4">Chargement de la session...</h1>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 relative">
        <DotPattern className="absolute inset-0 z-0" />
        <div className="z-10 p-8 bg-white rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-xl font-semibold text-center mb-4">Erreur</h1>
          <p className="text-center text-red-500">{error}</p>
          <div className="flex justify-center mt-4">
            <button
              onClick={() => router.push("/join")}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
            >
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 relative">
      <DotPattern className="absolute inset-0 z-0" />
      
      {/* Élément audio pour le son de fin de timer */}
      <audio ref={audioRef} preload="auto">
        <source src="/sounds/timer-end.mp3" type="audio/mpeg" />
      </audio>
      
      {/* Contenu principal basé sur la phase actuelle */}
      {renderPhaseContent()}
      
      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">Clipboard by ConnectedMate</p>
      </div>
    </div>
  );
} 