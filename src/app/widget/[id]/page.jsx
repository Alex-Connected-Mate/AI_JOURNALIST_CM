'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Page Widget
 * 
 * Cette page affiche le widget de chat en mode autonome lorsque
 * l'URL est accédée directement.
 */
export default function WidgetPage({ params }) {
  const agentId = params.id;
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [visitorId, setVisitorId] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [config, setConfig] = useState({
    primary_color: '#007AFF',
    secondary_color: '#FFFFFF',
    text_color: '#111827',
    company_logo_public_url: '',
    chat_bubble_text: 'Comment puis-je vous aider ?'
  });
  const messageEndRef = React.useRef(null);
  
  // Définir les variables CSS basées sur la configuration
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--widget-primary-color', config.primary_color);
      document.documentElement.style.setProperty('--widget-secondary-color', config.secondary_color);
      document.documentElement.style.setProperty('--widget-text-color', config.text_color);
      
      // Mettre à jour le titre de la page
      document.title = `Chat with ${config.agent_name || 'AI Assistant'}`;
    }
  }, [config]);
  
  // Charger la configuration du widget
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        
        // Appel API pour récupérer la configuration
        const response = await fetch(`/api/widget/${agentId}/config`);
        
        if (!response.ok) {
          throw new Error('Failed to load widget configuration');
        }
        
        const data = await response.json();
        setConfig(data);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading widget configuration:', err);
        setError('Unable to load widget. Please try again later.');
        setLoading(false);
      }
    };
    
    if (agentId) {
      loadConfig();
    }
  }, [agentId]);
  
  // Générer un ID visiteur unique si nécessaire
  useEffect(() => {
    if (!visitorId) {
      // Essayer de récupérer l'ID existant du localStorage
      const storedId = localStorage.getItem(`widget_visitor_${agentId}`);
      if (storedId) {
        setVisitorId(storedId);
      } else {
        // Générer un nouvel ID
        const newId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        setVisitorId(newId);
        localStorage.setItem(`widget_visitor_${agentId}`, newId);
      }
    }
  }, [agentId, visitorId]);
  
  // Initialiser la conversation
  useEffect(() => {
    const initializeConversation = async () => {
      if (!agentId || !visitorId) return;
      
      try {
        // Appel API pour initialiser la conversation
        const response = await fetch(`/api/widget/${agentId}/conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId })
        });
        
        if (!response.ok) {
          throw new Error('Failed to initialize conversation');
        }
        
        const data = await response.json();
        
        setConversationId(data.conversationId);
        setMessages(data.messages || []);
      } catch (err) {
        console.error('Error initializing conversation:', err);
        setError('Unable to initialize conversation. Please try again later.');
      }
    };
    
    if (visitorId && !conversationId) {
      initializeConversation();
    }
  }, [agentId, visitorId, conversationId]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Envoyer un message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !conversationId) return;
    
    try {
      setSending(true);
      
      // Ajouter le message à l'état local pour la réactivité de l'UI
      const messageObj = {
        id: `local_${Date.now()}`,
        sender: 'human',
        content: newMessage,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, messageObj]);
      
      const userMessage = newMessage;
      setNewMessage('');
      
      // Appel API pour envoyer le message
      const response = await fetch(`/api/widget/${agentId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          conversationId,
          visitorId,
          content: userMessage
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // Ajouter la réponse de l'IA aux messages
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      
      // Afficher un message d'erreur à l'utilisateur
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        sender: 'ai',
        content: "Je suis désolé, je rencontre des difficultés à traiter votre demande. Veuillez réessayer plus tard.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setSending(false);
    }
  };
  
  // Afficher un état de chargement
  if (loading) {
    return (
      <div className="chat-widget">
        <div className="widget-header">
          <h3>{config.chat_bubble_text}</h3>
        </div>
        <div className="widget-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="loading-spinner" style={{ marginLeft: 'auto', marginRight: 'auto', width: '2rem', height: '2rem', borderColor: 'rgba(0, 122, 255, 0.3)', borderTopColor: 'var(--widget-primary-color)' }}></div>
            <p style={{ marginTop: '1rem' }}>Chargement...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Afficher un message d'erreur
  if (error) {
    return (
      <div className="chat-widget">
        <div className="widget-header">
          <h3>{config.chat_bubble_text}</h3>
        </div>
        <div className="widget-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="error-message">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="retry-button"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="chat-widget">
      {/* Widget Header */}
      <div className="widget-header">
        {config.company_logo_public_url && (
          <div className="logo-container">
            <img src={config.company_logo_public_url} alt="Logo" className="widget-logo" />
          </div>
        )}
        <h3>{config.chat_bubble_text}</h3>
      </div>
      
      {/* Messages Area */}
      <div className="widget-body">
        <div className="messages-container">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender === 'human' ? 'user-message' : 'ai-message'}`}
            >
              <div className="message-content">
                <p>{message.content}</p>
                <div className="message-timestamp">
                  {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
          ))}
          <div ref={messageEndRef} />
        </div>
      </div>
      
      {/* Message Input */}
      <div className="widget-footer">
        <form onSubmit={handleSendMessage} className="message-form">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            className="message-input"
            disabled={sending}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={sending || !newMessage.trim()}
          >
            {sending ? (
              <span className="loading-spinner"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: '1.25rem', height: '1.25rem' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
} 