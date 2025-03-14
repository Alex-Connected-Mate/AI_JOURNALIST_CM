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
  const [currentParticipantsCount, setCurrentParticipantsCount] = useState(0);
  
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
      // Normalize the input code to uppercase and trim whitespace
      const normalizedCode = sessionCode.trim().toUpperCase();
      console.log(`Attempting to find session with code: ${normalizedCode}`);
      
      // STEP 1: Fetch ALL active sessions first - this ensures we always have data to show users
      const { data: allActiveSessions, error: activeSessionsError } = await supabase
        .from("sessions")
        .select("id, name, title, code, session_code, status")
        .eq("status", "active");
      
      console.log("All active sessions:", allActiveSessions);
      
      if (activeSessionsError) {
        console.error("Error fetching active sessions:", activeSessionsError);
        setError(`Error retrieving available sessions: ${activeSessionsError.message}`);
        setIsVerifyingCode(false);
        return;
      }
      
      // STEP 2: Process available sessions to show to users if needed
      const availableSessions = allActiveSessions ? allActiveSessions.map(session => {
        // Format each session with name and codes
        const sessionName = session.name || session.title || "Unnamed Session";
        const codes = [];
        if (session.code) codes.push(session.code);
        if (session.session_code && session.session_code !== session.code) codes.push(session.session_code);
        return { id: session.id, name: sessionName, codes, status: session.status };
      }) : [];
      
      console.log("Processed available sessions:", availableSessions);
      
      // STEP 3: Look for an exact match in the fetched sessions
      let foundSession = null;
      for (const session of availableSessions) {
        if (session.codes.some(code => code.toUpperCase() === normalizedCode)) {
          foundSession = allActiveSessions.find(s => s.id === session.id);
          console.log("Found matching session:", foundSession);
          break;
        }
      }
      
      // STEP 4: If no exact match found, also check for a session where code matches
      // even if it's not active (for better error messages)
      let inactiveSession = null;
      if (!foundSession) {
        const { data: anySession, error: anySessionError } = await supabase
          .from("sessions")
          .select("id, status, code, session_code")
          .or(`session_code.eq."${normalizedCode}",code.eq."${normalizedCode}"`)
          .limit(1);
          
        if (anySession && anySession.length > 0) {
          inactiveSession = anySession[0];
          console.log("Found non-active session:", inactiveSession);
        }
      }
      
      // STEP 5: Handle results based on what we found
      if (foundSession) {
        // Success! We found a matching active session
        setSessionData(foundSession);
        setStep(2);
        setDebugInfo(prev => ({
          ...prev,
          foundSession: true,
          sessionId: foundSession.id,
          matchedCode: normalizedCode,
          lastQueryTime: new Date().toISOString(),
          availableSessions: availableSessions
        }));
      } else if (inactiveSession) {
        // Session exists but is not active
        setError(`Session found but it's not active (status: ${inactiveSession.status || 'unknown'}). Please contact the session organizer.`);
        setDebugInfo(prev => ({
          ...prev,
          sessionExists: true,
          sessionNotActive: true,
          sessionStatus: inactiveSession.status,
          lastQueryTime: new Date().toISOString(),
          availableSessions: availableSessions
        }));
      } else {
        // No session found with this code - show available sessions
        let errorMsg = "No session found with this code. Please check and try again.";
        
        if (availableSessions.length > 0) {
          // Build a message showing all available sessions and their codes
          errorMsg += " Available sessions:";
          availableSessions.forEach(session => {
            if (session.codes.length > 0) {
              errorMsg += ` "${session.name}" (${session.codes.join(', ')})`;
            }
          });
        }
        
        setError(errorMsg);
        setDebugInfo(prev => ({
          ...prev,
          noSessionFound: true,
          searchedCode: normalizedCode,
          lastQueryTime: new Date().toISOString(),
          availableSessions: availableSessions
        }));
      }
    } catch (error) {
      console.error("Error verifying session code:", error);
      setError(`An error occurred: ${error.message}. Please try again.`);
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
  
  // Join the session
  const joinSession = async (e) => {
    e.preventDefault();
    
    if (!participantName.trim()) {
      setError("Please enter your name");
      return;
    }
    
    // Additional validations based on anonymity level
    const anonymityLevel = sessionData?.settings?.connection?.anonymityLevel || "anonymous";
    console.log("Anonymity level from session:", anonymityLevel);
    
    const isSemiAnonymous = anonymityLevel === "semi_anonymous" || 
                           anonymityLevel === "semi-anonymous";
    const isNotAnonymous = anonymityLevel === "not_anonymous" || 
                           anonymityLevel === "non-anonymous";
    
    if (isSemiAnonymous || isNotAnonymous) {
      if (!email.trim()) {
        setError("Please enter your email");
        return;
      }
    }
    
    if (isNotAnonymous) {
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
      // Verify session data exists
      if (!sessionData || !sessionData.id) {
        throw new Error("Session data is missing or invalid");
      }
      
      console.log("Session data available:", {
        id: sessionData.id,
        title: sessionData.title,
        name: sessionData.name,
        status: sessionData.status
      });
      
      // Check max participants
      const maxParticipants = sessionData?.max_participants || 
                             sessionData?.settings?.maxParticipants || 
                             sessionData?.settings?.connection?.maxParticipants || 
                             30;
                              
      console.log(`Checking participant count: ${currentParticipantsCount} vs max: ${maxParticipants}`);
      
      if (currentParticipantsCount >= maxParticipants) {
        setError(`This session is full (maximum ${maxParticipants} participants)`);
        setLoading(false);
        return;
      }
      
      // Determine participant fields based on anonymity level
      const participantData = {
        session_id: sessionData.id,
        nickname: participantName,
        display_name: participantName,
        full_name: participantName,
        anonymous: anonymityLevel === "anonymous" || anonymityLevel === "semi_anonymous" || anonymityLevel === "semi-anonymous"
      };
      
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
        const colors = ['#FF5733', '#33FF57', '#3357FF', '#F033FF', '#FF33A1', '#33FFF5'];
        participantData.color = colors[Math.floor(Math.random() * colors.length)];
      }
      
      if (!participantData.emoji) {
        const emojis = ['😀', '😎', '🤓', '🧐', '🤔', '👨‍🎓', '👩‍🎓', '👨‍💻', '👩‍💻'];
        participantData.emoji = emojis[Math.floor(Math.random() * emojis.length)];
      }
      
      // Set joined_at timestamp
      participantData.joined_at = new Date().toISOString();
      
      console.log("Creating participant with data:", JSON.stringify(participantData, null, 2));
      
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
      
      // Check the structure of the session_participants table
      try {
        const { data: tableInfo, error: tableError } = await supabase
          .from("session_participants")
          .select("*")
          .limit(1);
          
        console.log("Session participants table sample:", tableInfo);
        console.log("Table info error:", tableError);
      } catch (tableCheckError) {
        console.error("Error checking table structure:", tableCheckError);
      }
      
      // Create participant in session_participants table
      console.log("Attempting to insert participant record...");
      const insertResult = await supabase
        .from("session_participants")
        .insert([participantData])
        .select('*');
        
      const { data: participant, error: participantError } = insertResult;
      
      console.log("Insert result:", insertResult);
      
      if (participantError) {
        console.error("Error creating participant:", participantError);
        
        if (participantError.code === 'PGRST301') {
          setError("Authentication error. The database may require authentication for participant creation.");
        } else if (participantError.code === '23503') {
          setError("Foreign key violation. The session may no longer be valid.");
        } else if (participantError.code === '23505') {
          setError("A participant with this information already exists.");
        } else {
          setError(`Failed to join the session: ${participantError.message || JSON.stringify(participantError)}`);
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
        console.log("No participant data returned from insert, will query to find it");
        
        // Query to get the created participant
        console.log("Querying for the created participant...");
        const { data: createdParticipant, error: fetchError } = await supabase
          .from("session_participants")
          .select("*")
          .eq("session_id", sessionData.id)
          .eq("display_name", participantName)
          .is("deleted_at", null)
          .order("created_at", { ascending: false })
          .limit(1);
          
        console.log("Created participant query result:", { createdParticipant, fetchError });
        
        if (fetchError) {
          console.error("Error fetching created participant:", fetchError);
          setError("Participant was created but could not be retrieved. Please try again.");
          setLoading(false);
          return;
        }
        
        if (!createdParticipant || createdParticipant.length === 0) {
          setError("Failed to retrieve participant record");
          setLoading(false);
          return;
        }
        
        // Safely access participant data
        var participantRecord = createdParticipant[0];
      } else {
        console.log("Participant data returned directly from insert:", participant);
        var participantRecord = participant[0];
      }
      
      // Save participant info to localStorage
      const participantInfo = {
        id: participantRecord.id,
        name: participantName,
        sessionId: sessionData.id,
        anonymousToken: participantRecord.anonymous_token || null
      };
      
      try {
        localStorage.setItem(`participant_${sessionData.id}`, JSON.stringify(participantInfo));
        console.log("Participant info saved to localStorage");
      } catch (e) {
        console.warn("Could not save participant info to localStorage:", e);
      }
      
      // Check if we have a valid ID before redirecting
      if (!participantRecord.id) {
        setError("Created participant record is missing an ID. Please try again.");
        setLoading(false);
        
        setDebugInfo(prev => ({
          ...prev,
          participantRecordError: "Missing ID",
          participantRecord: JSON.stringify(participantRecord)
        }));
        return;
      }
      
      // Redirect to participate page with correct parameters
      console.log("Successfully joined session, redirecting to participate page");
      console.log("Redirect params:", {
        sessionId: sessionData.id,
        participantId: participantRecord.id,
        token: participantRecord.anonymous_token || ''
      });
      
      const token = participantRecord.anonymous_token ? 
        encodeURIComponent(participantRecord.anonymous_token) : '';
        
      const redirectUrl = `/sessions/${sessionData.id}/participate?participantId=${participantRecord.id}${token ? `&token=${token}` : ''}`;
      console.log("Redirect URL:", redirectUrl);
      
      router.push(redirectUrl);
    } catch (error) {
      console.error("Exception in joinSession:", error);
      setError(`An unexpected error occurred: ${error.message || JSON.stringify(error)}`);
      
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
                  sessionData?.settings?.connection?.anonymityLevel === "semi-anonymous" ||
                  sessionData?.settings?.connection?.anonymityLevel === "not_anonymous" || 
                  sessionData?.settings?.connection?.anonymityLevel === "non-anonymous") && (
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
                {(sessionData?.settings?.connection?.anonymityLevel === "not_anonymous" || 
                  sessionData?.settings?.connection?.anonymityLevel === "non-anonymous") && (
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