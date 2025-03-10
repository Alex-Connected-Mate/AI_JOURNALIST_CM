export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  institution: string | null;
  title: string | null;
  bio: string | null;
  avatar_url: string | null;
  openai_api_key: string | null;
  role: 'user' | 'admin' | 'premium' | null;
  subscription_status: 'free' | 'basic' | 'premium' | 'enterprise' | null;
  subscription_end_date: string | null;
  stripe_customer_id: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
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

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'expired';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: Record<string, any>;
  stripe_price_id_monthly: string;
  stripe_price_id_yearly: string;
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