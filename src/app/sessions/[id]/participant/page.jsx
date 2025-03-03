'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';

export default function ParticipantPage({ params }) {
  const sessionId = params.id;
  const router = useRouter();
  const { user } = useStore();
  const messageEndRef = useRef(null);
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('waiting');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  // Load session data
  useEffect(() => {
    async function loadSessionData() {
      if (!sessionId) return;
      
      try {
        setLoading(true);
        
        // This is a mock for now - replace with actual API call
        const mockSession = {
          id: sessionId,
          name: "Session de démonstration",
          institution: "Connected Mate",
          status: "active",
          current_phase: "discussion", // waiting, connection, discussion, nuggets, lightbulb, analysis
          started_at: new Date().toISOString()
        };
        
        setSession(mockSession);
        setCurrentPhase(mockSession.current_phase);
        
        // Mock initial messages
        setMessages([
          {
            id: '1',
            sender: 'system',
            content: 'Welcome to the session! You can chat with other participants here.',
            timestamp: new Date().toISOString()
          }
        ]);
      } catch (err) {
        console.error('Error loading session:', err);
        setError('Unable to load session data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    loadSessionData();
    
    // Set up subscription for real-time updates
    const setupSubscription = async () => {
      try {
        // Mock receiving messages every few seconds
        const intervalId = setInterval(() => {
          if (Math.random() > 0.7) {
            const randomUser = ['Alice', 'Bob', 'Charlie', 'David'][Math.floor(Math.random() * 4)];
            const randomContent = [
              'What do you think about this topic?',
              'I have a question about the previous point.',
              'Interesting perspective!',
              'Could you elaborate more on that?',
              'I agree with what was said earlier.'
            ][Math.floor(Math.random() * 5)];
            
            setMessages(prev => [
              ...prev,
              {
                id: `msg-${Date.now()}`,
                sender: 'participant',
                sender_name: randomUser,
                content: randomContent,
                timestamp: new Date().toISOString()
              }
            ]);
          }
        }, 10000);
        
        // Mock changes in phase
        const phaseInterval = setInterval(() => {
          const phases = ['waiting', 'connection', 'discussion', 'nuggets', 'lightbulb', 'analysis'];
          const currentIndex = phases.indexOf(currentPhase);
          if (Math.random() > 0.9 && currentIndex < phases.length - 1) {
            const nextPhase = phases[currentIndex + 1];
            setCurrentPhase(nextPhase);
            setMessages(prev => [
              ...prev,
              {
                id: `system-${Date.now()}`,
                sender: 'system',
                content: `The session has moved to the ${nextPhase} phase.`,
                timestamp: new Date().toISOString()
              }
            ]);
          }
        }, 60000); // Check for phase change every minute
        
        return () => {
          clearInterval(intervalId);
          clearInterval(phaseInterval);
        };
      } catch (err) {
        console.error('Error setting up subscription:', err);
      }
    };
    
    const unsubscribe = setupSubscription();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [sessionId, currentPhase]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      setSending(true);
      
      // Add the message to the local state immediately for UI responsiveness
      const messageObj = {
        id: `msg-${Date.now()}`,
        sender: 'self',
        sender_name: 'You',
        content: newMessage,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, messageObj]);
      setNewMessage('');
      
      // This is a mock for now - replace with actual API call
      // In a real implementation, you would save the message to your database
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
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
  
  // Render waiting screen
  if (currentPhase === 'waiting') {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-lg text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">⏳</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mt-4">{session.name}</h1>
          </div>
          
          <p className="text-gray-700 mb-8">
            The session hasn't started yet. Please wait for the host to begin.
          </p>
          
          <div className="animate-pulse flex justify-center">
            <div className="h-2 w-2 bg-blue-600 rounded-full mx-1"></div>
            <div className="h-2 w-2 bg-blue-600 rounded-full mx-1 animation-delay-200"></div>
            <div className="h-2 w-2 bg-blue-600 rounded-full mx-1 animation-delay-400"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render active session view
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 border-b">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-2 h-10 w-10 flex items-center justify-center">
              <span className="text-xl">🚀</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold">{session.name}</h1>
              <div className="flex items-center text-xs text-gray-500">
                <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 mr-2">
                  {currentPhase.charAt(0).toUpperCase() + currentPhase.slice(1)} Phase
                </span>
                <span>Started {new Date(session.started_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
          </div>
          
          <button 
            className="cm-button-secondary text-sm py-1.5"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 overflow-hidden">
        {/* Phase description */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <h2 className="font-semibold text-lg mb-2">
            {currentPhase === 'connection' && 'Connection Phase'}
            {currentPhase === 'discussion' && 'Discussion Phase'}
            {currentPhase === 'nuggets' && 'AI Nuggets Phase'}
            {currentPhase === 'lightbulb' && 'AI Lightbulbs Phase'}
            {currentPhase === 'analysis' && 'Analysis Phase'}
          </h2>
          <p className="text-gray-600">
            {currentPhase === 'connection' && 'Get to know other participants and fill out your profile.'}
            {currentPhase === 'discussion' && 'Share your thoughts and ideas with the group.'}
            {currentPhase === 'nuggets' && 'The AI will interview selected participants for valuable insights.'}
            {currentPhase === 'lightbulb' && 'The AI will explore innovative ideas with participants.'}
            {currentPhase === 'analysis' && 'Review the collected insights and outcomes from the session.'}
          </p>
        </div>
        
        {/* Messages area */}
        <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-medium">Session Chat</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'self' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-3/4 rounded-lg p-3 ${
                    message.sender === 'system' 
                      ? 'bg-blue-50 text-blue-800 border border-blue-100' 
                      : message.sender === 'self'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.sender !== 'system' && message.sender !== 'self' && (
                    <div className="font-medium text-sm text-blue-700 mb-1">
                      {message.sender_name}
                    </div>
                  )}
                  <p>{message.content}</p>
                  <div className="text-xs opacity-70 text-right mt-1">
                    {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messageEndRef} />
          </div>
          
          {/* Message input */}
          <div className="p-4 border-t">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message here..."
                className="cm-input flex-1"
                disabled={sending}
              />
              <button 
                type="submit" 
                className="cm-button px-4"
                disabled={sending || !newMessage.trim()}
              >
                {sending ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                ) : (
                  'Send'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 