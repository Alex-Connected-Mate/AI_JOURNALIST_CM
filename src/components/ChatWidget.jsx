'use client';

import React, { useState, useEffect, useRef } from 'react';

/**
 * ChatWidget Component
 * 
 * Un composant de chat widget réutilisable qui peut être utilisé pour
 * l'intégration sur des sites web ou en tant que widget autonome.
 * 
 * @param {Object} props - Les propriétés du composant
 * @param {string} props.agentId - L'ID de l'agent
 * @param {Object} props.config - Configuration du widget (couleurs, logo, etc.)
 * @param {boolean} props.embedded - Si le widget est intégré dans une autre page
 * @param {function} props.onClose - Fonction appelée lors de la fermeture du widget
 */
export default function ChatWidget({ 
  agentId, 
  config = {}, 
  embedded = false,
  onClose = () => {}
}) {
  // État pour les messages
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visitorId, setVisitorId] = useState('');
  const [conversationId, setConversationId] = useState(null);
  
  // Référence pour le défilement automatique
  const messageEndRef = useRef(null);
  
  // Valeurs par défaut pour la configuration
  const {
    primary_color = '#007AFF',
    secondary_color = '#FFFFFF',
    text_color = '#111827',
    company_logo_public_url = '',
    chat_bubble_text = 'Comment puis-je vous aider ?',
    widget_position = 'bottom-right',
    widget_size = 'medium',
    show_timestamps = true,
    is_active = true
  } = config;
  
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
        setLoading(true);
        
        const response = await fetch(`/api/widget/${agentId}/conversation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to initialize conversation');
        }
        
        const data = await response.json();
        
        setConversationId(data.conversationId);
        setMessages(data.messages || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error initializing conversation:', err);
        setError('Unable to initialize conversation. Please try again later.');
        setLoading(false);
      }
    };
    
    initializeConversation();
  }, [agentId, visitorId]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle sending a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !conversationId) return;
    
    try {
      setSending(true);
      
      // Add the message to the local state immediately for UI responsiveness
      const messageObj = {
        id: `local_${Date.now()}`,
        sender: 'human',
        content: newMessage,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, messageObj]);
      
      const userMessage = newMessage;
      setNewMessage('');
      
      // Envoyer le message à l'API
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
      
      const data = await response.json();
      
      // Ajouter la réponse de l'IA aux messages
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      }
      
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
      
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
  
  if (loading) {
    return (
      <div className="chat-widget" style={{ backgroundColor: secondary_color, color: text_color }}>
        <div className="widget-header" style={{ backgroundColor: primary_color }}>
          <h3 className="text-white">{chat_bubble_text || "Chat"}</h3>
          {embedded && (
            <button onClick={onClose} className="close-button">
              <span>×</span>
            </button>
          )}
        </div>
        <div className="widget-body flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primary_color }}></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="chat-widget" style={{ backgroundColor: secondary_color, color: text_color }}>
        <div className="widget-header" style={{ backgroundColor: primary_color }}>
          <h3 className="text-white">{chat_bubble_text || "Chat"}</h3>
          {embedded && (
            <button onClick={onClose} className="close-button">
              <span>×</span>
            </button>
          )}
        </div>
        <div className="widget-body flex items-center justify-center">
          <div className="error-message">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="retry-button"
              style={{ backgroundColor: primary_color }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className={`chat-widget ${!embedded ? 'standalone' : ''}`}
      style={{ backgroundColor: secondary_color, color: text_color }}
    >
      {/* Widget Header */}
      <div className="widget-header" style={{ backgroundColor: primary_color }}>
        {company_logo_public_url && (
          <div className="logo-container">
            <img src={company_logo_public_url} alt="Logo" className="widget-logo" />
          </div>
        )}
        <h3 className="text-white">{chat_bubble_text || "Chat"}</h3>
        {embedded && (
          <button onClick={onClose} className="close-button">
            <span>×</span>
          </button>
        )}
      </div>
      
      {/* Messages Area */}
      <div className="widget-body">
        <div className="messages-container">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.sender === 'human' ? 'user-message' : 'ai-message'}`}
            >
              <div 
                className="message-content"
                style={{ 
                  backgroundColor: message.sender === 'human' ? primary_color : '#FFFFFF',
                  color: message.sender === 'human' ? '#FFFFFF' : text_color
                }}
              >
                <p>{message.content}</p>
                {show_timestamps && (
                  <div className="message-timestamp">
                    {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                )}
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
            style={{ borderColor: primary_color }}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={sending || !newMessage.trim()}
            style={{ backgroundColor: primary_color }}
          >
            {sending ? (
              <span className="loading-spinner"></span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
      </div>
      
      <style jsx>{`
        .chat-widget {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          border-radius: ${embedded ? '0.75rem' : '0'};
          overflow: hidden;
          box-shadow: ${embedded ? '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' : 'none'};
        }
        
        .standalone {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
        }
        
        .widget-header {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          position: relative;
        }
        
        .logo-container {
          width: 2rem;
          height: 2rem;
          margin-right: 0.75rem;
          border-radius: 50%;
          overflow: hidden;
          background-color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .widget-logo {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        
        .close-button {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: white;
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
          padding: 0;
          width: 2rem;
          height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.8;
          transition: opacity 0.2s;
        }
        
        .close-button:hover {
          opacity: 1;
        }
        
        .widget-body {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .messages-container {
          flex: 1;
          padding: 1rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        
        .message {
          display: flex;
          max-width: 80%;
        }
        
        .user-message {
          align-self: flex-end;
        }
        
        .ai-message {
          align-self: flex-start;
        }
        
        .message-content {
          padding: 0.75rem 1rem;
          border-radius: 1rem;
          position: relative;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        .user-message .message-content {
          border-bottom-right-radius: 0.25rem;
        }
        
        .ai-message .message-content {
          border-bottom-left-radius: 0.25rem;
        }
        
        .message-timestamp {
          font-size: 0.7rem;
          opacity: 0.7;
          text-align: right;
          margin-top: 0.25rem;
        }
        
        .widget-footer {
          padding: 0.75rem 1rem;
          border-top: 1px solid rgba(0,0,0,0.05);
        }
        
        .message-form {
          display: flex;
          gap: 0.5rem;
        }
        
        .message-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 1.5rem;
          border: 1px solid;
          background-color: white;
          outline: none;
          transition: box-shadow 0.2s;
        }
        
        .message-input:focus {
          box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.2);
        }
        
        .send-button {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          color: white;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        
        .send-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .loading-spinner {
          display: block;
          width: 1rem;
          height: 1rem;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
        }
        
        .error-message {
          padding: 1rem;
          text-align: center;
          color: #991b1b;
        }
        
        .retry-button {
          margin-top: 0.75rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          border: none;
          color: white;
          cursor: pointer;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
} 