'use client';

import React, { useState, useEffect } from 'react';
import logger, { Logger } from '@/lib/logger';

export default function LogViewer() {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Subscribe to logger events
    const handleLog = (log: string) => {
      setLogs(prevLogs => [...prevLogs, log].slice(-100)); // Keep only last 100 logs
    };

    // Subscribe to toggle event
    const handleToggle = () => {
      setIsVisible(prev => !prev);
    };

    try {
      // Add event listeners
      window.addEventListener('toggle-logs', handleToggle);
      logger.subscribe(handleLog);

      // Log component mount
      logger.component('LogViewer', 'mounted');

      // Cleanup
      return () => {
        window.removeEventListener('toggle-logs', handleToggle);
        logger.unsubscribe(handleLog);
        logger.component('LogViewer', 'unmounted');
      };
    } catch (error) {
      console.error('Error in LogViewer setup:', error);
      return () => {
        window.removeEventListener('toggle-logs', handleToggle);
      };
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 w-96 max-h-[60vh] bg-gray-900 text-gray-100 rounded-lg shadow-xl overflow-hidden z-50">
      <div className="flex justify-between items-center p-2 bg-gray-800">
        <h3 className="text-sm font-medium">Application Logs</h3>
        <div className="space-x-2">
          <button
            onClick={() => {
              setLogs([]);
              logger.info('Logs cleared by user');
            }}
            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Clear
          </button>
          <button
            onClick={() => {
              setIsVisible(false);
              logger.component('LogViewer', 'closed');
            }}
            className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
      <div className="overflow-auto p-2 max-h-[calc(60vh-40px)]">
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No logs yet...</p>
        ) : (
          <pre className="text-xs font-mono whitespace-pre-wrap">
            {logs.join('\n')}
          </pre>
        )}
      </div>
    </div>
  );
} 