import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * LogViewer Component
 * 
 * A component that displays application logs in a collapsible panel
 * that doesn't interfere with the main UI.
 */
const LogViewer = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [logs, setLogs] = useState([]);
  const logContainerRef = useRef(null);

  // Function to add a log entry, wrapped in useCallback to prevent recreation
  const addLogEntry = useCallback((type, args) => {
    const timestamp = new Date().toISOString().substr(11, 12);
    const message = Array.from(args).map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    
    // Use setTimeout to avoid state updates during render
    setTimeout(() => {
      setLogs(prevLogs => [
        { id: Date.now(), type, timestamp, message },
        ...prevLogs.slice(0, 99) // Keep only the last 100 logs
      ]);
    }, 0);
  }, []);

  // Effect to capture logs
  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleInfo = console.info;

    // Override console methods
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

  // Auto-scroll to the bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current && isExpanded) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs, isExpanded]);

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
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

  return (
    <div className="fixed bottom-0 right-0 z-50">
      {/* Log Viewer Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-gray-800 text-white px-4 py-2 rounded-tl-lg flex items-center gap-2 hover:bg-gray-700 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Logs {logs.length > 0 && `(${logs.length})`}
      </button>
      
      {/* Log Viewer Panel */}
      {isExpanded && (
        <div className="bg-gray-900 border border-gray-700 w-[600px] max-w-full">
          <div className="flex justify-between items-center p-2 border-b border-gray-700">
            <h3 className="text-white font-medium">Application Logs</h3>
            <div className="flex gap-2">
              <button
                onClick={clearLogs}
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
        </div>
      )}
    </div>
  );
};

export default LogViewer; 