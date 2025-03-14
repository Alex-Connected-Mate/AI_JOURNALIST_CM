"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase/client";
import DotPattern from "@/components/ui/DotPattern";

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
  const supabase = getSupabaseClient();
  
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
      setError("Please enter a session code");
      return;
    }
    
    setIsVerifyingCode(true);
    setError(null);
    
    try {
      const normalizedCode = sessionCode.trim().toUpperCase();
      console.log(`Searching for session with normalized code: ${normalizedCode}`);
      
      // Get all active sessions to help with debugging and to show available codes
      const { data: allActiveSessions, error: activeSessionsError } = await supabase
        .from("sessions")
        .select("id, name, code, session_code, title, status")
        .eq("status", "active");
        
      console.log("All active sessions:", allActiveSessions);
      
      if (activeSessionsError) {
        console.error("Error fetching active sessions:", activeSessionsError);
      }
      
      // First, check if the session exists at all (without status filter)
      // This helps distinguish between "not found" and "not active" errors
      const { data: sessionExists, error: existsError } = await supabase
        .from("sessions")
        .select("id, status, session_code, code")
        .or(`session_code.eq."${normalizedCode}",code.eq."${normalizedCode}"`)
        .limit(1);
      
      console.log("Session existence check:", { sessionExists, error: existsError });
      
      if (existsError) {
        console.error("Error checking if session exists:", existsError);
      } else if (sessionExists && sessionExists.length > 0) {
        // Session exists, but might not be active
        if (sessionExists[0].status !== 'active') {
          setError(`Session found but it's not active (status: ${sessionExists[0].status || 'unknown'}). Please contact the session organizer.`);
          setIsVerifyingCode(false);
          
          // Update debug info
          setDebugInfo(prev => ({
            ...prev,
            sessionExists: true,
            sessionStatus: sessionExists[0].status,
            sessionId: sessionExists[0].id,
            errorReason: 'inactive_session',
            lastQueryTime: new Date().toISOString(),
            availableSessions: allActiveSessions?.map(s => ({
              id: s.id.substring(0, 8),
              name: s.name,
              code: s.code,
              session_code: s.session_code
            })) || []
          }));
          return;
        }
      }
      
      // First attempt: Use filter syntax with quotes for string values
      const { data: sessions, error: sessionError } = await supabase
        .from("sessions")
        .select("id, title, name, status, settings, max_participants, session_code, code")
        .or(`session_code.eq."${normalizedCode}",code.eq."${normalizedCode}"`)
        .eq("status", "active")
        .limit(1);
      
      console.log("Session search result:", { sessions, error: sessionError });
      
      if (sessionError) {
        console.error("Error fetching session:", sessionError);
        if (sessionError.code === 'PGRST301') {
          setError(`Authentication error: ${sessionError.message}. This may be due to RLS policies.`);
        } else {
          setError(`Error fetching session: ${sessionError.message}`);
        }
        setIsVerifyingCode(false);
        
        // Update debug info with error details
        setDebugInfo(prev => ({
          ...prev,
          lastQueryError: sessionError,
          lastQueryTime: new Date().toISOString(),
          availableSessions: allActiveSessions?.map(s => ({
            id: s.id.substring(0, 8),
            name: s.name,
            code: s.code,
            session_code: s.session_code
          })) || []
        }));
        return;
      }
      
      if (!sessions || sessions.length === 0) {
        // Try alternative query formats as fallbacks
        console.log("No sessions found with first query format, trying alternative");
        
        // Try without quotes
        const { data: altSessions, error: altError } = await supabase
          .from("sessions")
          .select("id, title, name, status, settings, max_participants, session_code, code")
          .or(`session_code.eq.${normalizedCode},code.eq.${normalizedCode}`)
          .eq("status", "active")
          .limit(1);
          
        console.log("Alternative search result:", { altSessions, error: altError });
        
        if (altError) {
          console.error("Error in alternative fetch:", altError);
        }
        
        if (!altSessions || altSessions.length === 0) {
          // Try with .in() filter instead of .or()
          console.log("Trying with .in() filter method");
          
          const { data: inSessions, error: inError } = await supabase
            .from("sessions")
            .select("id, title, name, status, settings, max_participants, session_code, code")
            .in("session_code", [normalizedCode])
            .eq("status", "active")
            .limit(1);
            
          console.log("In filter search result:", { inSessions, error: inError });
          
          if (inError) {
            console.error("Error in .in() filter query:", inError);
          }
          
          if (!inSessions || inSessions.length === 0) {
            // Try case-insensitive search using ilike
            console.log("Trying case-insensitive search with ilike");
            
            const { data: ilikeSessions, error: ilikeError } = await supabase
              .from("sessions")
              .select("id, title, name, status, settings, max_participants, session_code, code")
              .or(`session_code.ilike.${normalizedCode},code.ilike.${normalizedCode}`)
              .eq("status", "active")
              .limit(1);
              
            console.log("Case-insensitive search result:", { ilikeSessions, error: ilikeError });
            
            if (ilikeError) {
              console.error("Error in case-insensitive search:", ilikeError);
            }
            
            if (!ilikeSessions || ilikeSessions.length === 0) {
              // Last attempt - try exact match with .eq
              console.log("Trying exact match with .eq filter");
              
              const { data: exactSessions, error: exactError } = await supabase
                .from("sessions")
                .select("id, title, name, status, settings, max_participants, session_code, code")
                .eq("session_code", normalizedCode)
                .eq("status", "active")
                .limit(1);
                
              console.log("Exact match search result:", { exactSessions, error: exactError });
              
              if (exactError) {
                console.error("Error in exact match query:", exactError);
              }
              
              if (!exactSessions || exactSessions.length === 0) {
                // If session exists check found something but active queries found nothing
                if (sessionExists && sessionExists.length > 0) {
                  setError(`Session found but cannot be joined (status: ${sessionExists[0].status || 'unknown'}). Please contact the session organizer.`);
                } else {
                  // Prepare a better error message with available session codes
                  let errorMsg = "No session found with this code. Please check and try again.";
                  
                  // If we have other active sessions, suggest them
                  if (allActiveSessions && allActiveSessions.length > 0) {
                    const availableCodes = allActiveSessions
                      .filter(s => s.status === 'active')
                      .map(s => {
                        // Use both codes if available
                        const codes = [];
                        if (s.code) codes.push(s.code);
                        if (s.session_code && s.session_code !== s.code) codes.push(s.session_code);
                        return { name: s.name || s.title, codes };
                      });
                      
                    if (availableCodes.length > 0) {
                      errorMsg += " Available sessions:";
                      availableCodes.forEach(s => {
                        if (s.codes.length > 0) {
                          errorMsg += ` "${s.name}" (${s.codes.join(', ')})`;
                        }
                      });
                    }
                  }
                  
                  setError(errorMsg);
                }
                
                setIsVerifyingCode(false);
                
                // Update debug info with all search attempts
                setDebugInfo(prev => ({
                  ...prev,
                  searchAttempts: 5, // Now 5 with the case-insensitive search
                  normalizedCode,
                  queriesSuccessful: true,
                  noSessionsFound: !(sessionExists && sessionExists.length > 0),
                  sessionExistsButInactive: sessionExists && sessionExists.length > 0,
                  sessionStatus: sessionExists && sessionExists.length > 0 ? sessionExists[0].status : null,
                  availableSessions: allActiveSessions?.map(s => ({
                    id: s.id.substring(0, 8),
                    name: s.name || s.title,
                    code: s.code,
                    session_code: s.session_code,
                    status: s.status
                  })) || [],
                  lastQueryTime: new Date().toISOString()
                }));
                return;
              }
              
              // Session found with exact match
              setSessionData(exactSessions[0]);
              setStep(2);
              setIsVerifyingCode(false);
              
              // Update debug info with success
              setDebugInfo(prev => ({
                ...prev,
                foundSession: true,
                searchMethod: "exact_match",
                sessionId: exactSessions[0].id,
                lastQueryTime: new Date().toISOString()
              }));
              return;
            }
            
            // Session found with case-insensitive search
            setSessionData(ilikeSessions[0]);
            setStep(2);
            setIsVerifyingCode(false);
            
            // Update debug info with success
            setDebugInfo(prev => ({
              ...prev,
              foundSession: true,
              searchMethod: "case_insensitive",
              sessionId: ilikeSessions[0].id,
              lastQueryTime: new Date().toISOString()
            }));
            return;
          }
          
          // Session found with .in() filter
          setSessionData(inSessions[0]);
          setStep(2);
          setIsVerifyingCode(false);
          
          // Update debug info with success
          setDebugInfo(prev => ({
            ...prev,
            foundSession: true,
            searchMethod: "in_filter",
            sessionId: inSessions[0].id,
            lastQueryTime: new Date().toISOString()
          }));
          return;
        }
        
        // Session found with alternative query
        setSessionData(altSessions[0]);
        setStep(2);
        setIsVerifyingCode(false);
        
        // Update debug info with success
        setDebugInfo(prev => ({
          ...prev,
          foundSession: true,
          searchMethod: "alt_query",
          sessionId: altSessions[0].id,
          lastQueryTime: new Date().toISOString()
        }));
        return;
      }
      
      // Session found with first query
      setSessionData(sessions[0]);
      setStep(2);
      setIsVerifyingCode(false);
      
      // Update debug info with success
      setDebugInfo(prev => ({
        ...prev,
        foundSession: true,
        searchMethod: "primary_query",
        sessionId: sessions[0].id,
        lastQueryTime: new Date().toISOString()
      }));
    } catch (error) {
      console.error("Error verifying session code:", error);
      setError(`An error occurred while verifying the session code: ${error.message}`);
      setIsVerifyingCode(false);
      
      // Update debug info with error
      setDebugInfo(prev => ({
        ...prev,
        error: error.message,
        lastQueryTime: new Date().toISOString()
      }));
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
  
  // Join the session
  const joinSession = async (e) => {
    e.preventDefault();
    
    if (!participantName.trim()) {
      setError("Please enter your name");
      return;
    }
    
    // Additional validations based on anonymity level
    const anonymityLevel = sessionData?.settings?.connection?.anonymityLevel || "anonymous";
    
    if (anonymityLevel === "not_anonymous" || anonymityLevel === "semi_anonymous") {
      if (!email.trim()) {
        setError("Please enter your email");
        return;
      }
    }
    
    if (anonymityLevel === "not_anonymous") {
      if (!organization.trim()) {
        setError("Please enter your organization");
        return;
      }
      
      if (!role.trim()) {
        setError("Please enter your role");
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Check max participants
      if (participants.length >= (sessionData?.max_participants || sessionData?.settings?.maxParticipants || 30)) {
        setError(`This session is full (maximum ${sessionData?.max_participants || sessionData?.settings?.maxParticipants || 30} participants)`);
        setLoading(false);
        return;
      }
      
      // Determine participant fields based on anonymity level
      const participantData = {
        session_id: sessionData.id,
        name: participantName,
        display_name: participantName,
        is_anonymous: anonymityLevel === "anonymous",
      };
      
      // Add additional fields for semi-anonymous and not-anonymous levels
      if (anonymityLevel === "semi_anonymous" || anonymityLevel === "not_anonymous") {
        participantData.email = email;
      }
      
      if (anonymityLevel === "not_anonymous") {
        participantData.organization = organization;
        participantData.role = role;
      }
      
      console.log("Creating participant with data:", participantData);
      
      // Create participant
      const { data: participant, error: participantError } = await supabase
        .from("participants")
        .insert([participantData])
        .select();
      
      if (participantError) {
        console.error("Error creating participant:", participantError);
        
        if (participantError.code === 'PGRST301') {
          setError("Authentication error. The database may require authentication for participant creation.");
        } else if (participantError.code === '23503') {
          setError("Foreign key violation. The session may no longer be valid.");
        } else if (participantError.code === '23505') {
          setError("A participant with this information already exists.");
        } else {
          setError(`Failed to join the session: ${participantError.message}`);
        }
        
        setLoading(false);
        return;
      }
      
      if (!participant || participant.length === 0) {
        setError("Failed to create participant record");
        setLoading(false);
        return;
      }
      
      // Save participant info to localStorage
      const participantInfo = {
        id: participant[0].id,
        name: participantName,
        sessionId: sessionData.id
      };
      
      try {
        localStorage.setItem(`participant_${sessionData.id}`, JSON.stringify(participantInfo));
        console.log("Participant info saved to localStorage");
      } catch (e) {
        console.warn("Could not save participant info to localStorage:", e);
      }
      
      // Redirect to participate page with participant ID
      console.log("Successfully joined session, redirecting to participate page");
      router.push(`/sessions/${sessionData.id}/participate?participantId=${participant[0].id}`);
    } catch (error) {
      console.error("Error joining session:", error);
      setError(`An unexpected error occurred: ${error.message}`);
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
        </div>
        
        <div className="p-6">
          {step === 1 ? (
            // Step 1: Enter session code
            <>
              <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
                Join a Session
              </h1>
              
              <form onSubmit={verifySessionCode} className="space-y-4">
                <div>
                  <label htmlFor="sessionCode" className="block text-sm font-medium text-gray-700">
                    Session Code
                  </label>
                  <input
                    id="sessionCode"
                    type="text"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="Enter the session code"
                    required
                  />
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
                  {isVerifyingCode ? "Verifying..." : "Continue"}
                </button>
              </form>
            </>
          ) : (
            // Step 2: Enter participant info
            <>
              <h1 className="mb-4 text-center text-2xl font-bold text-gray-900">
                Join Session
              </h1>
              
              {sessionData && (
                <div className="mb-6 text-center">
                  <h2 className="text-xl font-semibold">{sessionData.title || sessionData.name}</h2>
                  <p className="text-gray-600">
                    Hosted by {sessionData.settings?.professorName || 'Professor'}
                  </p>
                </div>
              )}
              
              <form onSubmit={joinSession} className="space-y-4">
                <div>
                  <label htmlFor="participantName" className="block text-sm font-medium text-gray-700">
                    Your Name *
                  </label>
                  <input
                    id="participantName"
                    type="text"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                
                {/* Show email field for semi-anonymous and not-anonymous sessions */}
                {(sessionData?.settings?.connection?.anonymityLevel === "semi_anonymous" || 
                  sessionData?.settings?.connection?.anonymityLevel === "not_anonymous") && (
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                )}
                
                {/* Show organization and role fields for not-anonymous sessions */}
                {sessionData?.settings?.connection?.anonymityLevel === "not_anonymous" && (
                  <>
                    <div>
                      <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                        Organization *
                      </label>
                      <input
                        id="organization"
                        type="text"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="Enter your organization"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                        Role *
                      </label>
                      <input
                        id="role"
                        type="text"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="Enter your role"
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
                    Back
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-md bg-primary px-4 py-2 text-center text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
                  >
                    {loading ? "Joining..." : "Join Session"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
        
        {/* Debug toggle button */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {showDebug ? "Hide Debug Info" : "Show Debug Info"}
          </button>
        </div>
        
        {/* Debug information panel */}
        {showDebug && (
          <div className="mt-2 rounded-md bg-gray-50 p-3 text-xs font-mono">
            <div className="mb-2 text-gray-500">Debug Information:</div>
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
        Need help? Contact your session organizer
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function JoinPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <JoinContent />
    </Suspense>
  );
} 