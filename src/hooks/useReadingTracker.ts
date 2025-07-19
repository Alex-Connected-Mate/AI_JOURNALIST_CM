'use client';

import { useState, useEffect, useCallback } from 'react';

interface ReadingSettings {
  enableReadingNotifications: boolean;
  enableDynamicIsland: boolean;
  enableLiveActivity: boolean;
}

interface ReadingState {
  isReading: boolean;
  currentPostId: string | null;
  startTime: number | null;
  totalPostsToday: number;
  postsReadToday: number;
}

const STORAGE_KEY = 'readingTracker';
const SETTINGS_STORAGE_KEY = 'readingSettings';

export const useReadingTracker = () => {
  const [readingState, setReadingState] = useState<ReadingState>({
    isReading: false,
    currentPostId: null,
    startTime: null,
    totalPostsToday: 0,
    postsReadToday: 0
  });

  const [settings, setSettings] = useState<ReadingSettings>({
    enableReadingNotifications: true,
    enableDynamicIsland: true,
    enableLiveActivity: true
  });

  // Charger les paramètres depuis localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings));
        } catch (error) {
          console.error('Erreur lors du chargement des paramètres:', error);
        }
      }

      const savedState = localStorage.getItem(STORAGE_KEY);
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          // Vérifier si c'est le même jour
          const today = new Date().toDateString();
          const savedDate = parsed.date;
          
          if (savedDate === today) {
            setReadingState(prev => ({
              ...prev,
              totalPostsToday: parsed.totalPostsToday || 0,
              postsReadToday: parsed.postsReadToday || 0
            }));
          } else {
            // Nouveau jour, réinitialiser les compteurs
            const newState = {
              totalPostsToday: 0,
              postsReadToday: 0,
              date: today
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
          }
        } catch (error) {
          console.error('Erreur lors du chargement de l\'état:', error);
        }
      }
    }
  }, []);

  // Sauvegarder les paramètres
  const updateSettings = useCallback((newSettings: Partial<ReadingSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
    }
  }, [settings]);

  // Sauvegarder l'état
  const saveState = useCallback((state: ReadingState) => {
    if (typeof window !== 'undefined') {
      const dataToSave = {
        totalPostsToday: state.totalPostsToday,
        postsReadToday: state.postsReadToday,
        date: new Date().toDateString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }
  }, []);

  // Démarrer une session de lecture
  const startReading = useCallback((postId: string) => {
    const newState = {
      ...readingState,
      isReading: true,
      currentPostId: postId,
      startTime: Date.now()
    };
    setReadingState(newState);
    
    // Envoyer notification si activée
    if (settings.enableReadingNotifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('📖 Lecture démarrée', {
        body: `Vous commencez à lire un nouveau post. ${newState.totalPostsToday - newState.postsReadToday} posts restants aujourd'hui.`,
        icon: '/logo.png',
        tag: 'reading-start'
      });
    }
  }, [readingState, settings.enableReadingNotifications]);

  // Terminer une session de lecture
  const stopReading = useCallback(() => {
    if (!readingState.isReading || !readingState.currentPostId) return;

    const readingDuration = readingState.startTime ? Date.now() - readingState.startTime : 0;
    const minutes = Math.floor(readingDuration / 60000);

    const newState = {
      ...readingState,
      isReading: false,
      currentPostId: null,
      startTime: null,
      postsReadToday: readingState.postsReadToday + 1
    };
    
    setReadingState(newState);
    saveState(newState);

    // Notification de fin avec statistiques
    if (settings.enableReadingNotifications && 'Notification' in window && Notification.permission === 'granted') {
      const remaining = newState.totalPostsToday - newState.postsReadToday;
      new Notification('✅ Lecture terminée', {
        body: `Temps de lecture: ${minutes} min. ${remaining > 0 ? `${remaining} posts restants` : 'Tous les posts lus !'}`,
        icon: '/logo.png',
        tag: 'reading-end'
      });
    }
  }, [readingState, settings.enableReadingNotifications, saveState]);

  // Mettre à jour le nombre total de posts du jour
  const updateDailyPostCount = useCallback((count: number) => {
    const newState = {
      ...readingState,
      totalPostsToday: count
    };
    setReadingState(newState);
    saveState(newState);
  }, [readingState, saveState]);

  // Obtenir les statistiques
  const getStats = useCallback(() => {
    const remaining = Math.max(0, readingState.totalPostsToday - readingState.postsReadToday);
    const progress = readingState.totalPostsToday > 0 
      ? (readingState.postsReadToday / readingState.totalPostsToday) * 100 
      : 0;

    return {
      totalToday: readingState.totalPostsToday,
      readToday: readingState.postsReadToday,
      remaining,
      progress: Math.round(progress),
      isComplete: remaining === 0 && readingState.totalPostsToday > 0
    };
  }, [readingState]);

  // Marquer un post comme lu sans session active
  const markPostAsRead = useCallback(() => {
    const newState = {
      ...readingState,
      postsReadToday: readingState.postsReadToday + 1
    };
    setReadingState(newState);
    saveState(newState);
  }, [readingState, saveState]);

  // Réinitialiser les données du jour
  const resetDailyData = useCallback(() => {
    const newState = {
      ...readingState,
      isReading: false,
      currentPostId: null,
      startTime: null,
      totalPostsToday: 0,
      postsReadToday: 0
    };
    setReadingState(newState);
    saveState(newState);
  }, [readingState, saveState]);

  return {
    // State
    readingState,
    settings,
    stats: getStats(),
    
    // Actions
    startReading,
    stopReading,
    markPostAsRead,
    updateDailyPostCount,
    updateSettings,
    resetDailyData,
    
    // Computed values
    isReading: readingState.isReading,
    currentPostId: readingState.currentPostId,
    totalPostsRemaining: Math.max(0, readingState.totalPostsToday - readingState.postsReadToday)
  };
};