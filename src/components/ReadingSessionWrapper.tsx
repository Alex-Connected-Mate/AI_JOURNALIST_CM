'use client';

import React, { useEffect, useState } from 'react';
import { useReadingTracker } from '@/hooks/useReadingTracker';
import ReadingProgressTracker from './ReadingProgressTracker';

interface ReadingSessionWrapperProps {
  children: React.ReactNode;
  postId?: string;
  isPostPage?: boolean;
  totalPostsAvailable?: number;
  className?: string;
}

const ReadingSessionWrapper: React.FC<ReadingSessionWrapperProps> = ({
  children,
  postId,
  isPostPage = false,
  totalPostsAvailable = 0,
  className = ''
}) => {
  const {
    isReading,
    currentPostId,
    totalPostsRemaining,
    settings,
    startReading,
    stopReading,
    updateDailyPostCount,
    stats
  } = useReadingTracker();

  const [isDismissed, setIsDismissed] = useState(false);

  // Mettre à jour le nombre total de posts disponibles
  useEffect(() => {
    if (totalPostsAvailable > 0) {
      updateDailyPostCount(totalPostsAvailable);
    }
  }, [totalPostsAvailable, updateDailyPostCount]);

  // Détecter quand l'utilisateur arrive sur une page de post
  useEffect(() => {
    if (isPostPage && postId && !isReading) {
      startReading(postId);
    }
  }, [isPostPage, postId, isReading, startReading]);

  // Détecter quand l'utilisateur quitte une page de post
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isReading && currentPostId) {
        stopReading();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isReading) {
        // L'utilisateur a basculé vers un autre onglet/app
        // On peut choisir de continuer ou d'arrêter le suivi
        // Ici on continue mais on pourrait arrêter
      }
    };

    // Détecter la navigation
    const handlePopState = () => {
      if (isReading && currentPostId) {
        stopReading();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isReading, currentPostId, stopReading]);

  // Gérer la fermeture manuelle
  const handleDismiss = () => {
    setIsDismissed(true);
    setTimeout(() => setIsDismissed(false), 30000); // Réapparaît après 30 secondes
  };

  return (
    <div className={className}>
      {children}
      
      {/* Afficher le tracker seulement si pas dismissé et si une session est active ou si il y a des posts restants */}
      {!isDismissed && (isReading || totalPostsRemaining > 0) && (
        <ReadingProgressTracker
          isReading={isReading}
          currentPostId={currentPostId || undefined}
          totalPostsRemaining={totalPostsRemaining}
          onDismiss={handleDismiss}
          settings={settings}
        />
      )}

      {/* Boutons de développement/test (à supprimer en production) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50 space-y-2">
          <div className="bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs">
            <div>Lecture: {isReading ? 'Oui' : 'Non'}</div>
            <div>Post: {currentPostId || 'Aucun'}</div>
            <div>Restants: {totalPostsRemaining}</div>
            <div>Lus: {stats.readToday}/{stats.totalToday}</div>
          </div>
          <div className="space-y-1">
            {!isReading ? (
              <button
                onClick={() => startReading('test-post-' + Date.now())}
                className="w-full px-3 py-1 bg-green-600 text-white text-xs rounded"
              >
                Test Start
              </button>
            ) : (
              <button
                onClick={stopReading}
                className="w-full px-3 py-1 bg-red-600 text-white text-xs rounded"
              >
                Test Stop
              </button>
            )}
            <button
              onClick={() => updateDailyPostCount(10)}
              className="w-full px-3 py-1 bg-blue-600 text-white text-xs rounded"
            >
              Set 10 Posts
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadingSessionWrapper;