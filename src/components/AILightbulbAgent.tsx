'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { createAILightbulbAgent } from '@/lib/prompts';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AILightbulbAgentProps {
  sessionId: string;
  participantName: string;
  programName: string;
  teacherName: string;
  onClose?: () => void;
  onComplete?: (insights: string[]) => void;
}

export default function AILightbulbAgent({
  sessionId,
  participantName,
  programName,
  teacherName,
  onClose,
  onComplete
}: AILightbulbAgentProps) {
  const { user, userProfile } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiAgent, setAIAgent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialization effect
  useEffect(() => {
    const initAgent = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Initialize AI Lightbulb agent with user's API key if they've chosen to use it
        const agent = await createAILightbulbAgent(
          user.id,
          sessionId,
          {
            programName,
            teacherName,
            apiKey: userProfile?.use_own_api_key && userProfile?.openai_api_key ? userProfile.openai_api_key : undefined,
          }
        );
        
        setAIAgent(agent);
        
        // Add initial welcome message from AI
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          content: `Hello there! I'm AI Lightbulb, your idea development partner for "${programName}". While you weren't among those selected for the main interviews, your ideas and insights are just as valuable! I'm here to help you develop any "lightbulb moments" you had while listening to the discussions. What idea or concept stood out to you that you'd like to explore further? 💡`,
          sender: 'ai',
          timestamp: new Date()
        };
        
        setMessages([welcomeMessage]);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize AI Lightbulb agent:', err);
        setError('Failed to initialize AI agent. Please try again later.');
        setIsLoading(false);
      }
    };
    
    initAgent();
  }, [user, sessionId, programName, teacherName, userProfile]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle user message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !aiAgent || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Get conversation context from previous messages
      const conversationContext = messages
        .map(msg => `${msg.sender.toUpperCase()}: ${msg.content}`)
        .join('\n\n');
      
      // Generate AI response
      const aiResponse = await aiAgent.generateResponse(inputValue, conversationContext);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Error generating AI response:', err);
      setError('Failed to generate response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Extract insights from conversation for the onComplete callback
  const handleComplete = () => {
    // Extract AI messages as insights
    const insights = messages
      .filter(msg => msg.sender === 'ai')
      .map(msg => msg.content);
    
    if (onComplete) {
      onComplete(insights);
    }
    
    if (onClose) {
      onClose();
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-yellow-600 p-4 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold">AI Lightbulb</h2>
            <p className="text-sm text-yellow-200">Developing ideas with {participantName}</p>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-yellow-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Messages Container */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div 
              className={`inline-block p-3 rounded-lg max-w-3/4 ${
                message.sender === 'user' 
                  ? 'bg-yellow-500 text-white rounded-br-none' 
                  : 'bg-white border border-gray-200 rounded-bl-none'
              }`}
            >
              {message.content}
              <div 
                className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-yellow-200' : 'text-gray-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            <span className="text-sm text-gray-500">AI is thinking...</span>
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 mb-4">
            {error}
            <button 
              className="ml-3 text-red-700 underline"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}
        
        {/* Invisible element for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading || !aiAgent}
            placeholder={isLoading ? "AI is thinking..." : "Type your message..."}
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim() || !aiAgent}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg 
                      disabled:bg-yellow-300 hover:bg-yellow-700 
                      transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            Send
          </button>
        </form>
        
        {messages.length > 3 && (
          <div className="mt-3 text-right">
            <button
              onClick={handleComplete}
              className="text-sm text-yellow-600 hover:text-yellow-800"
            >
              Complete & Save Ideas
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 