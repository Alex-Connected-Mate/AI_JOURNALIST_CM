'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { useStore } from '@/lib/store';

export default function SessionRunPage({ params }) {
  const sessionId = params.id;
  const router = useRouter();
  const { user } = useStore();
  
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [currentStep, setCurrentStep] = useState('waiting');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Steps for the session flow
  const steps = [
    'waiting',     // Waiting for participants to join
    'connection',  // Connection phase
    'discussion',  // First discussion phase
    'nuggets',     // AI Nuggets interaction
    'lightbulb',   // AI Lightbulbs interaction
    'analysis'     // Final analysis phase
  ];
  
  // Load session data
  useEffect(() => {
    async function loadSessionData() {
      if (!sessionId || !user) return;
      
      try {
        setLoading(true);
        
        // This is a mock for now - replace with actual API call
        // In a real implementation, this would fetch from your database
        const mockSession = {
          id: sessionId,
          name: "Session de démonstration",
          institution: "Connected Mate",
          status: "active",
          started_at: new Date().toISOString(),
          user_id: user.id,
          max_participants: 30
        };
        
        setSession(mockSession);
        
        // Mock participants - replace with API call
        setParticipants([]);
        
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Unable to load session data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    loadSessionData();
    
    // Set up real-time subscription for participants
    const setupRealtime = async () => {
      try {
        // Mock implementation - replace with actual subscription
        // In a real implementation, you'd subscribe to participants changes
        const intervalId = setInterval(() => {
          // Simulate new participants joining
          if (Math.random() > 0.7) {
            setParticipants(prev => [
              ...prev,
              {
                id: `participant-${prev.length + 1}`,
                nickname: `Participant ${prev.length + 1}`,
                joined_at: new Date().toISOString()
              }
            ]);
          }
        }, 5000);
        
        return () => clearInterval(intervalId);
      } catch (err) {
        console.error('Error setting up realtime:', err);
      }
    };
    
    const unsubscribe = setupRealtime();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [sessionId, user]);
  
  // Navigate to next step
  const goToNextStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };
  
  // Navigate to previous step
  const goToPreviousStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };
  
  // Get share URL for participants to join
  const getShareUrl = () => {
    return typeof window !== 'undefined' 
      ? `${window.location.origin}/sessions/${sessionId}/join` 
      : '';
  };
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-6 text-lg text-gray-700">Loading session...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-md p-8 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link 
            href="/dashboard" 
            className="cm-button w-full flex justify-center"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-md p-8 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-yellow-600 mb-4">Session Not Found</h2>
          <p className="text-gray-700 mb-6">The requested session could not be found.</p>
          <Link 
            href="/dashboard" 
            className="cm-button w-full flex justify-center"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  // Render waiting room (default step)
  if (currentStep === 'waiting') {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-r from-blue-50 to-indigo-50">
        {/* Header with controls */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 h-10 w-10 flex items-center justify-center">
              <span className="text-xl">🚀</span>
            </div>
            <h1 className="text-xl font-semibold">{session.name}</h1>
          </div>
          
          <div className="flex gap-2 items-center">
            <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Live
            </span>
            
            <button 
              onClick={goToNextStep}
              className="cm-button flex items-center gap-2"
            >
              Start Session
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </header>
        
        {/* Main Content */}
        <div className="flex-1 flex p-8">
          {/* Left panel with QR code */}
          <div className="w-1/2 flex flex-col items-center justify-center p-10 bg-white rounded-l-3xl shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Scan to join the session</h2>
            
            <div className="bg-white p-6 border-4 border-indigo-200 rounded-lg mb-6">
              <QRCodeSVG 
                value={getShareUrl()} 
                size={300}
                level="H"
              />
            </div>
            
            <p className="text-center text-lg text-gray-600 mb-2">
              Or join with the following link:
            </p>
            <p className="text-center text-xl font-medium text-blue-600 break-all">
              {getShareUrl()}
            </p>
          </div>
          
          {/* Right panel with participants */}
          <div className="w-1/2 bg-indigo-50 p-10 rounded-r-3xl shadow-lg flex flex-col">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              Participants ({participants.length}/{session.max_participants})
            </h2>
            
            {participants.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-xl text-gray-600 text-center">
                  Waiting for participants to join...
                </p>
                <p className="text-gray-500 mt-2 text-center">
                  Participants will appear here as they join.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-3">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                      <div className="bg-indigo-100 text-indigo-800 h-10 w-10 rounded-full flex items-center justify-center font-semibold">
                        {participant.nickname?.charAt(0) || 'P'}
                      </div>
                      <div>
                        <p className="font-medium">{participant.nickname || 'Anonymous'}</p>
                        <p className="text-xs text-gray-500">
                          Joined {new Date(participant.joined_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {participants.length > 0 && (
              <div className="mt-6 flex justify-center">
                <button 
                  onClick={goToNextStep}
                  className="cm-button flex items-center gap-2"
                >
                  Start Session
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Render connection phase
  if (currentStep === 'connection') {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-r from-blue-50 to-indigo-50">
        {/* Header with controls */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 h-10 w-10 flex items-center justify-center">
              <span className="text-xl">🚀</span>
            </div>
            <h1 className="text-xl font-semibold">{session.name}</h1>
          </div>
          
          <div className="flex gap-2 items-center">
            <button 
              onClick={goToPreviousStep}
              className="cm-button-secondary flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Previous
            </button>
            
            <button 
              onClick={goToNextStep}
              className="cm-button flex items-center gap-2"
            >
              Next
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </header>
        
        {/* Connection Phase Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-3/4 bg-white rounded-2xl shadow-lg p-10 text-center">
            <h2 className="text-4xl font-bold text-gray-800 mb-6">Connection Phase</h2>
            <p className="text-xl text-gray-600 mb-10">
              Participants are now completing their profiles and getting to know each other.
            </p>
            
            <div className="flex items-center justify-center space-x-8">
              {/* Connected participants visualization */}
              <div className="flex flex-wrap justify-center gap-4 max-w-2xl">
                {participants.map((participant) => (
                  <div 
                    key={participant.id} 
                    className="bg-indigo-100 text-indigo-800 h-16 w-16 rounded-full flex items-center justify-center text-xl font-semibold"
                  >
                    {participant.nickname?.charAt(0) || 'P'}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Other steps would follow similar patterns
  // For now, show a simple placeholder for other steps
  return (
    <div className="h-screen flex flex-col bg-gradient-to-r from-blue-50 to-indigo-50">
      {/* Header with controls */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2 h-10 w-10 flex items-center justify-center">
            <span className="text-xl">🚀</span>
          </div>
          <h1 className="text-xl font-semibold">{session.name}</h1>
        </div>
        
        <div className="flex gap-2 items-center">
          <button 
            onClick={goToPreviousStep}
            className="cm-button-secondary flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Previous
          </button>
          
          <button 
            onClick={goToNextStep}
            className="cm-button flex items-center gap-2"
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </header>
      
      {/* Generic Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-3/4 bg-white rounded-2xl shadow-lg p-10 text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            {currentStep.charAt(0).toUpperCase() + currentStep.slice(1)} Phase
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            This is the {currentStep} phase of your session.
          </p>
          
          <div className="p-6 bg-indigo-50 rounded-xl text-left mb-8">
            <p className="text-gray-700">
              In a complete implementation, this phase would show:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
              <li>Specific UI for the {currentStep} phase</li>
              <li>Visualization of participant activities</li>
              <li>Real-time updates from the database</li>
              <li>Interactive elements for the professor to manage</li>
            </ul>
          </div>
          
          <div className="flex justify-center space-x-4">
            <button 
              onClick={goToPreviousStep}
              className="cm-button-secondary"
            >
              Previous Phase
            </button>
            <button 
              onClick={goToNextStep}
              className="cm-button"
            >
              Next Phase
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 