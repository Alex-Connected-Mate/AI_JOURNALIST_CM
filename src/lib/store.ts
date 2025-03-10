import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User as SupabaseUser, AuthError, AuthResponse, PostgrestError } from '@supabase/supabase-js';
import { supabase, signIn, signOut, getSessions, createSession as createSessionApi, getUserProfile, updateUserProfile, uploadProfileImage, SessionData } from './supabase';
import { UserProfile, AIConfiguration, SessionAnalytics, UserMetrics, Subscription, SubscriptionPlan, Notification } from './types';
import { loadStripe } from '@stripe/stripe-js';

// Function to log store actions if not in production
const logAction = (action: string, data?: any) => {
  if (typeof window !== 'undefined') {
    console.log(`[STORE] ${action}`, data || '');
  }
};

// Define the user state store
interface UserState {
  user: SupabaseUser | null;
  isLoading: boolean;
  setUser: (user: SupabaseUser | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      setUser: (user) => {
        logAction('setUser', { userId: user?.id });
        set({ user });
      },
      setLoading: (loading) => {
        logAction('setLoading', { loading });
        set({ isLoading: loading });
      },
    }),
    {
      name: 'user-storage',
    }
  )
);

// User type definition for our app
export type User = {
  id: string;
  email: string;
  full_name?: string;
  institution?: string;
  title?: string;
  bio?: string;
  avatar_url?: string;
};

// Session type definition
export type Session = {
  id: string;
  user_id: string;
  created_at: string;
  settings?: {
    title?: string;
    description?: string;
    persona?: string;
    tone?: string;
    output_format?: string;
    audience?: string;
    color_scheme?: string;
    emoji?: string;
  };
  name?: string;
  institution?: string;
  professorName?: string;
  showProfessorName?: boolean;
  image?: string;
  profileMode?: 'anonymous' | 'semi-anonymous' | 'non-anonymous';
  color?: string;
  emoji?: string;
  maxParticipants?: number;
  content?: string[];
};

// Mock sessions for demo mode
const mockSessions: Session[] = [
  {
    id: 'demo-session-1',
    created_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    user_id: 'demo-user-id',
    settings: {
      title: 'Sample Business Report',
      description: 'Quarterly performance analysis for Q2 2023',
      persona: 'business_analyst',
      tone: 'professional',
      output_format: 'report',
      audience: 'executives',
    },
  },
];

interface AppState {
  user: SupabaseUser | null;
  userProfile: UserProfile | null;
  userMetrics: UserMetrics | null;
  subscription: Subscription | null;
  notifications: Notification[];
  sessions: Session[];
  loading: boolean;
  error: string | null;
  authChecked: boolean;
  
  // Authentication actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: SupabaseUser | null) => void;
  
  // Profile actions
  fetchUserProfile: () => Promise<void>;
  fetchUserMetrics: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ data: UserProfile | null; error: PostgrestError | null }>;
  uploadAvatar: (file: File) => Promise<{ url: string | null; error: PostgrestError | null }>;
  
  // Subscription management
  fetchSubscription: () => Promise<void>;
  updateSubscription: (planId: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  
  // AI Configuration
  saveAIConfiguration: (config: Partial<AIConfiguration>) => Promise<void>;
  getAIConfiguration: (sessionId: string) => Promise<AIConfiguration | null>;
  
  // Analytics
  saveSessionAnalytics: (analytics: Partial<SessionAnalytics>) => Promise<void>;
  getSessionAnalytics: (sessionId: string) => Promise<SessionAnalytics[]>;
  
  // Notifications
  fetchNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  
  // Session actions
  fetchSessions: () => Promise<void>;
  createSession: (sessionData: Partial<SessionData>) => Promise<{ data: Session | null; error: PostgrestError | null }>;
  setError: (error: string | null) => void;
  setAuthChecked: (checked: boolean) => void;
}

