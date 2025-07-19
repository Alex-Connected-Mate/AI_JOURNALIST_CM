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
  const [isDismissed, setIsDismissed] = useState(false);

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
      setIsDismissed(false);

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
      // Fin de lecture avec délai pour l'animation
      setTimeout(() => {
        setCurrentSession(null);
        setTimeout(() => setIsVisible(false), 300);
      }, 1000);
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

  // Gérer la fermeture manuelle
  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss();
  };

  // Dynamic Island Component - Style iOS avec design sophistiqué
  const DynamicIsland = () => {
    if (!settings.enableDynamicIsland || !isVisible || isDismissed) return null;

    return (
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-in-top">
        <div className="relative group">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-black/20 rounded-full blur-xl scale-110 opacity-60 animate-pulse-glow"></div>
          
          {/* Main island */}
          <div className="relative bg-black/90 backdrop-blur-2xl text-white rounded-full flex items-center space-x-4 shadow-2xl border border-white/10 animate-morph-in shimmer-effect">
            <div className="pl-6 pr-2 py-3 flex items-center space-x-3">
              {/* Reading indicator */}
              <div className="relative">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
              </div>
              
              {/* Content */}
              <div className="flex flex-col">
                <div className="text-sm font-medium font-bricolage">
                  {isReading ? '📖 Lecture active' : '✅ Terminé'}
                </div>
                <div className="text-xs text-white/70 font-mono">
                  {formatTime(timeSpent)}
                </div>
              </div>
            </div>
            
            {/* Posts counter with morphing animation */}
            <div className="relative">
              <div className="bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 mr-6 border border-white/10">
                <div className="text-xs font-semibold font-mono text-center min-w-[16px]">
                  {totalPostsRemaining}
                </div>
              </div>
              {totalPostsRemaining > 0 && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
              )}
            </div>
          </div>
          
          {/* Interaction hint */}
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="text-xs text-gray-600 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 shadow-lg border border-gray-200">
              Lecture en cours...
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Live Activity Component - Design glassmorphism avancé
  const LiveActivity = () => {
    if (!settings.enableLiveActivity || !isVisible || isDismissed) return null;

    const progressPercentage = totalPostsRemaining > 0 ? 
      Math.max(10, Math.min(90, ((10 - totalPostsRemaining) / 10) * 100)) : 100;

    return (
      <div className="fixed bottom-8 right-8 z-40 animate-slide-in-right">
        <div className="relative group">
          {/* Glow background */}
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-emerald-600/20 rounded-2xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-300 animate-pulse"></div>
          
          {/* Main container */}
          <div className="relative bg-white/80 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/50 p-5 max-w-xs animate-morph-in shimmer-effect">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full animate-ping opacity-30"></div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 font-bricolage">
                    Session active
                  </h3>
                  <p className="text-xs text-gray-600">
                    Lecture en cours
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100/50"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-3 border border-blue-200/50">
                <div className="text-lg font-bold text-blue-700 font-mono">
                  {formatTime(timeSpent)}
                </div>
                <div className="text-xs text-blue-600/80 font-medium">
                  Temps écoulé
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-xl p-3 border border-orange-200/50">
                <div className="text-lg font-bold text-orange-700 font-mono">
                  {totalPostsRemaining}
                </div>
                <div className="text-xs text-orange-600/80 font-medium">
                  Posts restants
                </div>
              </div>
            </div>

            {/* Progress Section */}
            {totalPostsRemaining > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">Progression du jour</span>
                  <span className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                    {Math.round(progressPercentage)}%
                  </span>
                </div>
                
                {/* Advanced Progress Bar */}
                <div className="relative">
                  <div className="w-full bg-gray-200/60 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 transition-all duration-1000 ease-out relative"
                      style={{ width: `${progressPercentage}%` }}
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Progress indicator dot */}
                  <div 
                    className="absolute top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-lg border border-gray-300 transition-all duration-1000"
                    style={{ left: `${progressPercentage}%`, marginLeft: '-3px' }}
                  ></div>
                </div>
              </div>
            )}

            {/* Motivational message */}
            <div className="mt-4 pt-3 border-t border-gray-200/50">
              <p className="text-xs text-gray-600 text-center">
                {totalPostsRemaining === 0 ? (
                  <span className="text-emerald-600 font-medium">🎉 Tous les posts lus !</span>
                ) : totalPostsRemaining === 1 ? (
                  <span className="text-orange-600 font-medium">⚡ Plus qu'un post !</span>
                ) : (
                  <span>👏 Continuez comme ça !</span>
                )}
              </p>
            </div>
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