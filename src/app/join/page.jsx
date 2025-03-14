"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Image from "next/image";
import Logo from "@/components/ui/Logo";
import DotPattern from "@/components/ui/DotPattern";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <div className="relative mb-4 h-16 w-16">
        <Logo />
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner />
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
  const supabase = createClientComponentClient();
  
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
      const { data: sessions, error: sessionError } = await supabase
        .from("sessions")
        .select("id, title, name, status, settings, max_participants, session_code, code")
        .or(`session_code.eq.${sessionCode},code.eq.${sessionCode}`)
        .eq("status", "active")
        .limit(1)
        .single();
      
      if (sessionError || !sessions) {
        setError("No session found with this code. Please check and try again.");
        setIsVerifyingCode(false);
        return;
      }
      
      // Session found, proceed to step 2
      setSessionData(sessions);
      setStep(2);
      setIsVerifyingCode(false);
    } catch (error) {
      console.error("Error verifying session code:", error);
      setError("An error occurred while verifying the session code. Please try again.");
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
  }, [searchParams]);
  
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
      
      // Create participant
      const { data: participant, error: participantError } = await supabase
        .from("participants")
        .insert(participantData)
        .select()
        .single();
      
      if (participantError) {
        console.error("Error creating participant:", participantError);
        setError("Failed to join the session. Please try again.");
        setLoading(false);
        return;
      }
      
      // Redirect to participate page
      router.push(`/sessions/${sessionData.id}/participate?participantId=${participant.id}`);
    } catch (error) {
      console.error("Error joining session:", error);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };
  
  // Render based on current step
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50 p-4">
      <DotPattern className="absolute inset-0 z-0" />
      
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-center bg-primary p-6">
          <Logo className="h-8 w-auto" light />
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
        
        <div className="border-t border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">
          Need help? Contact your session organizer
        </div>
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