"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import DotPattern from "@/components/ui/DotPattern";
import Image from "next/image";

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
          
        if (sessionError) throw sessionError;
        
        if (!sessionData) {
          throw new Error("Session introuvable");
        }
        
        setSession(sessionData);
        
        // Charger les participants actuels
        const { data: participantsData, error: participantsError } = await supabase
          .from("participants")
          .select("*")
          .eq("session_id", sessionId);
          
        if (participantsError) throw participantsError;
        setParticipants(participantsData || []);
        
      } catch (err) {
        console.error("Erreur lors du chargement de la session:", err);
        setError("Impossible de charger cette session. Elle n'existe peut-être plus.");
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
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(participantsSubscription);
    };
  }, [sessionId, displayName]);
  
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
            is_anonymous: true
          }
        ])
        .select();
        
      if (error) throw error;
      
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
  
  if (joiningComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 relative">
        <DotPattern className="absolute inset-0 z-0" />
        <div className="z-10 p-8 bg-white rounded-lg shadow-md max-w-md w-full">
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
              Votre hôte va démarrer la session très bientôt. Gardez cette page ouverte !
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 w-full">
              <p className="text-sm text-center text-gray-600 mb-2">
                Participants connectés: <span className="font-semibold">{participants.length} / {session.max_participants || 30}</span>
              </p>
            </div>
          </div>
          <div className="mt-4 border-t pt-4 text-center">
            <span className="text-sm text-gray-500">Code de session: <span className="font-mono font-bold text-primary">{session.session_code}</span></span>
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">Clipboard by ConnectedMate</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 relative">
      <DotPattern className="absolute inset-0 z-0" />
      <div className="z-10 p-8 bg-white rounded-lg shadow-md max-w-md w-full">
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
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:bg-gray-400"
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
      </div>
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">Clipboard by ConnectedMate</p>
      </div>
    </div>
  );
} 