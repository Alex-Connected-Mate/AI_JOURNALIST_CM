'use client';

import { useEffect, useRef } from 'react';

interface SoundManagerProps {
  enabled: boolean;
}

const SoundManager: React.FC<SoundManagerProps> = ({ enabled }) => {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Initialiser le contexte audio seulement après interaction utilisateur
    const initAudioContext = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    };

    document.addEventListener('click', initAudioContext, { once: true });
    document.addEventListener('keydown', initAudioContext, { once: true });

    return () => {
      document.removeEventListener('click', initAudioContext);
      document.removeEventListener('keydown', initAudioContext);
    };
  }, [enabled]);

  // Fonction pour créer des sons synthétiques
  const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.1) => {
    if (!enabled || !audioContextRef.current) return;

    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      oscillator.type = type;

      // Envelope pour éviter les clics
      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, audioContextRef.current.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContextRef.current.currentTime + duration);

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration);
    } catch (error) {
      console.warn('Audio playback failed:', error);
    }
  };

  // Sons pour différentes actions
  const sounds = {
    startReading: () => {
      // Son d'ouverture agréable (accord majeur)
      playTone(523.25, 0.15, 'sine', 0.08); // C5
      setTimeout(() => playTone(659.25, 0.15, 'sine', 0.06), 50); // E5
      setTimeout(() => playTone(783.99, 0.2, 'sine', 0.04), 100); // G5
    },
    
    stopReading: () => {
      // Son de fermeture doux (descente harmonique)
      playTone(783.99, 0.1, 'sine', 0.06); // G5
      setTimeout(() => playTone(659.25, 0.1, 'sine', 0.04), 80); // E5
      setTimeout(() => playTone(523.25, 0.15, 'sine', 0.03), 160); // C5
    },

    progress: () => {
      // Son de progression subtil
      playTone(880, 0.08, 'sine', 0.03); // A5
    },

    achievement: () => {
      // Son de succès (arpège ascendant)
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((note, index) => {
        setTimeout(() => playTone(note, 0.12, 'sine', 0.05), index * 60);
      });
    }
  };

  // Exposer les sons globalement pour les autres composants
  useEffect(() => {
    if (enabled) {
      (window as any).readingSounds = sounds;
    } else {
      (window as any).readingSounds = {
        startReading: () => {},
        stopReading: () => {},
        progress: () => {},
        achievement: () => {}
      };
    }
  }, [enabled]);

  return null; // Ce composant ne rend rien visuellement
};

export default SoundManager;