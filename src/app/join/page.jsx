"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import DotPattern from '@/components/ui/DotPattern';

// Simple inline logo component
const SimpleLogo = ({ light = false }) => (
  <div className={`font-bold text-xl ${light ? 'text-white' : 'text-primary'}`}>
    CM
  </div>
);

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <div className="relative mb-4 h-16 w-16">
        <SimpleLogo />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-t-4 border-primary border-solid rounded-full animate-spin"></div>
        </div>
      </div>
      <p className="text-gray-600">Loading session...</p>
    </div>
  );
}

// Main content component
function JoinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // supabase is imported above
  
  // State variables
  const [sessionCode, setSessionCode] = useState(searchParams.get("code") || "");
  const [participantName, setParticipantName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [step, setStep] = useState(1); // 1: Enter code, 2: Enter profile info
  const [showDebug, setShowDebug] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const [currentParticipantsCount, setCurrentParticipantsCount] = useState(0);
  
  // États additionnels pour le mode Fully Anonymous
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [anonymousId, setAnonymousId] = useState("");
  
  // Fonction pour générer l'ID anonyme au format "Xy-DD/MM"
  const generateAnonymousIdentifier = () => {
    if (!lastName || !firstName || !birthDay || !birthMonth) return "";
    
    // Obtenir la première lettre du nom de famille
    const firstLetterLastName = lastName.charAt(0).toUpperCase();
    
    // Obtenir la deuxième lettre du prénom (si disponible)
    const secondLetterFirstName = firstName.length > 1 ? firstName.charAt(1).toLowerCase() : "";
    
    // Formater le jour et le mois avec des zéros si nécessaire
    const formattedDay = birthDay.padStart(2, '0');
    const formattedMonth = birthMonth.padStart(2, '0');
    
    // Générer l'identifiant au format spécifié
    return `${firstLetterLastName}${secondLetterFirstName}-${formattedDay}/${formattedMonth}`;
  };
  
  // Get auth status for debugging
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // Update debug info
        setDebugInfo(prev => ({
          ...prev,
          authStatus: session ? 'Authenticated' : 'Unauthenticated',
          authError: error ? error.message : null,
          timestamp: new Date().toISOString()
        }));
      } catch (err) {
        console.error("Error checking auth status:", err);
        setDebugInfo(prev => ({
          ...prev,
          authStatus: 'Error checking auth',
          authError: err.message,
          timestamp: new Date().toISOString()
        }));
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Verify the session code
  const verifySessionCode = async (e) => {
    e?.preventDefault();
    if (!sessionCode.trim()) {
      setError("Veuillez entrer un code de session");
      return;
    }
    
    setIsVerifyingCode(true);
    setError(null);
    
    try {
      // Normalize the input code to uppercase and trim whitespace
      const normalizedCode = sessionCode.trim().toUpperCase();
      console.log(`Recherche de session avec code: ${normalizedCode}`);
      
      // Check for rate limiting (prevent abuse)
      const now = new Date().getTime();
      const lastAttemptTime = localStorage.getItem('lastJoinAttempt');
      
      if (lastAttemptTime && (now - parseInt(lastAttemptTime)) < 1000) {
        // Rate limiting - attempt within 1 second
        setError("Veuillez patienter avant de réessayer");
        setIsVerifyingCode(false);
        return;
      }
      
      // Store this attempt time
      localStorage.setItem('lastJoinAttempt', now.toString());
      
      // SIMPLIFIED: Optimized single query to find a matching session
      // Use OR to check both code and session_code in a single query
      const { data: matchingSessions, error: queryError } = await supabase
        .from("sessions")
        .select("id, name, title, code, session_code, status, settings")
        .or(`code.eq.${normalizedCode},session_code.eq.${normalizedCode}`)
        .limit(2); // Limit to 2 to check if multiple sessions match (shouldn't happen)
        
      if (queryError) {
        console.error("Erreur lors de la recherche de session:", queryError);
        setError(`Erreur lors de la vérification: ${queryError.message}`);
        setIsVerifyingCode(false);
        return;
      }
      
      console.log("Sessions correspondantes:", matchingSessions);
      
      // Process results
      if (!matchingSessions || matchingSessions.length === 0) {
        // No matching session found
        setError("Code de session invalide. Veuillez vérifier et réessayer.");
        setDebugInfo(prev => ({
          ...prev,
          noSessionFound: true,
          searchedCode: normalizedCode,
          lastQueryTime: new Date().toISOString(),
          // Ne pas exposer d'informations en production
          availableSessions: process.env.NODE_ENV === 'development' ? [] : []
        }));
        
        setIsVerifyingCode(false);
        return;
      }
      
      // Check if we have a unique active match
      const activeSession = matchingSessions.find(s => s.status === 'active');
      const inactiveSession = !activeSession ? matchingSessions[0] : null;
      
      if (activeSession) {
        // Success! Found an active matching session
        setSessionData(activeSession);
        setStep(2);
        setDebugInfo(prev => ({
          ...prev,
          foundSession: true,
          sessionId: activeSession.id,
          matchedCode: normalizedCode,
          lastQueryTime: new Date().toISOString()
        }));
        
        // Store session ID in sessionStorage to prevent multiple join attempts
        sessionStorage.setItem('last_joined_session', activeSession.id);
        
      } else if (inactiveSession) {
        // Session exists but is not active
        setError(`Session trouvée mais elle n'est pas active (statut: ${inactiveSession.status || 'inconnu'}). Veuillez contacter l'organisateur.`);
        setDebugInfo(prev => ({
          ...prev,
          sessionExists: true,
          sessionNotActive: true,
          sessionStatus: inactiveSession.status,
          lastQueryTime: new Date().toISOString()
        }));
      } else {
        // Should never happen with the query above
        setError("Code de session invalide. Veuillez vérifier et réessayer.");
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du code de session:", error);
      setError(`Une erreur est survenue: ${error.message}. Veuillez réessayer.`);
      setDebugInfo(prev => ({
        ...prev,
        error: error.message,
        lastQueryTime: new Date().toISOString()
      }));
    } finally {
      setIsVerifyingCode(false);
    }
  };
  
  // Effect to auto-verify code if provided in URL
  useEffect(() => {
    const codeFromUrl = searchParams.get("code");
    if (codeFromUrl) {
      setSessionCode(codeFromUrl);
      verifySessionCode();
    }
  }, []);
  
  // Effect to fetch participant count when session data is available
  useEffect(() => {
    const fetchParticipantCount = async () => {
      if (sessionData?.id) {
        try {
          const { count, error } = await supabase
            .from("session_participants")
            .select("*", { count: "exact", head: true })
            .eq("session_id", sessionData.id)
            .is("deleted_at", null);
            
          if (error) {
            console.error("Error fetching participant count:", error);
          } else {
            console.log(`Current participant count: ${count}`);
            setCurrentParticipantsCount(count || 0);
          }
        } catch (err) {
          console.error("Exception fetching participant count:", err);
        }
      }
    };
    
    fetchParticipantCount();
  }, [sessionData?.id, supabase]);
  
  // Effect to update anonymous ID when form fields change
  useEffect(() => {
    if (sessionData?.settings?.connection?.anonymityLevel === "fully_anonymous" || 
        sessionData?.settings?.connection?.anonymityLevel === "fully-anonymous") {
      const generatedId = generateAnonymousIdentifier();
      setAnonymousId(generatedId);
    }
  }, [firstName, lastName, birthDay, birthMonth, sessionData]);
  
  // Join the session
  const joinSession = async (e) => {
    e.preventDefault();
    
    // Get anonymity level from session data
    const anonymityLevel = sessionData?.settings?.connection?.anonymityLevel || "anonymous";
    console.log("Niveau d'anonymat de la session:", anonymityLevel);
    
    const isFullyAnonymous = anonymityLevel === "fully_anonymous" || 
                            anonymityLevel === "fully-anonymous";
    const isSemiAnonymous = anonymityLevel === "semi_anonymous" || 
                           anonymityLevel === "semi-anonymous";
    const isNotAnonymous = anonymityLevel === "not_anonymous" || 
                           anonymityLevel === "non-anonymous";
    
    // Validation based on anonymity level
    if (isFullyAnonymous) {
      if (!anonymousId) {
        setError("Veuillez remplir tous les champs pour générer votre identifiant");
        return;
      }
      
      // Set participant name to the generated anonymous ID
      setParticipantName(anonymousId);
    } else {
      if (!participantName.trim()) {
        setError("Veuillez entrer votre nom");
        return;
      }
    }
    
    if (isSemiAnonymous || isNotAnonymous) {
      if (!email.trim()) {
        setError("Veuillez entrer votre email");
        return;
      }
      
      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError("Veuillez entrer une adresse email valide");
        return;
      }
    }
    
    if (isNotAnonymous) {
      if (!organization.trim()) {
        setError("Veuillez entrer votre organisation");
        return;
      }
      
      if (!role.trim()) {
        setError("Veuillez entrer votre rôle");
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Verify session data exists
      if (!sessionData || !sessionData.id) {
        throw new Error("Les données de session sont manquantes ou invalides");
      }
      
      console.log("Données de session disponibles:", {
        id: sessionData.id,
        title: sessionData.title,
        name: sessionData.name,
        status: sessionData.status
      });
      
      // Prevent rejoining the same session (check if we have already joined this session)
      const existingParticipation = localStorage.getItem(`participant_${sessionData.id}`);
      if (existingParticipation) {
        try {
          const parsed = JSON.parse(existingParticipation);
          if (parsed.id) {
            console.log("Vous avez déjà rejoint cette session, redirection...");
            const token = parsed.anonymousToken ? 
              encodeURIComponent(parsed.anonymousToken) : '';
              
            const redirectUrl = `/sessions/${sessionData.id}/participate?participantId=${parsed.id}${token ? `&token=${token}` : ''}`;
            router.push(redirectUrl);
            return;
          }
        } catch (e) {
          console.warn("Erreur lors de la vérification de participation existante:", e);
          // Continue with normal flow if there's an error parsing the saved data
        }
      }
      
      // Check max participants
      const maxParticipants = sessionData?.max_participants || 
                             sessionData?.settings?.maxParticipants || 
                             sessionData?.settings?.connection?.maxParticipants || 
                             30;
                              
      console.log(`Vérification du nombre de participants: ${currentParticipantsCount} vs max: ${maxParticipants}`);
      
      if (currentParticipantsCount >= maxParticipants) {
        setError(`Cette session est complète (maximum ${maxParticipants} participants)`);
        setLoading(false);
        return;
      }
      
      // Generate a unique anonymous ID
      const anonymousId = isFullyAnonymous 
        ? anonymousId // Utiliser l'ID généré avec le format Cl-16/12
        : `${participantName.slice(0, 2).toUpperCase()}${Math.floor(Math.random() * 10000)}`;
      
      // Determine participant fields based on anonymity level
      const participantData = {
        session_id: sessionData.id,
        nickname: isFullyAnonymous ? anonymousId : participantName,
        display_name: isFullyAnonymous ? anonymousId : participantName,
        full_name: isFullyAnonymous ? anonymousId : participantName,
        anonymous: isFullyAnonymous || isSemiAnonymous,
        anonymous_identifier: anonymousId
      };
      
      // Pour le mode Fully Anonymous, stocker les informations originales de manière sécurisée
      if (isFullyAnonymous) {
        participantData.secure_data = {
          original_info: {
            first_letter_lastname: lastName.charAt(0).toUpperCase(),
            second_letter_firstname: firstName.length > 1 ? firstName.charAt(1).toLowerCase() : "",
            birth_day: birthDay.padStart(2, '0'),
            birth_month: birthMonth.padStart(2, '0')
          }
        };
        
        // Ne pas stocker les informations complètes
        participantData.first_name = null;
        participantData.last_name = null;
      }
      
      // Add additional fields for semi-anonymous and not-anonymous levels
      if (isSemiAnonymous || isNotAnonymous) {
        participantData.email = email;
      }
      
      // Store additional fields in links JSON if needed
      if (isNotAnonymous) {
        participantData.links = {
          organization: organization,
          role: role
        };
      }
      
      // Generate a random color and emoji for the participant if not provided
      if (!participantData.color) {
        // Utiliser les couleurs spécifiées
        const colors = ['#98DAFF', '#A4F7A7', '#EAAEFF', '#FF6641', '#FED132'];
        participantData.color = colors[Math.floor(Math.random() * colors.length)];
      }
      
      if (!participantData.emoji) {
        // Sélection d'emojis plus corporate
        const emojis = ['👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓', '🧑‍💻', '👨‍💻', '👩‍💻', '📊', '📈', '💡', '🔍', '🎯'];
        participantData.emoji = emojis[Math.floor(Math.random() * emojis.length)];
      }
      
      // Set joined_at timestamp
      participantData.joined_at = new Date().toISOString();
      
      // Generate a secure anonymous token
      const secureToken = btoa(`${sessionData.id}:${anonymousId}:${Date.now()}`);
      participantData.anonymous_token = secureToken;
      
      // Capture l'adresse IP du client si possible
      try {
        // Note: This will only capture public IP in a server environment
        const headers = req?.headers || {};
        let ipAddress = headers["x-real-ip"];
        
        const forwardedFor = headers["x-forwarded-for"];
        if (!ipAddress && forwardedFor) {
          ipAddress = forwardedFor?.split(",").at(0);
        }
        
        if (ipAddress) {
          participantData.ip_address = ipAddress;
        }
      } catch (err) {
        console.warn("Impossible de capturer l'adresse IP:", err);
      }
      
      // Ajouter des informations sur le navigateur et l'appareil
      try {
        const userAgent = req?.headers?.["user-agent"] || navigator.userAgent;
        if (userAgent) {
          if (!participantData.device_info) {
            participantData.device_info = {};
          }
          participantData.device_info.user_agent = userAgent;
          
          // Add simple device detection
          const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);
          participantData.device_info.device_type = isMobile ? 'mobile' : 'desktop';
        }
      } catch (err) {
        console.warn("Impossible de capturer les informations d'appareil:", err);
      }
      
      console.log("Création du participant avec les données:", JSON.stringify(participantData, null, 2));
      
      // Add debug info for troubleshooting
      setDebugInfo(prev => ({
        ...prev,
        joinAttempt: {
          participantData,
          anonymityLevel,
          sessionId: sessionData.id,
          maxParticipants: maxParticipants,
          currentCount: currentParticipantsCount,
          timestamp: new Date().toISOString()
        }
      }));
      
      // Create participant in session_participants table
      console.log("Tentative d'insertion du participant...");
      const insertResult = await supabase
        .from("session_participants")
        .insert([participantData])
        .select('*');
        
      const { data: participant, error: participantError } = insertResult;
      
      console.log("Résultat de l'insertion:", insertResult);
      
      if (participantError) {
        console.error("Erreur lors de la création du participant:", participantError);
        
        if (participantError.code === 'PGRST301') {
          setError("Erreur d'authentification. La base de données peut nécessiter une authentification pour la création de participants.");
        } else if (participantError.code === '23503') {
          setError("Violation de clé étrangère. La session n'est peut-être plus valide.");
        } else if (participantError.code === '23505') {
          setError("Un participant avec ces informations existe déjà.");
          
          // Try to find the existing participant and redirect
          try {
            const { data: existingParticipant } = await supabase
              .from("session_participants")
              .select("id, anonymous_token")
              .eq("session_id", sessionData.id)
              .eq("nickname", participantName)
              .eq("email", email || '')
              .limit(1);
              
            if (existingParticipant && existingParticipant.length > 0) {
              // Save participant info to localStorage
              const participantInfo = {
                id: existingParticipant[0].id,
                name: participantName,
                sessionId: sessionData.id,
                anonymousToken: existingParticipant[0].anonymous_token || null,
                rejoined: true
              };
              
              localStorage.setItem(`participant_${sessionData.id}`, JSON.stringify(participantInfo));
              
              // Redirect to participate page with existing participant's info
              const token = existingParticipant[0].anonymous_token ? 
                encodeURIComponent(existingParticipant[0].anonymous_token) : '';
                
              router.push(`/sessions/${sessionData.id}/participate?participantId=${existingParticipant[0].id}${token ? `&token=${token}` : ''}`);
              return;
            }
          } catch (e) {
            console.error("Erreur lors de la récupération du participant existant:", e);
          }
        } else {
          setError(`Impossible de rejoindre la session: ${participantError.message || JSON.stringify(participantError)}`);
        }
        
        // Update debug info with error
        setDebugInfo(prev => ({
          ...prev,
          insertError: participantError,
          insertErrorTime: new Date().toISOString()
        }));
        
        setLoading(false);
        return;
      }
      
      // Check if we got the participant data back from the insert
      if (!participant || participant.length === 0) {
        console.log("Aucune donnée de participant retournée, recherche en cours...");
        
        // Query to get the created participant
        console.log("Recherche du participant créé...");
        const { data: createdParticipant, error: fetchError } = await supabase
          .from("session_participants")
          .select("*")
          .eq("session_id", sessionData.id)
          .eq("display_name", participantName)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(1);
          
        console.log("Résultat de la recherche du participant:", { createdParticipant, fetchError });
        
        if (fetchError) {
          console.error("Erreur lors de la récupération du participant:", fetchError);
          setError("Le participant a été créé mais n'a pas pu être récupéré. Veuillez réessayer.");
          setLoading(false);
          return;
        }
        
        if (!createdParticipant || createdParticipant.length === 0) {
          setError("Impossible de récupérer les informations du participant");
          setLoading(false);
          return;
        }
        
        // Safely access participant data
        var participantRecord = createdParticipant[0];
      } else {
        console.log("Données du participant retournées directement:", participant);
        var participantRecord = participant[0];
      }
      
      // Save participant info to localStorage with expiration
      const participantInfo = {
        id: participantRecord.id,
        name: participantName,
        sessionId: sessionData.id,
        anonymousToken: participantRecord.anonymous_token || null,
        timestamp: Date.now(),
        expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days expiration
      };
      
      try {
        localStorage.setItem(`participant_${sessionData.id}`, JSON.stringify(participantInfo));
        console.log("Informations du participant sauvegardées dans localStorage");
        
        // Also store in sessionStorage for immediate session checks
        sessionStorage.setItem(`participant_${sessionData.id}`, JSON.stringify({
          id: participantRecord.id,
          joined: Date.now()
        }));
      } catch (e) {
        console.warn("Impossible de sauvegarder les informations du participant dans localStorage:", e);
      }
      
      // Check if we have a valid ID before redirecting
      if (!participantRecord.id) {
        setError("L'identifiant du participant est manquant. Veuillez réessayer.");
        setLoading(false);
        
        setDebugInfo(prev => ({
          ...prev,
          participantRecordError: "ID manquant",
          participantRecord: JSON.stringify(participantRecord)
        }));
        return;
      }
      
      // Redirect to participate page with correct parameters
      console.log("Session rejointe avec succès, redirection vers la page de participation");
      console.log("Paramètres de redirection:", {
        sessionId: sessionData.id,
        participantId: participantRecord.id,
        token: participantRecord.anonymous_token || ''
      });
      
      const token = participantRecord.anonymous_token ? 
        encodeURIComponent(participantRecord.anonymous_token) : '';
        
      const redirectUrl = `/sessions/${sessionData.id}/participate?participantId=${participantRecord.id}${token ? `&token=${token}` : ''}`;
      console.log("URL de redirection:", redirectUrl);
      
      // Store last activity timestamp
      try {
        localStorage.setItem('last_session_activity', JSON.stringify({
          sessionId: sessionData.id,
          participantId: participantRecord.id,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.warn("Impossible de sauvegarder l'horodatage d'activité:", e);
      }
      
      router.push(redirectUrl);
    } catch (error) {
      console.error("Exception dans joinSession:", error);
      setError(`Une erreur inattendue s'est produite: ${error.message || JSON.stringify(error)}`);
      
      // Update debug info with exception
      setDebugInfo(prev => ({
        ...prev,
        joinSessionException: {
          message: error.message,
          stack: error.stack,
          time: new Date().toISOString()
        }
      }));
      
      setLoading(false);
    }
  };
  
  // Render based on current step
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50 p-4">
      <DotPattern className="absolute inset-0 z-0" />
      
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-center bg-primary p-6">
          <SimpleLogo light />
          {step === 2 && sessionData && (
            <div className="ml-4 pl-4 border-l border-white/30">
              <h2 className="text-white text-sm font-medium">{sessionData.title || sessionData.name}</h2>
            </div>
          )}
        </div>
        
        <div className="p-6">
          {step === 1 ? (
            // Step 1: Enter session code
            <>
              <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">
                Rejoindre une session
              </h1>
              
              <p className="mb-6 text-center text-gray-600">
                Entrez le code de session fourni par votre instructeur
              </p>
              
              <form onSubmit={verifySessionCode} className="space-y-4">
                <div>
                  <label htmlFor="sessionCode" className="block text-sm font-medium text-gray-700">
                    Code de session
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      id="sessionCode"
                      type="text"
                      value={sessionCode}
                      onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="Entrez le code de session"
                      required
                      autoComplete="off"
                      autoCapitalize="characters"
                      autoFocus
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Le code est généralement un code à 6 caractères (ex: ABC123)
                  </p>
                </div>
                
                {error && (
                  <div className="rounded-md bg-red-50 p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                <button
                  type="submit"
                  disabled={isVerifyingCode || !sessionCode.trim()}
                  className="w-full rounded-md bg-primary px-4 py-2 text-center text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                >
                  {isVerifyingCode ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Vérification...
                    </span>
                  ) : "Continuer"}
                </button>
              </form>
            </>
          ) : (
            // Step 2: Enter participant info
            <>
              <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">
                Finaliser l'inscription
              </h1>
              
              {sessionData && (
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-semibold">{sessionData.title || sessionData.name}</h2>
                  <p className="text-gray-600">
                    Organisé par {sessionData.settings?.professorName || 'Instructeur'}
                  </p>
                  
                  {/* Afficher le nombre actuel de participants */}
                  <div className="mt-2 text-sm">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {currentParticipantsCount} / {sessionData.max_participants || sessionData.settings?.maxParticipants || 30} participants
                    </span>
                  </div>
                </div>
              )}
              
              <form onSubmit={joinSession} className="space-y-4">
                {/* Formulaire pour mode Fully Anonymous */}
                {(sessionData?.settings?.connection?.anonymityLevel === "fully_anonymous" || 
                  sessionData?.settings?.connection?.anonymityLevel === "fully-anonymous") ? (
                  <>
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
                      <h3 className="text-sm font-medium text-gray-700">Mode Anonyme Complet</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Vos informations seront utilisées pour générer un identifiant unique anonyme qui ne pourra pas être 
                        relié à votre identité réelle.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                          Nom de famille *
                        </label>
                        <input
                          id="lastName"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          placeholder="Votre nom de famille"
                          required
                          autoFocus
                        />
                      </div>
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                          Prénom *
                        </label>
                        <input
                          id="firstName"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          placeholder="Votre prénom"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="birthDay" className="block text-sm font-medium text-gray-700">
                          Jour de naissance *
                        </label>
                        <input
                          id="birthDay"
                          type="text"
                          value={birthDay}
                          onChange={(e) => setBirthDay(e.target.value.replace(/[^0-9]/g, '').substring(0, 2))}
                          pattern="[0-9]{1,2}"
                          inputMode="numeric"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          placeholder="JJ"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="birthMonth" className="block text-sm font-medium text-gray-700">
                          Mois de naissance *
                        </label>
                        <input
                          id="birthMonth"
                          type="text"
                          value={birthMonth}
                          onChange={(e) => setBirthMonth(e.target.value.replace(/[^0-9]/g, '').substring(0, 2))}
                          pattern="[0-9]{1,2}"
                          inputMode="numeric"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                          placeholder="MM"
                          required
                        />
                      </div>
                    </div>
                    
                    {anonymousId && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
                        <p className="text-sm font-medium text-blue-700">Votre identifiant anonyme :</p>
                        <p className="text-lg font-mono font-bold text-blue-800 text-center py-2">{anonymousId}</p>
                        <p className="text-xs text-blue-600">
                          Cet identifiant est généré à partir de vos informations et sera utilisé pendant la session.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div>
                    <label htmlFor="participantName" className="block text-sm font-medium text-gray-700">
                      Votre nom *
                    </label>
                    <input
                      id="participantName"
                      type="text"
                      value={participantName}
                      onChange={(e) => setParticipantName(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="Entrez votre nom"
                      required
                      autoFocus
                    />
                  </div>
                )}
                
                {/* Show email field for semi-anonymous and not-anonymous sessions */}
                {(sessionData?.settings?.connection?.anonymityLevel === "semi_anonymous" || 
                  sessionData?.settings?.connection?.anonymityLevel === "semi-anonymous" ||
                  sessionData?.settings?.connection?.anonymityLevel === "not_anonymous" || 
                  sessionData?.settings?.connection?.anonymityLevel === "non-anonymous") && (
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Adresse email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="Entrez votre email"
                      required
                    />
                  </div>
                )}
                
                {/* Show organization and role fields for not-anonymous sessions */}
                {(sessionData?.settings?.connection?.anonymityLevel === "not_anonymous" || 
                  sessionData?.settings?.connection?.anonymityLevel === "non-anonymous") && (
                  <>
                    <div>
                      <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                        Organisation *
                      </label>
                      <input
                        id="organization"
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="Entrez votre organisation"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                        Rôle *
                      </label>
                      <input
                        id="role"
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="Entrez votre rôle"
                        required
                      />
                    </div>
                  </>
                )}
                
                {error && (
                  <div className="rounded-md bg-red-50 p-3">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Retour
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-md bg-primary px-4 py-2 text-center text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Inscription...
                      </span>
                    ) : "Rejoindre la session"}
                  </button>
                </div>
                
                {/* Notice de confidentialité */}
                <p className="text-xs text-gray-500 mt-4">
                  En rejoignant cette session, vous acceptez que vos informations soient utilisées uniquement 
                  dans le cadre de cette session et conformément à la politique de confidentialité.
                </p>
              </form>
            </>
          )}
        </div>
        
        {/* Debug toggle button - only in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowDebug(!showDebug)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              {showDebug ? "Masquer les infos de débogage" : "Afficher les infos de débogage"}
            </button>
          </div>
        )}
        
        {/* Debug information panel */}
        {showDebug && (
          <div className="mt-2 rounded-md bg-gray-50 p-3 text-xs font-mono">
            <div className="mb-2 text-gray-500">Informations de débogage:</div>
            <pre className="whitespace-pre-wrap text-gray-600">
              {JSON.stringify(
                {
                  ...debugInfo,
                  currentStep: step,
                  sessionCode: sessionCode,
                  sessionCodeLength: sessionCode?.length,
                  hasSessionData: !!sessionData,
                  usingSupabaseSingleton: true,
                  error: error,
                  browser: navigator.userAgent,
                  timestamp: new Date().toISOString()
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">
        Besoin d'aide? Contactez l'organisateur de votre session
      </div>
    </div>
  );
}

// Main page component with Suspense
module.exports = function JoinPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <JoinContent />
    </Suspense>
  );
} 