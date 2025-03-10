import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User as SupabaseUser, AuthError, AuthResponse, PostgrestError } from '@supabase/supabase-js';
import { supabase, signIn, signOut, getSessions, createSession as createSessionApi, getUserProfile, updateUserProfile, uploadProfileImage, SessionData } from './supabase';
import { UserProfile } from './types';

// Function to log store actions if not in production
const logAction = (action: string, data?: any) => {
  if (typeof window !== 'undefined') {
    console.log(`[STORE] ${action}`, data || '');
  }
};

interface AppState {
  user: SupabaseUser | null;
  userProfile: UserProfile | null;
  sessions: SessionData[];
  loading: boolean;
  error: string | null;
  
  // Authentication actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Profile actions
  fetchUserProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ data: UserProfile | null; error: PostgrestError | null }>;
  uploadAvatar: (file: File) => Promise<{ url: string | null; error: PostgrestError | null }>;
  
  // Session actions
  fetchSessions: () => Promise<void>;
  createSession: (sessionData: Partial<SessionData>) => Promise<{ data: SessionData | null; error: PostgrestError | null }>;
}

// Create the store
export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      userProfile: null,
      sessions: [],
      loading: false,
      error: null,
      
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
            set({ user: data.user, loading: false });
            
            // Fetch user data after login
            get().fetchUserProfile();
            get().fetchSessions();
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
          set({ user: null, userProfile: null, sessions: [], loading: false });
        } catch (err) {
          const error = err as AuthError;
          logAction('logout unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
        }
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
      
      updateProfile: async (data) => {
        const { user } = get();
        if (!user) {
          return { data: null, error: null };
        }
        
        logAction('updateProfile attempt', { userId: user.id, profileData: data });
        set({ loading: true });
        
        try {
          const { data: updatedProfile, error } = await updateUserProfile(user.id, data);
          
          if (error) {
            logAction('updateProfile failed', { error: error.message });
            set({ error: error.message, loading: false });
            return { data: null, error };
          }
          
          logAction('updateProfile successful', { profile: updatedProfile });
          set({ userProfile: updatedProfile, loading: false });
          return { data: updatedProfile, error: null };
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
        
        logAction('createSession attempt', { userId: user.id });
        try {
          const fullSessionData = {
            ...sessionData,
            user_id: user.id
          };
          
          const { data, error } = await createSessionApi(fullSessionData);
          
          if (error) {
            logAction('createSession failed', { error });
            return { data: null, error };
          }
          
          if (data) {
            logAction('createSession successful', { sessionId: data.id });
            const sessions = [...get().sessions, data];
            set({ sessions });
          }
          
          return { data, error };
        } catch (err: any) {
          logAction('createSession unexpected error', { error: err?.message });
          return { data: null, error: err?.message || 'Failed to create session' };
        }
      },
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