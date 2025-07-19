'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';

interface ReadingProgressProps {
  isReading: boolean;
  currentPostId?: string;
  totalPostsRemaining: number;
  onDismiss: () => void;
  settings: {
    enableReadingNotifications: boolean;
    enableDynamicIsland: boolean;
    enableLiveActivity: boolean;
  };
}

interface ReadingSession {
  postId: string;
  startTime: number;
  title: string;
}

const ReadingProgressTracker: React.FC<ReadingProgressProps> = ({
  isReading,
  currentPostId,
  totalPostsRemaining,
  onDismiss,
  settings
}) => {
  const [currentSession, setCurrentSession] = useState<ReadingSession | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);

  // Demander permission pour les notifications
  useEffect(() => {
    if (settings.enableReadingNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [settings.enableReadingNotifications]);

  // Gérer le début/fin de lecture
  useEffect(() => {
    if (isReading && currentPostId && !currentSession) {
      const session: ReadingSession = {
        postId: currentPostId,
        startTime: Date.now(),
        title: `Post ${currentPostId}`
      };
      setCurrentSession(session);
      setIsVisible(true);
      setTimeSpent(0);

      // Notification de début de lecture
      if (settings.enableReadingNotifications && Notification.permission === 'granted') {
        new Notification('📖 Lecture en cours', {
          body: `Vous lisez actuellement un post. ${totalPostsRemaining} posts restants aujourd'hui.`,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: 'reading-session'
        });
      }
    } else if (!isReading && currentSession) {
      // Fin de lecture
      setCurrentSession(null);
      setTimeout(() => setIsVisible(false), 2000); // Fade out après 2 secondes
    }
  }, [isReading, currentPostId, currentSession, totalPostsRemaining, settings.enableReadingNotifications]);

  // Timer pour le temps de lecture
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (currentSession) {
      interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - currentSession.startTime) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSession]);

  // Formatage du temps
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Dynamic Island Component
  const DynamicIsland = () => {
    if (!settings.enableDynamicIsland || !isVisible) return null;

    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out">
        <div className="bg-black text-white px-6 py-3 rounded-full flex items-center space-x-3 shadow-lg backdrop-blur-sm bg-opacity-90 min-w-64">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div className="flex-1">
            <div className="text-sm font-medium">
              {isReading ? '📖 Lecture en cours' : '✅ Lecture terminée'}
            </div>
            <div className="text-xs text-gray-300">
              {isReading ? formatTime(timeSpent) : 'Session terminée'}
            </div>
          </div>
          <div className="text-xs bg-gray-800 px-2 py-1 rounded-full">
            {totalPostsRemaining}
          </div>
        </div>
      </div>
    );
  };

  // Live Activity Component
  const LiveActivity = () => {
    if (!settings.enableLiveActivity || !isVisible) return null;

    return (
      <div className="fixed bottom-6 right-6 z-40 transition-all duration-300 ease-in-out">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Session de lecture
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Temps: {formatTime(timeSpent)}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  Posts restants: {totalPostsRemaining}
                </div>
              </div>

              {totalPostsRemaining > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.max(10, 100 - (totalPostsRemaining * 10))}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={onDismiss}
              className="ml-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <DynamicIsland />
      <LiveActivity />
    </>
  );
};

export default ReadingProgressTracker;