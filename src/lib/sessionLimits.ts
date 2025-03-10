import { supabase } from './supabase';
import { UserProfile } from './types';

interface SessionLimits {
  maxSessions: number;
  maxParticipants: number;
  maxAITokens: number;
  features: {
    customAI: boolean;
    analytics: boolean;
    export: boolean;
  };
}

// Configuration modifiée pour permettre des sessions et participants illimités pour tous
const SUBSCRIPTION_LIMITS: Record<string, SessionLimits> = {
  free: {
    maxSessions: -1, // unlimited
    maxParticipants: -1, // unlimited
    maxAITokens: -1, // unlimited
    features: {
      customAI: true,
      analytics: true,
      export: true,
    },
  },
  basic: {
    maxSessions: -1, // unlimited
    maxParticipants: -1, // unlimited
    maxAITokens: -1, // unlimited
    features: {
      customAI: true,
      analytics: true,
      export: true,
    },
  },
  premium: {
    maxSessions: -1, // unlimited
    maxParticipants: -1, // unlimited
    maxAITokens: -1, // unlimited
    features: {
      customAI: true,
      analytics: true,
      export: true,
    },
  },
  enterprise: {
    maxSessions: -1, // unlimited
    maxParticipants: -1, // unlimited
    maxAITokens: -1, // unlimited
    features: {
      customAI: true,
      analytics: true,
      export: true,
    },
  },
};

export async function checkSessionLimits(userId: string): Promise<{
  canCreate: boolean;
  reason?: string;
  limits: SessionLimits;
}> {
  try {
    // Toujours retourner que l'utilisateur peut créer des sessions
    return {
      canCreate: true,
      limits: SUBSCRIPTION_LIMITS.free, // Utiliser les limites 'free' qui sont maintenant illimitées
    };
  } catch (error) {
    console.error('Error checking session limits:', error);
    // Même en cas d'erreur, permettre la création
    return {
      canCreate: true,
      limits: SUBSCRIPTION_LIMITS.free,
    };
  }
}

export async function checkParticipantLimit(sessionId: string): Promise<{
  canJoin: boolean;
  reason?: string;
}> {
  // Toujours permettre aux participants de rejoindre
  return { canJoin: true };
}

export async function checkAIUsage(userId: string): Promise<{
  canUse: boolean;
  reason?: string;
  remainingTokens?: number;
}> {
  // Toujours permettre l'utilisation de l'IA
  return {
    canUse: true,
    remainingTokens: -1, // illimité
  };
} 