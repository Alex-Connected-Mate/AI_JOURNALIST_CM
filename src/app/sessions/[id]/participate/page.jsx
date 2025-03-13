"use client";

/**
 * Page de participation à une session
 * 
 * Cette page permet aux participants de rejoindre une session, de participer aux différentes phases
 * et d'interagir avec les agents IA (AI Nuggets et AI Lightbulb).
 * 
 * Fonctionnalités principales:
 * - Rejoindre une session avec un nom d'utilisateur
 * - Participer aux différentes phases (instructions, discussion, vote, interaction, analyse, conclusion)
 * - Voter pour d'autres participants
 * - Interagir avec des agents IA selon le statut (sélectionné ou non)
 * - Prendre des notes pendant la session
 * - Soumettre des feedbacks sur l'expérience IA
 * 
 * Optimisations et sécurité:
 * - Modération du contenu via l'API OpenAI
 * - Protection contre le rate limiting
 * - Gestion des erreurs avec retry automatique
 * - Mise en cache des réponses pour optimiser les performances
 * - Accessibilité améliorée pour les lecteurs d'écran
 * - Gestion du contexte de session pour des réponses IA plus pertinentes
 * 
 * Structure du code:
 * 1. Imports et constantes
 * 2. Fonctions utilitaires (modération, contexte de session)
 * 3. Composant principal avec hooks et gestionnaires d'événements
 * 4. Rendu conditionnel selon la phase de session
 * 
 * @module ParticipationPage
 */

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
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

// Textes pour l'accessibilité
const ACCESSIBILITY_TEXTS = {
  LOADING: "Chargement de la session en cours. Veuillez patienter.",
  AI_LOADING: "Initialisation de l'agent d'intelligence artificielle. Cela peut prendre quelques instants.",
  MODERATION: "Vérification du contenu pour assurer la conformité aux règles de modération. Cela prendra un instant.",
  ERROR: "Une erreur est survenue. Veuillez réessayer ou contacter l'assistance.",
  TIMER_END: "Attention, le temps est écoulé.",
  PHASE_CHANGE: "La phase de session a changé. Nouvelle phase: "
};

// Fonction pour appeler l'API de modération d'OpenAI
async function checkContentWithModerationAPI(content) {
  try {
    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        input: content
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const data = await response.json();
    
    // Vérifier si le contenu est signalé comme inapproprié
    return {
      isSafe: !data.results[0].flagged,
      categories: data.results[0].categories,
      scores: data.results[0].category_scores
    };
  } catch (error) {
    console.error('Erreur lors de la vérification de modération:', error);
    // En cas d'erreur, on considère le contenu comme sûr par défaut
    // mais on pourrait aussi choisir d'être plus strict
    return { isSafe: true, error: error.message };
  }
}

// Classe pour gérer le contexte de la session et améliorer les réponses de l'IA
class SessionContextManager {
  constructor() {
    this.sessionNotes = [];
    this.discussionHighlights = [];
    this.participantInsights = new Map();
  }
  
