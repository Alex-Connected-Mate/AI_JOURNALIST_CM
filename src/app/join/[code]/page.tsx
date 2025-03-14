'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { supabase } from '@/lib/supabase';

export default function JoinSessionPage() {
  const params = useParams();
  const router = useRouter();
  const code = params?.code as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😃');
  const [joinInProgress, setJoinInProgress] = useState(false);
  
  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      try {
        // Try to find session by code
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .or(`code.eq.${code},session_code.eq.${code}`)
          .eq('status', 'active')
          .single();
        
        if (error) {
          throw new Error('Session not found or no longer active');
        }
        
        setSession(data);
      } catch (err: any) {
        console.error('Error fetching session:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (code) {
      fetchSession();
    }
  }, [code]);
  
  const handleJoinSession = async () => {
    if (!session) return;
    
    setJoinInProgress(true);
    try {
      // Get anonymity level from settings
      const anonymityLevel = session.settings?.connection?.anonymityLevel || 'anonymous';
      
      // Generate anonymous identifier for fully anonymous mode
      let anonymousId;
      if (anonymityLevel === 'anonymous') {
        anonymousId = `anon-${Math.random().toString(36).substring(2, 8)}`;
      }
      
      // Create participant entry
      const { data, error } = await supabase
        .from('session_participants')
        .insert({
          session_id: session.id,
          // For anonymous mode
          anonymous_identifier: anonymityLevel === 'anonymous' ? anonymousId : null,
          // For semi-anonymous mode
          nickname: anonymityLevel === 'semi-anonymous' ? nickname : null,
          selected_emoji: anonymityLevel === 'semi-anonymous' ? selectedEmoji : null,
          // Common fields
          joined_at: new Date().toISOString(),
          color: session.settings?.connection?.color || '#3490dc'
        })
        .select()
        .single();
        
      if (error) {
        throw new Error(`Failed to join session: ${error.message}`);
      }
      
      // Store participant ID in localStorage for session persistence
      localStorage.setItem(`session_participant_${session.id}`, data.id);
      
      // Redirect to participant view
      router.push(`/session/${session.id}/participate?pid=${data.id}`);
    } catch (err: any) {
      console.error('Error joining session:', err);
      setError(err.message);
    } finally {
      setJoinInProgress(false);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Finding session...</div>;
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">Session Not Found</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600 mb-6">
            The session you're trying to join might have ended or the code may be incorrect.
          </p>
          <Button 
            onClick={() => router.push('/')}
          >
            Return to Home
          </Button>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return null;
  }
  
  const anonymityLevel = session.settings?.connection?.anonymityLevel || 'anonymous';
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
        {/* Session Header */}
        <div 
          className="p-6 text-white" 
          style={{ backgroundColor: session.settings?.connection?.color || '#3490dc' }}
        >
          <h1 className="text-2xl font-bold">{session.title || session.name}</h1>
          <p className="text-lg opacity-90">{session.institution || session.settings?.institution}</p>
          {(session.professor_name || session.settings?.professorName) && session.show_professor_name && (
            <p className="text-sm opacity-80 mt-1">
              by {session.professor_name || session.settings?.professorName}
            </p>
          )}
        </div>
        
        {/* Join Form */}
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Join Session</h2>
          
          {anonymityLevel === 'anonymous' ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-700">
                You will join this session anonymously. No personal information will be collected.
              </p>
            </div>
          ) : anonymityLevel === 'semi-anonymous' ? (
            <div className="space-y-4 mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-2">
                <p className="text-sm text-yellow-700">
                  Choose a nickname and emoji to represent you in this session.
                </p>
              </div>
              
              <Input
                label="Your Nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter a nickname"
                required
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Choose an Emoji
                </label>
                <div className="grid grid-cols-8 gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  {['😃', '😎', '🤔', '👍', '🚀', '💡', '🔍', '🌟', '🏆', '🎯', '👋', '🙂', '😊', '🤓', '👀', '💪'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedEmoji(emoji)}
                      className={`h-10 w-10 flex items-center justify-center text-xl rounded-lg ${
                        selectedEmoji === emoji ? 'bg-blue-100 ring-2 ring-blue-400' : 'hover:bg-gray-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-700">
                You will join with your real identity. Please proceed to join the session.
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            <Button
              onClick={handleJoinSession}
              disabled={anonymityLevel === 'semi-anonymous' && !nickname}
              isLoading={joinInProgress}
            >
              Join Session
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/')}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 