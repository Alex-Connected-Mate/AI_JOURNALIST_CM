'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';

export default function JoinSessionPage({ params }) {
  const sessionId = params.id;
  const router = useRouter();
  const { user } = useStore();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nickname, setNickname] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [joinStep, setJoinStep] = useState('welcome');
  const [joining, setJoining] = useState(false);
  
  // Define available emojis for selection
  const availableEmojis = ['😊', '😎', '🤓', '🧐', '🤔', '🤩', '😍', '🥳', '🚀', '💡', '🔥', '✨', '🌟', '💪', '👍'];
  
  // Load session data
  useEffect(() => {
    async function loadSessionData() {
      if (!sessionId) return;
      
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
          max_participants: 30,
          current_participants: 12
        };
        
        setSession(mockSession);
        
        // Check if user is already a participant
        if (user) {
          // In a real implementation, check if the user is already participating
          // If yes, redirect to the active session view
        }
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Unable to load session data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    loadSessionData();
  }, [sessionId, user]);
  
  // Handle join form submission
  const handleJoin = async (e) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      alert('Please enter a nickname to join the session.');
      return;
    }
    
    try {
      setJoining(true);
      
      // This is a mock for now - replace with actual API call
      // In a real implementation, this would create a participant record
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to the participant view
      router.push(`/sessions/${sessionId}/participant`);
    } catch (err) {
      console.error('Error joining session:', err);
      setError('Failed to join the session. Please try again.');
      setJoining(false);
    }
  };
  
  // Move to profile setup step
  const goToProfileStep = () => {
    setJoinStep('profile');
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
            href="/" 
            className="cm-button w-full flex justify-center"
          >
            Return to Home
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
            href="/" 
            className="cm-button w-full flex justify-center"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }
  
  // Welcome step screen
  if (joinStep === 'welcome') {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🚀</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mt-4">{session.name}</h1>
            {session.institution && (
              <p className="text-gray-600">{session.institution}</p>
            )}
          </div>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-center">
            <p className="text-gray-700">
              <span className="font-medium">Active session</span> with {session.current_participants} participants
            </p>
          </div>
          
          <p className="text-center text-gray-600 mb-8">
            You're about to join an interactive session. You'll be able to participate in discussions and activities.
          </p>
          
          <button
            onClick={goToProfileStep}
            className="cm-button w-full py-3 flex justify-center items-center"
            disabled={joining}
          >
            Join Session
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    );
  }
  
  // Profile setup step
  if (joinStep === 'profile') {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg">
          <button 
            onClick={() => setJoinStep('welcome')}
            className="flex items-center text-blue-600 mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
          
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Create your profile</h1>
            <p className="text-gray-600 mt-1">
              Choose how you'll appear to others
            </p>
          </div>
          
          <form onSubmit={handleJoin} className="space-y-6">
            {/* Nickname input */}
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                Choose a nickname
              </label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Your nickname"
                className="cm-input w-full"
                required
              />
            </div>
            
            {/* Emoji selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose an emoji
              </label>
              <div className="grid grid-cols-5 gap-2">
                {availableEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`h-12 w-12 rounded-lg text-2xl flex items-center justify-center transition-all ${
                      selectedEmoji === emoji 
                        ? 'bg-blue-100 border-2 border-blue-500' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Preview */}
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <div className="flex items-center justify-center">
                <div className="bg-white h-10 w-10 rounded-full flex items-center justify-center text-xl mr-2 shadow-sm">
                  {selectedEmoji}
                </div>
                <span className="font-medium">
                  {nickname || 'Your nickname'}
                </span>
              </div>
            </div>
            
            <button
              type="submit"
              className="cm-button w-full py-3"
              disabled={joining || !nickname.trim()}
            >
              {joining ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Joining...
                </>
              ) : (
                'Join Session'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }
} 