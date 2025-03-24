import React, { useState, useEffect, useRef, useCallback } from 'react';
import eventTracker, { getEvents, clearEvents, exportEvents, EVENT_TYPES } from '@/lib/eventTracker';

/**
 * LogViewer Component
 * 
 * Enhanced version with improved session logs display and better formatting
 */
const LogViewer = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('logs');
  const logContainerRef = useRef(null);
  const [filter, setFilter] = useState('all'); // 'all', 'session', 'error', 'warning', 'info'
  const [copySuccess, setCopySuccess] = useState(false);

  // Function to add a log entry, wrapped in useCallback to prevent recreation
  const addLogEntry = useCallback((type, args) => {
    const timestamp = new Date().toISOString().substr(11, 12);
    
    // Get message from args
    const argsArray = Array.from(args);
    
    // Check if this is a session log
    const isSessionLog = argsArray.some(arg => 
      typeof arg === 'string' && arg.includes('[SESSION]')
    );
    
    // Check if this is an error log
    const isErrorLog = type === 'error' || argsArray.some(arg => 
      typeof arg === 'string' && arg.includes('[ERROR]')
    );
    
    // Format the message better for objects
    const message = argsArray.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    // Use a more specific type for session logs
    const logType = isSessionLog ? 'session' : (isErrorLog ? 'error' : type);
    
    // Utiliser setTimeout pour éviter les mises à jour pendant le rendu
    setTimeout(() => {
      setLogs(prevLogs => [
        { id: Date.now(), type: logType, timestamp, message },
        ...prevLogs.slice(0, 299) // Keep last 300 logs
      ]);
    }, 0);
  }, []);

  // Effect to capture logs - Version simplifiée
  useEffect(() => {
    // Always intercept logs for this component
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleInfo = console.info;
    const originalConsoleDebug = console.debug;

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
    
    console.debug = (...args) => {
      originalConsoleDebug.apply(console, args);
      addLogEntry('debug', args);
    };

    // Cleanup
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      console.info = originalConsoleInfo;
      console.debug = originalConsoleDebug;
    };
  }, [addLogEntry]);

  // Effect to listen for events from the tracker
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleNewEvent = () => {
      setUserEvents(getEvents());
    };

    // Listen for events
    window.addEventListener('app:event_tracked', handleNewEvent);
    
    // Load existing events
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

  // Function to copy all logs to clipboard
  const copyAllLogs = () => {
    try {
      // Format the logs for copying
      const logsToExport = activeTab === 'logs' 
        ? filteredLogs.map(log => `[${log.timestamp}] [${log.type.toUpperCase()}] ${log.message}`).join('\n')
        : userEvents.map(event => {
            return `[${new Date(event.timestamp).toLocaleTimeString()}] [${event.type.toUpperCase()}] ${event.action}
${event.details ? JSON.stringify(event.details, null, 2) : ''}`;
          }).join('\n\n');
      
      // Copy to clipboard
      navigator.clipboard.writeText(logsToExport);
      
      // Show success message and hide it after 2 seconds
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error("Failed to copy logs:", error);
    }
  };

  // Get the appropriate color for each log type
  const getLogColor = (type) => {
    switch (type) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      case 'debug': return 'text-green-500';
      case 'session': return 'text-purple-400 font-medium';
      default: return 'text-gray-300';
    }
  };
  
  // Filter logs based on the selected filter
  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.type === filter;
  });
  
  // Count logs by type
  const sessionLogs = logs.filter(log => log.type === 'session').length;
  const errorLogs = logs.filter(log => log.type === 'error').length;
  const warningLogs = logs.filter(log => log.type === 'warn').length;
  const infoLogs = logs.filter(log => log.type === 'info' || log.type === 'debug').length;

  return (
    <div className="fixed bottom-0 right-0 z-50">
      {/* LogViewer Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-gray-800 text-white px-4 py-2 rounded-tl-lg flex items-center gap-2 hover:bg-gray-700 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Debug Logs {logs.length > 0 && `(${logs.length})`}
        {errorLogs > 0 && <span className="ml-1 text-red-400">[{errorLogs}]</span>}
      </button>
      
      {/* Log Viewer Panel */}
      {isExpanded && (
        <div className="bg-gray-900 border border-gray-700 w-[800px] max-w-full">
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
                onClick={copyAllLogs}
                className={`text-xs ${copySuccess ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'} text-white px-2 py-1 rounded flex items-center gap-1`}
              >
                {copySuccess ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                    Copy Logs
                  </>
                )}
              </button>
              <button
                onClick={() => exportEvents()}
                className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
              >
                Export
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
          
          {/* Console Logs Tab with Filters */}
          {activeTab === 'logs' && (
            <>
              <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
                <span className="text-xs text-gray-400">Filter:</span>
                <button
                  onClick={() => setFilter('all')}
                  className={`text-xs px-2 py-1 rounded ${filter === 'all' ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  All ({logs.length})
                </button>
                <button
                  onClick={() => setFilter('session')}
                  className={`text-xs px-2 py-1 rounded ${filter === 'session' ? 'bg-purple-800' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  Session ({sessionLogs}) 
                </button>
                <button
                  onClick={() => setFilter('error')}
                  className={`text-xs px-2 py-1 rounded ${filter === 'error' ? 'bg-red-800' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  Errors ({errorLogs})
                </button>
                <button
                  onClick={() => setFilter('warn')}
                  className={`text-xs px-2 py-1 rounded ${filter === 'warn' ? 'bg-yellow-800' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  Warnings ({warningLogs})
                </button>
                <button
                  onClick={() => setFilter('info')}
                  className={`text-xs px-2 py-1 rounded ${filter === 'info' ? 'bg-blue-800' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  Info ({infoLogs})
                </button>
              </div>
            
              <div 
                ref={logContainerRef}
                className="h-96 overflow-y-auto font-mono text-xs p-2 whitespace-pre-wrap"
              >
                {filteredLogs.length === 0 ? (
                  <div className="text-gray-500 italic text-center mt-4">No logs to display</div>
                ) : (
                  filteredLogs.map(log => (
                    <div key={log.id} className={`mb-2 pb-1 ${log.type === 'session' ? 'bg-purple-900/20 px-2 py-1 rounded' : ''}`}>
                      <span className="text-gray-500">[{log.timestamp}]</span>{' '}
                      <span className={getLogColor(log.type)}>[{log.type.toUpperCase()}]</span>{' '}
                      <span className={`${log.type === 'error' ? 'text-red-300' : log.type === 'session' ? 'text-purple-200' : 'text-white'}`}>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
          
          {/* Events Tab */}
          {activeTab === 'events' && (
            <div 
              className="h-96 overflow-y-auto font-mono text-xs p-2"
            >
              {userEvents.length === 0 ? (
                <div className="text-gray-500 italic text-center mt-4">No events to display</div>
              ) : (
                userEvents.map(event => (
                  <div key={event.id} className={`mb-2 pb-1 ${event.type === EVENT_TYPES.SESSION ? 'bg-purple-900/20 px-2 py-1 rounded' : ''}`}>
                    <span className="text-gray-500">[{new Date(event.timestamp).toLocaleTimeString()}]</span>{' '}
                    <span className={event.type === EVENT_TYPES.SESSION ? 'text-purple-400' : 'text-blue-500'}>
                      [{event.type.toUpperCase()}]
                    </span>{' '}
                    <span className="text-white">{event.action}</span>
                    <div className="mt-1 pl-4 text-gray-400">
                      {event.details && JSON.stringify(event.details, null, 2)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Hidden div for on-screen logger targets */}
      <div id="app-logger-content" className="hidden"></div>
    </div>
  );
};

module.exports = LogViewer; 