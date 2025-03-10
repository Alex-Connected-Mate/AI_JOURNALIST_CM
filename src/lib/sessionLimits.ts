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

const SUBSCRIPTION_LIMITS: Record<string, SessionLimits> = {
  free: {
    maxSessions: 3,
    maxParticipants: 20,
    maxAITokens: 100000,
    features: {
      customAI: false,
      analytics: false,
      export: false,
    },
  },
  basic: {
    maxSessions: 10,
    maxParticipants: 50,
    maxAITokens: 500000,
    features: {
      customAI: true,
      analytics: true,
      export: false,
    },
  },
  premium: {
    maxSessions: 50,
    maxParticipants: 100,
    maxAITokens: 2000000,
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
    // Get user profile and current session count
    const [profileResponse, sessionsResponse] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('sessions').select('count').eq('user_id', userId).not('status', 'eq', 'ended'),
    ]);

    if (profileResponse.error) throw profileResponse.error;
    if (sessionsResponse.error) throw sessionsResponse.error;

    const profile = profileResponse.data as UserProfile;
    const sessionCount = sessionsResponse.count || 0;

    // Get limits based on subscription
    const limits = SUBSCRIPTION_LIMITS[profile.subscription_status || 'free'];

    // Check if user can create more sessions
    if (limits.maxSessions !== -1 && sessionCount >= limits.maxSessions) {
      return {
        canCreate: false,
        reason: `Vous avez atteint la limite de ${limits.maxSessions} sessions simultanées pour votre abonnement ${profile.subscription_status}.`,
        limits,
      };
    }

    return {
      canCreate: true,
      limits,
    };
  } catch (error) {
    console.error('Error checking session limits:', error);
    return {
      canCreate: false,
      reason: 'Une erreur est survenue lors de la vérification des limites.',
      limits: SUBSCRIPTION_LIMITS.free,
    };
  }
}

export async function checkParticipantLimit(sessionId: string): Promise<{
  canJoin: boolean;
  reason?: string;
}> {
  try {
    // Get session and participant count
    const [sessionResponse, participantsResponse] = await Promise.all([
      supabase.from('sessions').select('user_id').eq('id', sessionId).single(),
      supabase.from('session_participants').select('count').eq('session_id', sessionId),
    ]);

    if (sessionResponse.error) throw sessionResponse.error;
    if (participantsResponse.error) throw participantsResponse.error;

    const userId = sessionResponse.data.user_id;
    const participantCount = participantsResponse.count || 0;

    // Get user's subscription limits
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', userId)
      .single();

    const limits = SUBSCRIPTION_LIMITS[profile?.subscription_status || 'free'];

    if (limits.maxParticipants !== -1 && participantCount >= limits.maxParticipants) {
      return {
        canJoin: false,
        reason: `La session a atteint sa limite de ${limits.maxParticipants} participants.`,
      };
    }

    return { canJoin: true };
  } catch (error) {
    console.error('Error checking participant limit:', error);
    return {
      canJoin: false,
      reason: 'Une erreur est survenue lors de la vérification des limites.',
    };
  }
}

export async function checkAIUsage(userId: string): Promise<{
  canUse: boolean;
  reason?: string;
  remainingTokens?: number;
}> {
  try {
    // Get user's subscription and current AI usage
    const [profileResponse, metricsResponse] = await Promise.all([
      supabase.from('users').select('subscription_status').eq('id', userId).single(),
      supabase.from('user_metrics').select('ai_tokens_used').eq('user_id', userId).single(),
    ]);

    if (profileResponse.error) throw profileResponse.error;

    const limits = SUBSCRIPTION_LIMITS[profileResponse.data.subscription_status || 'free'];
    const tokensUsed = metricsResponse.data?.ai_tokens_used || 0;

    if (limits.maxAITokens !== -1 && tokensUsed >= limits.maxAITokens) {
      return {
        canUse: false,
        reason: `Vous avez atteint votre limite de ${limits.maxAITokens} tokens AI pour ce mois.`,
        remainingTokens: 0,
      };
    }

    return {
      canUse: true,
      remainingTokens: limits.maxAITokens === -1 ? -1 : limits.maxAITokens - tokensUsed,
    };
  } catch (error) {
    console.error('Error checking AI usage:', error);
    return {
      canUse: false,
      reason: 'Une erreur est survenue lors de la vérification des limites.',
    };
  }
} 