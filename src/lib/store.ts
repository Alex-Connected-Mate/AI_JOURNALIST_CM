import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, signIn, signOut, getSessions, createSession as createSessionApi, getUserProfile, updateUserProfile, uploadProfileImage } from './supabase';

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
  user: User | null;
  userProfile: any | null;
  sessions: Session[];
  loading: boolean;
  error: string | null;
  authChecked: boolean;
  
  // Authentication actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  
  // Profile actions
  fetchUserProfile: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<{data: any | null, error: any}>;
  uploadAvatar: (file: File) => Promise<{data: any | null, error: any}>;
  
  // Session actions
  fetchSessions: () => Promise<void>;
  createSession: (sessionData: Partial<Session>) => Promise<{ data: Session | null, error: any }>;
  setError: (error: string | null) => void;
  setAuthChecked: (checked: boolean) => void;
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
      authChecked: false,
      
      login: async (email: string, password: string) => {
        logAction('login attempt', { email });
        set({ loading: true, error: null });
        try {
          const { data, error } = await signIn(email, password);
          
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
          }
        } catch (err: any) {
          logAction('login unexpected error', { error: err?.message });
          set({ error: err?.message || 'An unexpected error occurred', loading: false });
        }
      },
      
      logout: async () => {
        logAction('logout attempt');
        set({ loading: true, error: null });
        try {
          const { error } = await signOut();
          
          if (error) {
            logAction('logout failed', { error: error.message });
            set({ error: error.message, loading: false });
            return;
          }
          
          logAction('logout successful');
          set({ user: null, userProfile: null, sessions: [], loading: false });
        } catch (err: any) {
          logAction('logout unexpected error', { error: err?.message });
          set({ error: err?.message || 'An unexpected error occurred', loading: false });
        }
      },
      
      setUser: (user: User | null) => {
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
        } catch (err: any) {
          logAction('fetchUserProfile unexpected error', { error: err?.message });
          set({ error: err?.message || 'An unexpected error occurred', loading: false });
        }
      },
      
      updateProfile: async (profileData: any) => {
        const { user } = get();
        if (!user) {
          return { data: null, error: 'User not authenticated' };
        }
        
        logAction('updateProfile attempt', { userId: user.id, profileData });
        set({ loading: true });
        
        try {
          const { data, error } = await updateUserProfile(user.id, profileData);
          
          if (error) {
            logAction('updateProfile failed', { error: error.message });
            set({ error: error.message, loading: false });
            return { data: null, error: error.message };
          }
          
          logAction('updateProfile successful', { profileData: data });
          set({ userProfile: data, loading: false });
          return { data, error: null };
        } catch (err: any) {
          logAction('updateProfile unexpected error', { error: err?.message });
          set({ error: err?.message || 'An unexpected error occurred', loading: false });
          return { data: null, error: err?.message || 'An unexpected error occurred' };
        }
      },
      
      uploadAvatar: async (file: File) => {
        const { user } = get();
        if (!user) {
          return { data: null, error: 'User not authenticated' };
        }
        
        logAction('uploadAvatar attempt', { userId: user.id, fileName: file.name });
        set({ loading: true });
        
        try {
          const { data, error } = await uploadProfileImage(user.id, file);
          
          if (error) {
            logAction('uploadAvatar failed', { error: error.message });
            set({ error: error.message, loading: false });
            return { data: null, error: error.message };
          }
          
          logAction('uploadAvatar successful', { profileData: data });
          set({ userProfile: data, loading: false });
          return { data, error: null };
        } catch (err: any) {
          logAction('uploadAvatar unexpected error', { error: err?.message });
          set({ error: err?.message || 'An unexpected error occurred', loading: false });
          return { data: null, error: err?.message || 'An unexpected error occurred' };
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
      
      createSession: async (sessionData: Partial<Session>) => {
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