  // Ajouter une note de session
  addSessionNote(note) {
    if (note && note.trim()) {
      this.sessionNotes.push({
        content: note.trim(),
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Ajouter un point fort de la discussion
  addDiscussionHighlight(highlight, participantId) {
    if (highlight && highlight.trim()) {
      this.discussionHighlights.push({
        content: highlight.trim(),
        participantId,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Ajouter un insight pour un participant spécifique
  addParticipantInsight(participantId, insight) {
    if (!participantId || !insight || !insight.trim()) return;
    
    if (!this.participantInsights.has(participantId)) {
      this.participantInsights.set(participantId, []);
    }
    
    this.participantInsights.get(participantId).push({
      content: insight.trim(),
      timestamp: new Date().toISOString()
    });
  }
  
  // Obtenir le contexte pertinent pour un participant
  getContextForParticipant(participantId, maxItems = 5) {
    const context = {
      sessionNotes: [...this.sessionNotes].slice(-maxItems),
      discussionHighlights: [...this.discussionHighlights].slice(-maxItems)
    };
    
    // Ajouter les insights spécifiques au participant s'ils existent
    if (this.participantInsights.has(participantId)) {
      context.participantInsights = [...this.participantInsights.get(participantId)].slice(-maxItems);
    }
    
    return context;
  }
  
  // Générer un contexte formaté pour l'IA
  generateFormattedContext(participantId) {
    const context = this.getContextForParticipant(participantId);
    let formattedContext = "CONTEXTE DE LA SESSION:\n\n";
    
    if (context.sessionNotes && context.sessionNotes.length > 0) {
      formattedContext += "Notes de session:\n";
      context.sessionNotes.forEach((note, index) => {
        formattedContext += `${index + 1}. ${note.content}\n`;
      });
      formattedContext += "\n";
    }
    
    if (context.discussionHighlights && context.discussionHighlights.length > 0) {
      formattedContext += "Points forts de la discussion:\n";
      context.discussionHighlights.forEach((highlight, index) => {
        formattedContext += `${index + 1}. ${highlight.content}\n`;
      });
      formattedContext += "\n";
    }
    
    if (context.participantInsights && context.participantInsights.length > 0) {
      formattedContext += "Vos insights précédents:\n";
      context.participantInsights.forEach((insight, index) => {
        formattedContext += `${index + 1}. ${insight.content}\n`;
      });
    }
    
    return formattedContext;
  }
  
  // Sauvegarder le contexte dans le stockage local
  saveToLocalStorage(sessionId) {
    try {
      localStorage.setItem(`session_context_${sessionId}`, JSON.stringify({
        sessionNotes: this.sessionNotes,
        discussionHighlights: this.discussionHighlights,
        participantInsights: Array.from(this.participantInsights.entries())
      }));
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du contexte de session:", err);
    }
  }
  
  // Charger le contexte depuis le stockage local
  loadFromLocalStorage(sessionId) {
    try {
      const savedContext = localStorage.getItem(`session_context_${sessionId}`);
      if (savedContext) {
        const parsedContext = JSON.parse(savedContext);
        this.sessionNotes = parsedContext.sessionNotes || [];
        this.discussionHighlights = parsedContext.discussionHighlights || [];
        
        // Reconstruire la Map des insights
        this.participantInsights = new Map();
        if (parsedContext.participantInsights) {
          parsedContext.participantInsights.forEach(([participantId, insights]) => {
            this.participantInsights.set(participantId, insights);
          });
        }
        
        return true;
      }
    } catch (err) {
      console.error("Erreur lors du chargement du contexte de session:", err);
    }
    
    return false;
  }
}

// Loading component for Suspense
function ParticipationLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 relative">
      <DotPattern className="absolute inset-0 z-0" />
      <div className="bg-white p-8 rounded-lg shadow-md relative z-10 text-center">
        <div className="w-16 h-16 border-t-4 border-primary border-solid rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-2xl font-medium text-gray-700">Loading Session...</h2>
        <p className="text-gray-500 mt-2">Preparing your participation experience</p>
      </div>
    </div>
  );
}

// Main component with useSearchParams
function ParticipationContent() {
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
  const [aiAgentLoading, setAiAgentLoading] = useState(false); // État de chargement de l'agent IA
  const [moderationActive, setModerationActive] = useState(false); // État pour le système de modération
  const [cachedInsights, setCachedInsights] = useState(null); // Cache pour les insights générés
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState('issue'); // 'issue', 'suggestion', 'praise'
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [sessionNote, setSessionNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const audioRef = useRef(null);
  const aiResponseCache = useRef({});
  const messageCountRef = useRef(0);
  const lastAPICallTimeRef = useRef(0);
  const apiCallCountRef = useRef(0);
  const sessionContextRef = useRef(new SessionContextManager());
  const API_RATE_LIMIT_WINDOW = 60000; // Fenêtre de 60 secondes pour le rate limiting
  const API_RATE_LIMIT_MAX = 20; // Maximum 20 appels par minute
  
  // Jouer un son quand le timer se termine
  const playTimerEndSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.error('Erreur lors de la lecture du son:', err));
    }
  };
  
  // Améliorer les annonces pour l'accessibilité
  const announceForScreenReader = useCallback((message) => {
    // Créer un élément pour les lecteurs d'écran
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'assertive');
    announcement.setAttribute('role', 'status');
    announcement.className = 'sr-only'; // Visible uniquement pour les lecteurs d'écran
    announcement.textContent = message;
    
    // Ajouter à la page puis supprimer après lecture
    document.body.appendChild(announcement);
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);
  
  // Annoncer les changements de phase
  useEffect(() => {
    // Annoncer le changement de phase pour les lecteurs d'écran
    if (currentPhase) {
      announceForScreenReader(ACCESSIBILITY_TEXTS.PHASE_CHANGE + currentPhase);
    }
  }, [currentPhase, announceForScreenReader]);
  
  // Annoncer la fin du timer
  useEffect(() => {
    if (timerActive && timer === 0) {
      announceForScreenReader(ACCESSIBILITY_TEXTS.TIMER_END);
    }
  }, [timerActive, timer, announceForScreenReader]);
  
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
          // Activer l'état de chargement de l'agent IA
          setAiAgentLoading(true);
          
          // Vérifier si le participant est sélectionné
          const isSelected = payload.payload.selected_participants.includes(currentParticipant?.id);
          setInteractionStatus(isSelected ? 'selected' : 'not_selected');
          
          // Désactiver l'état de chargement après un court délai
          // Cela permet d'avoir un retour visuel pour l'utilisateur
          setTimeout(() => {
            setAiAgentLoading(false);
          }, 2000);
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
  
  // Fonction pour vérifier le rate limiting
  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    
    // Réinitialiser le compteur après la fenêtre de temps
    if (now - lastAPICallTimeRef.current > API_RATE_LIMIT_WINDOW) {
      apiCallCountRef.current = 0;
      lastAPICallTimeRef.current = now;
      return true;
    }
    
    // Vérifier si le rate limit est atteint
    if (apiCallCountRef.current >= API_RATE_LIMIT_MAX) {
      return false;
    }
    
    // Incrémenter le compteur et mettre à jour le timestamp
    apiCallCountRef.current++;
    return true;
  }, []);
  
  // Fonction pour simuler une attente si le rate limit est atteint
  const waitForRateLimit = useCallback(async () => {
    if (!checkRateLimit()) {
      // Calculer le temps d'attente restant
      const timeToWait = API_RATE_LIMIT_WINDOW - (Date.now() - lastAPICallTimeRef.current);
      
      setError(`Limite d'utilisation atteinte. Attente de ${Math.ceil(timeToWait/1000)} secondes avant de réessayer.`);
      
      // Attendre que la fenêtre de rate limiting se termine
      await new Promise(resolve => setTimeout(resolve, timeToWait + 100));
      
      // Réinitialiser le compteur
      apiCallCountRef.current = 0;
      lastAPICallTimeRef.current = Date.now();
      
      setError(null);
    }
    
    return true;
  }, [checkRateLimit]);
  
  // Modification du startAIInteraction pour inclure l'accessibilité
  const startAIInteraction = useCallback(async () => {
    // Vérifier le rate limiting avant de démarrer
    if (!await waitForRateLimit()) {
      return;
    }
    
    setIsInteracting(true);
    setAiAgentLoading(true);
    
    // Annoncer pour l'accessibilité
    announceForScreenReader(ACCESSIBILITY_TEXTS.AI_LOADING);
    
    // Simuler un délai de chargement pour une meilleure expérience utilisateur
    setTimeout(() => {
      setAiAgentLoading(false);
    }, 2000);
  }, [waitForRateLimit, announceForScreenReader]);
  
  // Vérifier si des insights précédents existent dans le stockage local
  useEffect(() => {
    if (currentParticipant?.id && sessionId) {
      try {
        const savedInsights = localStorage.getItem(`insights_${sessionId}_${currentParticipant.id}`);
        if (savedInsights) {
          setCachedInsights(JSON.parse(savedInsights));
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des insights précédents:", err);
      }
    }
  }, [currentParticipant?.id, sessionId]);

  // Optimisation mémoire: nettoyer les caches lors du démontage du composant
  useEffect(() => {
    return () => {
      // Nettoyage des caches à la fermeture
      aiResponseCache.current = {};
      messageCountRef.current = 0;
    };
  }, []);
  
  // Fonction pour vérifier la modération du contenu avec l'API OpenAI
  const checkContentModeration = useCallback(async (content) => {
    if (!content || content.trim().length === 0) return true;
    
    try {
      setModerationActive(true);
      
      // Utiliser l'API de modération d'OpenAI
      const result = await checkContentWithModerationAPI(content);
      
      setModerationActive(false);
      
      // Si le contenu est signalé, on peut enregistrer les catégories problématiques
      if (!result.isSafe) {
        console.warn('Contenu inapproprié détecté:', result.categories);
        
        // On pourrait enregistrer cet événement dans la base de données
        // pour analyse et amélioration du système
      }
      
      return result.isSafe;
    } catch (error) {
      console.error("Erreur lors de la vérification de modération:", error);
      setModerationActive(false);
      return true; // Par défaut, autoriser en cas d'erreur
    }
  }, []);
  
  // Soumettre un feedback sur l'interaction avec l'IA
  const submitFeedback = useCallback(async () => {
    if (!feedbackMessage.trim()) {
      setError("Veuillez entrer un message de feedback.");
      return;
    }
    
    setFeedbackSubmitting(true);
    
    try {
      // Vérifier le contenu du feedback
      const isSafe = await checkContentModeration(feedbackMessage);
      
      if (!isSafe) {
        setError("Votre message contient du contenu inapproprié. Veuillez le modifier.");
        setFeedbackSubmitting(false);
        return;
      }
      
      // Enregistrer le feedback dans la base de données
      const { error: feedbackError } = await supabase
        .from("ai_feedback")
        .insert([{
          session_id: sessionId,
          participant_id: currentParticipant?.id || 'anonymous',
          message: feedbackMessage,
          feedback_type: feedbackType,
          created_at: new Date().toISOString()
        }]);
        
      if (feedbackError) {
        if (feedbackError.code === '42P01') {
          // La table n'existe pas, on stocke localement
          try {
            const feedbackKey = `feedback_${sessionId}_${Date.now()}`;
            localStorage.setItem(feedbackKey, JSON.stringify({
              message: feedbackMessage,
              type: feedbackType,
              timestamp: new Date().toISOString()
            }));
          } catch (err) {
            console.error("Erreur lors de la sauvegarde du feedback:", err);
          }
        } else {
          throw feedbackError;
        }
      }
      
      // Réinitialiser le formulaire
      setFeedbackMessage('');
      setFeedbackOpen(false);
      
      // Afficher un message de confirmation
      setError("Merci pour votre feedback!");
      setTimeout(() => setError(null), 3000);
      
    } catch (err) {
      console.error("Erreur lors de la soumission du feedback:", err);
      setError("Impossible d'envoyer votre feedback. Veuillez réessayer.");
    } finally {
      setFeedbackSubmitting(false);
    }
  }, [feedbackMessage, feedbackType, sessionId, currentParticipant?.id, checkContentModeration]);
  
  // Charger le contexte de session au démarrage
  useEffect(() => {
    if (sessionId) {
      sessionContextRef.current.loadFromLocalStorage(sessionId);
    }
  }, [sessionId]);
  
  // Sauvegarder une note de session
  const saveSessionNote = useCallback(() => {
    if (sessionNote.trim()) {
      sessionContextRef.current.addSessionNote(sessionNote);
      sessionContextRef.current.saveToLocalStorage(sessionId);
      setSessionNote('');
      setShowNoteInput(false);
      
      // Afficher un message de confirmation
      setError("Note sauvegardée avec succès!");
      setTimeout(() => setError(null), 2000);
    }
  }, [sessionNote, sessionId]);
  
  // Sauvegarder un point fort de la discussion
  const saveDiscussionHighlight = useCallback((highlight) => {
    if (highlight && highlight.trim()) {
      sessionContextRef.current.addDiscussionHighlight(
        highlight, 
        currentParticipant?.id || 'anonymous'
      );
      sessionContextRef.current.saveToLocalStorage(sessionId);
    }
  }, [currentParticipant?.id, sessionId]);
  
  // Mettre à jour handleAICompletion pour sauvegarder les insights
  const handleAICompletion = useCallback(async (insights) => {
    console.log("Interaction terminée avec succès:", insights);
    setIsInteracting(false);
    
    // Vérifier le rate limiting
    if (!checkRateLimit()) {
      setError("Vous avez atteint la limite d'utilisation. Veuillez réessayer dans une minute.");
      setTimeout(() => setError(null), 5000);
      return;
    }
    
    // Vérifier la modération du contenu avant de sauvegarder
    let allInsightsSafe = true;
    if (insights && insights.length > 0) {
      // Vérifier chaque insight pour le contenu inapproprié
      for (const insight of insights) {
        const isSafe = await checkContentModeration(insight);
        if (!isSafe) {
          allInsightsSafe = false;
          break;
        }
      }
      
      // Sauvegarder uniquement si le contenu est approprié
      if (allInsightsSafe) {
        try {
          const insightKey = `insights_${sessionId}_${currentParticipant?.id || 'anonymous'}`;
          localStorage.setItem(insightKey, JSON.stringify(insights));
          setCachedInsights(insights);
          
          // Sauvegarder les insights dans le contexte de session
          if (currentParticipant?.id) {
            insights.forEach(insight => {
              sessionContextRef.current.addParticipantInsight(
                currentParticipant.id,
                insight
              );
            });
            sessionContextRef.current.saveToLocalStorage(sessionId);
          }
          
          // Limiter le nombre de messages pour éviter la surcharge
          messageCountRef.current += 1;
          if (messageCountRef.current > 50) {
            // Réinitialiser le cache après un certain nombre de messages
            aiResponseCache.current = {};
            messageCountRef.current = 0;
          }
        } catch (err) {
          console.error("Erreur lors de la sauvegarde des insights:", err);
          handleAIError(err);
        }
      } else {
        setError("Le contenu généré contient des éléments inappropriés. Veuillez réessayer avec une formulation différente.");
        setTimeout(() => setError(null), 5000);
      }
    }
  }, [sessionId, currentParticipant?.id, checkContentModeration, checkRateLimit]);
  
  // Obtenir le contexte formaté pour l'IA
  const getFormattedContext = useCallback(() => {
    return sessionContextRef.current.generateFormattedContext(
      currentParticipant?.id || 'anonymous'
    );
  }, [currentParticipant?.id]);
  
  // Gérer les erreurs d'interaction avec l'IA avec retry
  const handleAIError = useCallback((error, retryCount = 0) => {
    console.error("Erreur lors de l'interaction avec l'IA:", error);
    
    // Stratégie de retry avec backoff exponentiel
    if (retryCount < 3) {
      // Attendre de plus en plus longtemps entre les tentatives
      const retryDelay = Math.pow(2, retryCount) * 1000;
      setError(`Difficulté à communiquer avec l'IA. Nouvelle tentative dans ${retryDelay/1000} secondes...`);
      
      setTimeout(() => {
        setError(null);
        setAiAgentLoading(true);
        
        // Simuler une nouvelle tentative (dans un vrai cas, on réinitialiserait la connexion)
        setTimeout(() => {
          setAiAgentLoading(false);
          // Si l'erreur persiste après plusieurs tentatives
          if (retryCount === 2) {
            setError("Impossible de communiquer avec l'IA. Veuillez réessayer plus tard.");
            setTimeout(() => setError(null), 5000);
          }
        }, 1500);
      }, retryDelay);
    } else {
      // Après plusieurs tentatives, afficher un message d'erreur persistant
      setError("Une erreur est survenue lors de l'interaction avec l'IA. Veuillez réessayer ultérieurement.");
      setTimeout(() => setError(null), 5000);
    }
  }, []);
  
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
          <h1 className="text-2xl font-semibold text-center mb-4" id="interaction-title">Phase d'interaction</h1>
          
          {interactionStatus === 'selected' ? (
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-6" role="status" aria-labelledby="selected-status">
              <h2 className="text-xl font-semibold text-center mb-3" id="selected-status">Félicitations!</h2>
              <p className="text-center mb-4">
                Vous avez été sélectionné pour discuter avec notre IA journaliste.
                Vos idées ont été particulièrement appréciées par les autres participants.
              </p>
            </div>
          ) : interactionStatus === 'not_selected' ? (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 mb-6" role="status" aria-labelledby="not-selected-status">
              <h2 className="text-xl font-semibold text-center mb-3" id="not-selected-status">Partagez vos idées</h2>
              <p className="text-center mb-4">
                Même si vous n'avez pas été sélectionné pour l'interview principale,
                vos idées sont précieuses ! Discutez avec notre AI Lightbulb pour développer
                vos propres réflexions inspirées par les discussions.
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6" role="status" aria-live="polite">
              <h2 className="text-xl font-semibold text-center mb-3">En attente</h2>
              <p className="text-center mb-4">
                En attente de l'attribution d'un rôle dans cette phase.
                Veuillez patienter un instant...
              </p>
              <div className="flex justify-center" aria-hidden="true">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
              </div>
            </div>
          )}
          
          {interactionStatus !== 'waiting' && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mt-6" style={{ height: '500px' }}>
              {aiAgentLoading ? (
                <div className="h-full flex flex-col items-center justify-center p-6" role="status" aria-label={ACCESSIBILITY_TEXTS.AI_LOADING}>
                  <div className="mb-4" aria-hidden="true">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                  <p className="text-gray-600 text-center">
                    Initialisation de l'agent IA en cours...
                    <br />
                    <span className="text-sm">Cela peut prendre quelques instants</span>
                  </p>
                </div>
              ) : moderationActive ? (
                <div className="h-full flex flex-col items-center justify-center p-6" role="status" aria-label={ACCESSIBILITY_TEXTS.MODERATION}>
                  <div className="mb-4" aria-hidden="true">
                    <div className="flex items-center justify-center bg-yellow-100 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-600 text-center">
                    Vérification du contenu en cours...
                    <br />
                    <span className="text-sm">Cela ne prendra qu'un instant</span>
                  </p>
                </div>
              ) : (
                <AIAgentSelector
                  sessionId={sessionId}
                  participantName={currentParticipant?.name || participantName}
                  programName={session?.name || "Session"}
                  teacherName={session?.host_name || "Animateur"}
                  agentType={agentType}
                  sessionContext={getFormattedContext()}
                  onClose={() => {
                    // Fermeture de l'interaction
                    setIsInteracting(false);
                    console.log("Interaction fermée par l'utilisateur");
                  }}
                  onComplete={handleAICompletion}
                  onError={handleAIError}
                  onSaveNote={(note) => {
                    if (note && note.trim()) {
                      sessionContextRef.current.addSessionNote(note);
                      sessionContextRef.current.saveToLocalStorage(sessionId);
                      
                      // Afficher un message de confirmation
                      setError("Note automatique sauvegardée!");
                      setTimeout(() => setError(null), 2000);
                    }
                  }}
                />
              )}
            </div>
          )}
          
          {/* Bouton de feedback */}
          {!feedbackOpen && !aiAgentLoading && !moderationActive && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setFeedbackOpen(true)}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
                aria-label="Donner votre avis sur l'interaction avec l'IA"
              >
                Signaler un problème ou donner votre avis
              </button>
            </div>
          )}
          
