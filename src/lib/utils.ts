import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for conditionally joining CSS class names with Tailwind support
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to locale string with options
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions) {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  };
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(undefined, defaultOptions);
}

/**
 * Truncate a string to a maximum length
 */
export function truncateString(str: string, maxLength: number) {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Pause execution for a specified time in milliseconds
 */
export async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Utilitaires communs pour l'application
 */

// Configuration des fonctionnalités de l'application
export const appFeatures = {
  // Authentification
  auth: {
    enabled: true,
    requireEmailVerification: false,
    allowPasswordReset: true,
    allowSignup: true,
  },
  
  // Fonctionnalités expérimentales
  experimental: {
    realtime: true,
    offlineMode: false,
    analytics: true,
  },
  
  // Fonctionnalités de débogage
  debug: {
    verboseLogging: process.env.NODE_ENV !== 'production',
    showDevTools: process.env.NODE_ENV !== 'production',
  }
};

/**
 * Vérifie si l'exécution est côté client (navigateur)
 */
export const isClient = typeof window !== 'undefined';

/**
 * Vérifie si l'exécution est côté serveur (Node.js)
 */
export const isServer = !isClient;

/**
 * Vérifie si l'environnement est en production
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * Récupère une valeur depuis le localStorage avec gestion de la sérialisation
 * @param key - La clé à récupérer
 * @param defaultValue - Valeur par défaut si la clé n'existe pas
 */
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (!isClient) return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Enregistre une valeur dans le localStorage avec gestion de la sérialisation
 * @param key - La clé à enregistrer
 * @param value - La valeur à stocker
 */
export function setToStorage<T>(key: string, value: T): void {
  if (!isClient) return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error storing ${key} in localStorage:`, error);
  }
}

/**
 * Supprime une clé du localStorage
 * @param key - La clé à supprimer
 */
export function removeFromStorage(key: string): void {
  if (!isClient) return;
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
}

/**
 * Retarde l'exécution d'une fonction pour limiter le nombre d'appels
 * @param func - La fonction à débouncer
 * @param wait - Le délai d'attente en ms
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
} 