'use client';

import React, { useState, useEffect } from 'react';
import logger from '@/lib/logger';

export default function LogViewer() {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [localLogs, setLocalLogs] = useState<string[]>(() => {
    // Try to load logs from localStorage on init
    if (typeof window !== 'undefined') {
      try {
        const storedLogs = localStorage.getItem('app_logs');
        return storedLogs ? JSON.parse(storedLogs) : [];
      } catch (e) {
        console.error('Failed to load logs from localStorage:', e);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    // Subscribe to logger events if the subscribe method exists
    const handleLog = (log: string) => {
      setLogs(prevLogs => [...prevLogs, log].slice(-100)); // Keep only last 100 logs
    };

    // Subscribe to toggle event
    const handleToggle = () => {
      setIsVisible(prev => !prev);
    };

    try {
      // Add toggle event listener
      if (typeof window !== 'undefined') {
        window.addEventListener('toggle-logs', handleToggle);
      }
      
      // Try to subscribe to logger, but use a fallback if it fails
      if (logger && typeof logger.subscribe === 'function') {
        logger.subscribe(handleLog);
        
        // Also try to log component mount if component method exists
        if (typeof logger.component === 'function') {
          try {
            logger.component('LogViewer', 'mounted');
          } catch (e) {
            console.error('Failed to log component mount:', e);
          }
        }
      } else {
        console.error('Logger subscription failed: logger.subscribe is not a function');
        
        // Set up a fallback using console method overrides
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;
        const originalConsoleInfo = console.info;
        
        // Create timestamp formatter
        const formatTimestamp = () => {
          const now = new Date();
          return now.toISOString().split('T')[1].split('.')[0];
        };
        
        // Override console methods
        console.log = (...args) => {
          originalConsoleLog.apply(console, args);
          const log = `[${formatTimestamp()}] [INFO] ${args.join(' ')}`;
          setLogs(prevLogs => [...prevLogs, log].slice(-100));
        };
        
        console.error = (...args) => {
          originalConsoleError.apply(console, args);
          const log = `[${formatTimestamp()}] [ERROR] ${args.join(' ')}`;
          setLogs(prevLogs => [...prevLogs, log].slice(-100));
        };
        
        console.warn = (...args) => {
          originalConsoleWarn.apply(console, args);
          const log = `[${formatTimestamp()}] [WARN] ${args.join(' ')}`;
          setLogs(prevLogs => [...prevLogs, log].slice(-100));
        };
        
        console.info = (...args) => {
          originalConsoleInfo.apply(console, args);
          const log = `[${formatTimestamp()}] [INFO] ${args.join(' ')}`;
          setLogs(prevLogs => [...prevLogs, log].slice(-100));
        };
        
        // Return cleanup for console overrides
        return () => {
          if (typeof window !== 'undefined') {
            window.removeEventListener('toggle-logs', handleToggle);
          }
          
          console.log = originalConsoleLog;
          console.error = originalConsoleError;
          console.warn = originalConsoleWarn;
          console.info = originalConsoleInfo;
        };
      }

      // Cleanup
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('toggle-logs', handleToggle);
        }
        
        // Only try to unsubscribe if subscribe worked
        if (logger && typeof logger.unsubscribe === 'function') {
          try {
            logger.unsubscribe(handleLog);
            
            if (typeof logger.component === 'function') {
              logger.component('LogViewer', 'unmounted');
            }
          } catch (e) {
            console.error('Failed to unsubscribe from logger:', e);
          }
        }
      };
    } catch (error) {
      console.error('Error in LogViewer setup:', error);
      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('toggle-logs', handleToggle);
        }
      };
    }
  }, []);

  // Load logs from localStorage periodically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const loadLocalLogs = () => {
      try {
        const storedLogs = localStorage.getItem('app_logs');
        if (storedLogs) {
          const parsedLogs = JSON.parse(storedLogs);
          if (Array.isArray(parsedLogs)) {
            setLocalLogs(parsedLogs);
          }
        }
      } catch (e) {
        console.error('Failed to load logs from localStorage:', e);
      }
    };
    
    // Initial load
    loadLocalLogs();
    
    // Set up periodic refresh
    const intervalId = setInterval(loadLocalLogs, 2000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Combine all logs from different sources
  const allLogs = [...logs, ...localLogs.filter(log => !logs.includes(log))];

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 w-96 max-h-[60vh] bg-gray-900 text-gray-100 rounded-lg shadow-xl overflow-hidden z-50">
      <div className="flex justify-between items-center p-2 bg-gray-800">
        <h3 className="text-sm font-medium">Application Logs</h3>
        <div className="space-x-2">
          <button
            onClick={() => {
              setLogs([]);
              setLocalLogs([]);
              
              // Try to clear localStorage logs too
              if (typeof window !== 'undefined') {
                try {
                  localStorage.removeItem('app_logs');
                } catch (e) {
                  console.error('Failed to clear logs from localStorage:', e);
                }
              }
              
              if (logger && typeof logger.info === 'function') {
                try {
                  logger.info('Logs cleared by user');
                } catch (e) {
                  console.error('Failed to log clear action:', e);
                }
              }
            }}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear
          </button>
          <button
            onClick={() => {
              setIsVisible(false);
              if (logger && typeof logger.component === 'function') {
                try {
                  logger.component('LogViewer', 'closed');
                } catch (e) {
                  console.error('Failed to log component close:', e);
                }
              }
            }}
            className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
      <div className="overflow-auto p-2 max-h-[calc(60vh-40px)]">
        {allLogs.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No logs yet...</p>
        ) : (
          <pre className="text-xs font-mono whitespace-pre-wrap">
            {allLogs.join('\n')}
          </pre>
        )}
      </div>
    </div>
  );
} 