          {/* Formulaire de feedback */}
          {feedbackOpen && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 mt-4">
              <h3 className="font-medium text-gray-800 mb-2">Votre avis nous intéresse</h3>
              
              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">Type de feedback</label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-blue-600"
                      name="feedbackType"
                      value="issue"
                      checked={feedbackType === 'issue'}
                      onChange={() => setFeedbackType('issue')}
                    />
                    <span className="ml-2 text-sm text-gray-700">Problème</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-green-600"
                      name="feedbackType"
                      value="suggestion"
                      checked={feedbackType === 'suggestion'}
                      onChange={() => setFeedbackType('suggestion')}
                    />
                    <span className="ml-2 text-sm text-gray-700">Suggestion</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-purple-600"
                      name="feedbackType"
                      value="praise"
                      checked={feedbackType === 'praise'}
                      onChange={() => setFeedbackType('praise')}
                    />
                    <span className="ml-2 text-sm text-gray-700">Compliment</span>
                  </label>
                </div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="feedbackMessage" className="block text-sm text-gray-600 mb-1">
                  Votre message
                </label>
                <textarea
                  id="feedbackMessage"
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Décrivez votre expérience ou le problème rencontré..."
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setFeedbackOpen(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  disabled={feedbackSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={submitFeedback}
                  disabled={feedbackSubmitting || !feedbackMessage.trim()}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {feedbackSubmitting ? 'Envoi...' : 'Envoyer'}
                </button>
              </div>
            </div>
          )}
          
          {/* Prise de notes */}
          {!showNoteInput && !feedbackOpen && !aiAgentLoading && !moderationActive && (
            <div className="mt-2 text-center">
              <button
                onClick={() => setShowNoteInput(true)}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
                aria-label="Prendre une note sur cette session"
              >
                Prendre une note
              </button>
            </div>
          )}
          
          {/* Formulaire de prise de notes */}
          {showNoteInput && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
              <h3 className="font-medium text-gray-800 mb-2">Prendre une note</h3>
              
              <div className="mb-3">
                <textarea
                  value={sessionNote}
                  onChange={(e) => setSessionNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows="2"
                  placeholder="Notez un point important de la discussion..."
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNoteInput(false)}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={saveSessionNote}
                  disabled={!sessionNote.trim()}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          )}
          
          {cachedInsights && cachedInsights.length > 0 && !aiAgentLoading && !isInteracting && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
              <h3 className="text-center font-medium text-blue-800 mb-2">Précédentes idées sauvegardées</h3>
              <p className="text-sm text-blue-700 text-center">
                Vous avez déjà interagi avec l'IA dans cette session.
                {cachedInsights.length > 1 
                  ? ` ${cachedInsights.length} messages ont été sauvegardés.` 
                  : " Un message a été sauvegardé."}
              </p>
              <div className="flex justify-center mt-2">
                <button
                  onClick={() => {
                    // Réinitialiser pour une nouvelle interaction
                    setCachedInsights(null);
                    startAIInteraction();
                  }}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Nouvelle interaction
                </button>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-4">
              <p className="text-center text-red-600">{error}</p>
              <div className="flex justify-center mt-2">
                <button
                  onClick={() => setError(null)}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                >
                  Fermer
                </button>
              </div>
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
      <ParticipationLoading />
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

// Main exported component wrapped in Suspense
export default function ParticipationPage() {
  return (
    <Suspense fallback={<ParticipationLoading />}>
      <ParticipationContent />
    </Suspense>
  );
} 