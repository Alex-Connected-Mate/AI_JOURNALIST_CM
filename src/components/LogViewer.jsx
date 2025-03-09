import React, { useState, useEffect, useRef, useCallback } from 'react';
import eventTracker, { getEvents, clearEvents, exportEvents, EVENT_TYPES } from '@/lib/eventTracker';

/**
 * LogViewer Component - Version simplifiée pour éviter les conflits
 * 
 * Composant qui affiche les logs de console et les événements utilisateur
 * sans interférer avec les composants de l'application
 */
const LogViewer = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('logs');
  const logContainerRef = useRef(null);

  // Function to add a log entry, wrapped in useCallback to prevent recreation
  const addLogEntry = useCallback((type, args) => {
    // Version simplifiée qui n'interfère pas avec les événements React
    const timestamp = new Date().toISOString().substr(11, 12);
    
    // Filtrer les messages liés à onValidate pour éviter les erreurs
    const argsArray = Array.from(args);
    if (argsArray.some(arg => 
      typeof arg === 'string' && arg.includes('onValidate')
    )) {
      return; // Ignorer les logs liés à onValidate
    }
    
    const message = argsArray.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    // Utiliser setTimeout pour éviter les mises à jour pendant le rendu
    setTimeout(() => {
      setLogs(prevLogs => [
        { id: Date.now(), type, timestamp, message },
        ...prevLogs.slice(0, 99) // Garder uniquement les 100 derniers logs
      ]);
    }, 0);
  }, []);

  // Effect to capture logs - Version simplifiée
  useEffect(() => {
    // Ne pas intercepter les logs en production
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleInfo = console.info;

    // Override console methods with safe versions
    console.log = (...args) => {
      originalConsoleLog.apply(console, args);
      addLogEntry('log', args);
    };
    
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      addLogEntry('error', args);
    };
    
    console.warn = (...args) => {
      originalConsoleWarn.apply(console, args);
      addLogEntry('warn', args);
    };
    
    console.info = (...args) => {
      originalConsoleInfo.apply(console, args);
      addLogEntry('info', args);
    };

    // Cleanup
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.info = originalConsoleInfo;
    };
  }, [addLogEntry]);

  // Effect to listen for events from the tracker - Version simplifiée
  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
      return;
    }

    const handleNewEvent = () => {
      setUserEvents(getEvents());
    };

    // Écouter les événements sans installer de trackers globaux
    window.addEventListener('app:event_tracked', handleNewEvent);
    
    // Charger les événements existants
    setUserEvents(getEvents());

    return () => {
      window.removeEventListener('app:event_tracked', handleNewEvent);
    };
  }, []);

  // Auto-scroll to the bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current && isExpanded) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs, isExpanded, activeTab]);

  // Clear logs and events
  const handleClear = () => {
    if (activeTab === 'logs') {
      setLogs([]);
    } else {
      clearEvents();
      setUserEvents([]);
    }
  };

  // Get the appropriate color for each log type
  const getLogColor = (type) => {
    switch (type) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-300';
    }
  };

  // Version simplifiée du composant
  return (
    <div className="fixed bottom-0 right-0 z-50">
      {/* Bouton du LogViewer */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-gray-800 text-white px-4 py-2 rounded-tl-lg flex items-center gap-2 hover:bg-gray-700 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Logs {logs.length > 0 && `(${logs.length})`}
      </button>
      
      {/* Log Viewer Panel - Version simplifiée */}
      {isExpanded && (
        <div className="bg-gray-900 border border-gray-700 w-[600px] max-w-full">
          <div className="flex justify-between items-center p-2 border-b border-gray-700">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('logs')}
                className={`text-xs px-3 py-1.5 rounded-md ${activeTab === 'logs' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
              >
                Console ({logs.length})
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`text-xs px-3 py-1.5 rounded-md ${activeTab === 'events' ? 'bg-green-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
              >
                Events ({userEvents.length})
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClear}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
              >
                Clear
              </button>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Console Logs Tab - Version simplifiée */}
          {activeTab === 'logs' && (
            <div 
              ref={logContainerRef}
              className="h-64 overflow-y-auto font-mono text-xs p-2"
            >
              {logs.length === 0 ? (
                <div className="text-gray-500 italic text-center mt-4">No logs to display</div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="mb-1">
                    <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                    <span className={getLogColor(log.type)}>[{log.type.toUpperCase()}]</span>{' '}
                    <span className="text-white">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          )}
          
          {/* Events Tab - Version simplifiée */}
          {activeTab === 'events' && (
            <div 
              className="h-64 overflow-y-auto font-mono text-xs p-2"
            >
              {userEvents.length === 0 ? (
                <div className="text-gray-500 italic text-center mt-4">No events to display</div>
              ) : (
                userEvents.map(event => (
                  <div key={event.id} className="mb-1">
                    <span className="text-gray-500">[{new Date(event.timestamp).toLocaleTimeString()}]</span>{' '}
                    <span className="text-blue-500">[{event.type.toUpperCase()}]</span>{' '}
                    <span className="text-white">{event.action}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LogViewer; 