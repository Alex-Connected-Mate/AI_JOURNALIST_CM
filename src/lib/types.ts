export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  institution: string | null;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  openai_api_key: string | null;
  use_own_api_key: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  role: 'user' | 'admin' | 'premium';
  subscription_status: 'free' | 'basic' | 'premium' | 'enterprise';
  subscription_end_date: string | null;
  stripe_customer_id: string | null;
  last_login: string | null;
}

export interface SessionData {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'active' | 'completed';
  max_participants: number;
  created_at: string;
  updated_at: string;
  settings: {
    ai_configuration?: {
      model: string;
      temperature: number;
      max_tokens: number;
      presence_penalty: number;
      frequency_penalty: number;
      custom_instructions: string | null;
    };
    participant_settings?: {
      anonymity_level: 'anonymous' | 'semi-anonymous' | 'non-anonymous';
      require_approval: boolean;
      allow_chat: boolean;
      allow_reactions: boolean;
    };
  };
}

export interface AIConfiguration {
  id: string;
  session_id: string;
  ai_type: string;
  prompt_template: string;
  temperature: number;
  max_tokens: number;
  created_at: string;
  updated_at: string;
}

export interface SessionAnalytics {
  id: string;
  session_id: string;
  analysis_type: string;
  data: Record<string, any>;
  created_at: string;
}

export interface SessionExport {
  id: string;
  session_id: string;
  format: string;
  file_url: string;
  created_at: string;
  created_by: string;
}

export interface UserMetrics {
  id: string;
  user_id: string;
  total_sessions: number;
  total_participants: number;
  storage_used: number;
  ai_tokens_used: number;
  ai_requests_count: number;
  last_active: string;
  feature_usage: {
    ai_interactions: number;
    exports: number;
  };
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

// Types pour le système de cache
export interface Session {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  status: 'active' | 'completed' | 'archived';
  settings: Record<string, any>;
}

export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'user' | 'guest';
  created_at: string;
  last_seen?: string;
}

export interface Message {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  type: 'text' | 'image' | 'file';
  created_at: string;
  metadata?: Record<string, any>;
}

export interface Analytics {
  id: string;
  session_id: string;
  metrics: {
    participants: number;
    messages: number;
    active_time: number;
    engagement_score: number;
  };
  insights: {
    key_topics: string[];
    sentiment_score: number;
    participation_distribution: Record<string, number>;
  };
  created_at: string;
  updated_at: string;
}

export interface CacheConfig {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  refreshInterval?: number;
  dedupingInterval?: number;
  errorRetryCount?: number;
}

export type CacheKeyType = 'session' | 'user' | 'messages' | 'analytics';

export interface CacheKey {
  type: CacheKeyType;
  id?: string;
  params?: Record<string, any>;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface SessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  joined_at: string;
  last_active: string;
  status: 'active' | 'inactive' | 'left';
  role: 'host' | 'participant' | 'observer';
  metadata?: Record<string, any>;
}

export interface RealtimeSessionActions {
  sendMessage: (content: string) => Promise<Message>;
  updateSession: (updates: Partial<Session>) => Promise<Session>;
  refresh: () => Promise<void>;
} 