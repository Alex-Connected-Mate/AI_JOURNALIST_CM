'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import AIAgentSelector from '@/components/AIAgentSelector';
import { supabase } from '@/lib/supabase';
import { AgentType } from '@/components/AIAgentSelector';

export default function ParticipateSessionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = params?.id as string;
  const participantId = searchParams?.get('pid') || null;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [participant, setParticipant] = useState<any>(null);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentType | null>(null);
  
  // Set up Supabase auth context for anonymous participants
  useEffect(() => {
    if (participantId) {
      // Add the participant ID to localStorage for authentication
      localStorage.setItem('participant_id', participantId);
      
      // Set custom header when making requests
      const customHeaders = {
        'x-participant-id': participantId
      };
      
      // Add the header to fetch requests in interceptor or similar mechanism
      // This is a safer alternative to directly accessing protected properties
      const originalFetch = window.fetch;
      window.fetch = function(url: RequestInfo | URL, options: RequestInit = {}) {
        const newOptions = {
          ...options,
          headers: {
            ...options.headers,
            ...customHeaders
          }
        };
        return originalFetch(url, newOptions);
      };
      
      return () => {
        // Cleanup
        localStorage.removeItem('participant_id');
        window.fetch = originalFetch;
      };
    }
  }, [participantId]);
  
  useEffect(() => {
    const fetchSessionAndParticipant = async () => {
      setLoading(true);
      try {
        // Verify participant is valid
        if (!participantId) {
          throw new Error('Participant ID not found');
        }
        
        // Get session data
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('id', sessionId)
          .eq('status', 'active')
          .single();
          
        if (sessionError) {
          throw new Error('Session not found or no longer active');
        }
        
        // Get participant data
        const { data: participantData, error: participantError } = await supabase
          .from('session_participants')
          .select('*')
          .eq('id', participantId)
          .eq('session_id', sessionId)
          .single();
          
        if (participantError) {
          throw new Error('You are not registered for this session');
        }
        
        setSession(sessionData);
        setParticipant(participantData);
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (sessionId) {
      fetchSessionAndParticipant();
    }
  }, [sessionId, participantId]);
  
  const handleSelectAgent = (agentType: AgentType) => {
    setSelectedAgent(agentType);
    setShowAgentSelector(true);
  };
  
  const handleAgentClose = () => {
    setShowAgentSelector(false);
    setSelectedAgent(null);
  };
  
  const handleAgentComplete = (insights: string[]) => {
    // Store insights or handle completion
    console.log('Agent interaction completed with insights:', insights);
    setShowAgentSelector(false);
    setSelectedAgent(null);
  };
  
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading session...</div>;
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Cannot Join Session</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button 
            onClick={() => router.push('/')}
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }
  
  if (!session || !participant) {
    return null;
  }
  
  // Determine participant display name based on anonymity level
  const anonymityLevel = session.settings?.connection?.anonymityLevel || 'anonymous';
  let displayName = 'Anonymous';
  
  if (anonymityLevel === 'semi-anonymous' && participant.nickname) {
    displayName = participant.nickname;
  } else if (anonymityLevel === 'non-anonymous' && participant.full_name) {
    displayName = participant.full_name;
  } else if (anonymityLevel === 'anonymous' && participant.anonymous_identifier) {
    displayName = `Anonymous ${participant.anonymous_identifier.substring(5, 8)}`;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Session Header */}
      <header 
        className="p-4 shadow-md" 
        style={{ backgroundColor: session.settings?.connection?.color || '#3490dc' }}
      >
        <div className="max-w-5xl mx-auto flex justify-between items-center text-white">
          <div>
            <h1 className="text-xl font-bold">{session.title || session.name}</h1>
            <p className="text-sm opacity-90">
              {session.institution || session.settings?.institution}
            </p>
          </div>
          <div className="flex items-center">
            <div className="mr-3 text-sm opacity-80">
              Joined as: <span className="font-semibold">{displayName}</span>
            </div>
            <span className="text-2xl">
              {participant.selected_emoji || session.settings?.connection?.emoji || '🎓'}
            </span>
          </div>
        </div>
      </header>
      
      <main className="max-w-5xl mx-auto p-4 py-8">
        {showAgentSelector && selectedAgent ? (
          <div className="h-[600px]">
            <AIAgentSelector
              sessionId={sessionId}
              participantName={displayName}
              programName={session.institution || session.settings?.institution || 'Program'}
              teacherName={session.professor_name || session.settings?.professorName || 'Teacher'}
              agentType={selectedAgent}
              onClose={handleAgentClose}
              onComplete={handleAgentComplete}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Choose Your AI Journalist</h2>
              <p className="text-gray-600 mb-6">
                Select how you would like to interact with the AI:
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={() => handleSelectAgent('nuggets')}
                  className="w-full p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-left hover:bg-indigo-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="bg-indigo-100 p-3 rounded-full mr-4">
                      <span className="text-2xl">💎</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-indigo-700">AI Nuggets</h3>
                      <p className="text-sm text-gray-600">
                        Extract valuable business insights from your experience
                      </p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleSelectAgent('lightbulb')}
                  className="w-full p-4 bg-amber-50 border border-amber-200 rounded-lg text-left hover:bg-amber-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="bg-amber-100 p-3 rounded-full mr-4">
                      <span className="text-2xl">💡</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-amber-700">AI Lightbulb</h3>
                      <p className="text-sm text-gray-600">
                        Develop ideas and get creative inspiration for innovation
                      </p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleSelectAgent('pause')}
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg text-left hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="bg-gray-100 p-3 rounded-full mr-4">
                      <span className="text-2xl">⏸️</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-700">Take a Break</h3>
                      <p className="text-sm text-gray-600">
                        Pause and reflect on the discussion
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Session Information</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Overview</h3>
                  <p className="mt-1 text-gray-700">
                    {session.description || 'Join this interactive session to share insights and develop ideas.'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Your Identity</h3>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                        style={{ backgroundColor: participant.color || session.settings?.connection?.color || '#3490dc' }}
                      >
                        <span className="text-lg text-white">
                          {participant.selected_emoji || session.settings?.connection?.emoji || '🎓'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{displayName}</p>
                        <p className="text-xs text-gray-500">
                          {anonymityLevel === 'anonymous' ? 'Anonymous participant' : 
                           anonymityLevel === 'semi-anonymous' ? 'Semi-anonymous participant' : 
                           'Full participant profile'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Help & Support</h3>
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      If you need assistance during this session, please contact the session host or raise your hand in person.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
} 