// Create the store
export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      userProfile: null,
      userMetrics: null,
      subscription: null,
      notifications: [],
      sessions: [],
      loading: false,
      error: null,
      authChecked: false,
      
      login: async (email: string, password: string) => {
        logAction('login attempt', { email });
        set({ loading: true, error: null });
        try {
          const { data, error } = await signIn(email, password) as AuthResponse;
          
          if (error) {
            logAction('login failed', { error: error.message });
            set({ error: error.message, loading: false });
            return;
          }
          
          if (data?.user) {
            logAction('login successful', { userId: data.user.id });
            set({ 
              user: { 
                id: data.user.id, 
                email: data.user.email || '' 
              },
              loading: false 
            });
            
            // Fetch sessions after login
            get().fetchSessions();
            
            // Fetch user profile after login
            get().fetchUserProfile();
            get().fetchUserMetrics();
            get().fetchSubscription();
            get().fetchNotifications();
          }
        } catch (err) {
          const error = err as AuthError;
          logAction('login unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
        }
      },
      
      logout: async () => {
        logAction('logout attempt');
        set({ loading: true, error: null });
        try {
          const { error } = await signOut() as AuthResponse;
          
          if (error) {
            logAction('logout failed', { error: error.message });
            set({ error: error.message, loading: false });
            return;
          }
          
          logAction('logout successful');
          set({ user: null, userProfile: null, sessions: [], loading: false, userMetrics: null, subscription: null, notifications: [] });
        } catch (err) {
          const error = err as AuthError;
          logAction('logout unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
        }
      },
      
      setUser: (user: SupabaseUser | null) => {
        logAction('setUser', { userId: user?.id });
        set({ user });
      },
      
      fetchUserProfile: async () => {
        const { user } = get();
        if (!user) return;
        
        logAction('fetchUserProfile', { userId: user.id });
        set({ loading: true });
        
        try {
          const { data, error } = await getUserProfile(user.id);
          
          if (error) {
            logAction('fetchUserProfile failed', { error: error.message });
            set({ error: error.message, loading: false });
            return;
          }
          
          logAction('fetchUserProfile successful', { profileData: data });
          set({ userProfile: data, loading: false });
        } catch (err) {
          const error = err as PostgrestError;
          logAction('fetchUserProfile unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
        }
      },
      
      fetchUserMetrics: async () => {
        const { user } = get();
        if (!user) return;
        
        try {
          const { data, error } = await supabase
            .from('user_metrics')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (error) throw error;
          set({ userMetrics: data });
        } catch (err) {
          const error = err as PostgrestError;
          logAction('fetchUserMetrics unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
        }
      },
      
      updateProfile: async (data) => {
        const { user } = get();
        if (!user) {
          return { data: null, error: null };
        }
        
        logAction('updateProfile attempt', { userId: user.id, profileData: data });
        set({ loading: true });
        
        try {
          const { error } = await updateUserProfile(user.id, data);
          
          if (error) {
            logAction('updateProfile failed', { error: error.message });
            set({ error: error.message, loading: false });
            return { data: null, error };
          }
          
          logAction('updateProfile successful');
          set({ loading: false });
          await get().fetchUserProfile();
          return { data: userProfile, error: null };
        } catch (err) {
          const error = err as PostgrestError;
          logAction('updateProfile unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
          return { data: null, error };
        }
      },
      
      uploadAvatar: async (file: File) => {
        const { user } = get();
        if (!user) {
          return { url: null, error: null };
        }
        
        logAction('uploadAvatar attempt', { userId: user.id });
        set({ loading: true });
        
        try {
          const { data, error } = await uploadProfileImage(user.id, file);
          
          if (error) {
            logAction('uploadAvatar failed', { error: error.message });
            set({ error: error.message, loading: false });
            return { url: null, error };
          }
          
          logAction('uploadAvatar successful', { url: data });
          set({ loading: false });
          return { url: data, error: null };
        } catch (err) {
          const error = err as PostgrestError;
          logAction('uploadAvatar unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
          return { url: null, error };
        }
      },
      
      fetchSubscription: async () => {
        const { user } = get();
        if (!user) return;
        
        try {
          const { data, error } = await supabase
            .from('subscriptions')
            .select('*, subscription_plans(*)')
            .eq('user_id', user.id)
            .single();
          
          if (error) throw error;
          set({ subscription: data });
        } catch (err) {
          const error = err as PostgrestError;
          logAction('fetchSubscription unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
        }
      },
      
      updateSubscription: async (planId) => {
        const { user } = get();
        if (!user) return;
        
        try {
          const response = await fetch('/api/stripe/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planId, userId: user.id }),
          });

          const { sessionId } = await response.json();
          const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
          await stripe?.redirectToCheckout({ sessionId });
        } catch (err) {
          const error = err as Error;
          logAction('updateSubscription unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
        }
      },
      
      cancelSubscription: async () => {
        const { user, subscription } = get();
        if (!user || !subscription) return;
        
        try {
          const response = await fetch('/api/stripe/cancel-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscriptionId: subscription.stripe_subscription_id }),
          });

          if (!response.ok) throw new Error('Failed to cancel subscription');
          await get().fetchSubscription();
        } catch (err) {
          const error = err as Error;
          logAction('cancelSubscription unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
        }
      },
      
      saveAIConfiguration: async (config) => {
        try {
          const { error } = await supabase
            .from('ai_configurations')
            .upsert(config);
          
          if (error) throw error;
        } catch (err) {
          const error = err as Error;
          logAction('saveAIConfiguration unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
        }
      },
      
      getAIConfiguration: async (sessionId) => {
        try {
          const { data, error } = await supabase
            .from('ai_configurations')
            .select('*')
            .eq('session_id', sessionId)
            .single();
          
          if (error) throw error;
          return data;
        } catch (err) {
          const error = err as Error;
          logAction('getAIConfiguration unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
          return null;
        }
      },
      
      saveSessionAnalytics: async (analytics) => {
        try {
          const { error } = await supabase
            .from('session_analytics')
            .insert(analytics);
          
          if (error) throw error;
        } catch (err) {
          const error = err as Error;
          logAction('saveSessionAnalytics unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
        }
      },
      
      getSessionAnalytics: async (sessionId) => {
        try {
          const { data, error } = await supabase
            .from('session_analytics')
            .select('*')
            .eq('session_id', sessionId);
          
          if (error) throw error;
          return data;
        } catch (err) {
          const error = err as Error;
          logAction('getSessionAnalytics unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
          return [];
        }
      },
      
      fetchNotifications: async () => {
        const { user } = get();
        if (!user) return;
        
        try {
          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          set({ notifications: data });
        } catch (err) {
          const error = err as Error;
          logAction('fetchNotifications unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
        }
      },
      
      markNotificationAsRead: async (notificationId) => {
        const { user } = get();
        if (!user) return;
        
        try {
          const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);
          
          if (error) throw error;
          await get().fetchNotifications();
        } catch (err) {
          const error = err as Error;
          logAction('markNotificationAsRead unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
        }
      },
      
      clearNotifications: async () => {
        const { user } = get();
        if (!user) return;
        
        try {
          const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id);
          
          if (error) throw error;
          await get().fetchNotifications();
        } catch (err) {
          const error = err as Error;
          logAction('clearNotifications unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
        }
      },
      
      fetchSessions: async () => {
        const { user } = get();
        if (!user) return;
        
        logAction('fetchSessions', { userId: user.id });
        set({ loading: true, error: null });
        try {
          const { data, error } = await getSessions(user.id);
          
          if (error) {
            logAction('fetchSessions failed', { error: error.message });
            set({ error: error.message, loading: false });
            return;
          }
          
          logAction('fetchSessions successful', { sessionsCount: data?.length || 0 });
          set({ sessions: data || [], loading: false });
        } catch (err: any) {
          logAction('fetchSessions unexpected error', { error: err?.message });
          set({ error: err?.message || 'An unexpected error occurred', loading: false });
        }
      },
      
      createSession: async (sessionData: Partial<SessionData>) => {
        const { user } = get();
        if (!user) {
          logAction('createSession failed', { reason: 'User not authenticated' });
          return { data: null, error: 'User not authenticated' };
        }
        
        logAction('createSession attempt', { userId: user.id, sessionName: sessionData.name });
        try {
          // Ensure user_id is set
          const fullSessionData = {
            ...sessionData,
            user_id: user.id
          };
          
          // Call the API function
          const { data, error } = await createSessionApi(fullSessionData);
          
          if (error) {
            logAction('createSession failed', { error });
            return { data: null, error };
          }
          
          if (data) {
            logAction('createSession successful', { sessionId: data.id });
            // Update local sessions list
            const sessions = [...get().sessions, data];
            set({ sessions });
          }
          
          return { data, error };
        } catch (err: any) {
          logAction('createSession unexpected error', { error: err?.message });
          return { data: null, error: err?.message || 'Failed to create session' };
        }
      },
      
      setError: (error: string | null) => {
        logAction('setError', { error });
        set({ error });
      },
      
      setAuthChecked: (checked: boolean) => set({ authChecked: checked }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        user: state.user,
        userProfile: state.userProfile,
      }),
    }
  )
); 