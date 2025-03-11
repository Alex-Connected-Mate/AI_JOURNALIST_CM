import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User as SupabaseUser, AuthError, AuthResponse, PostgrestError } from '@supabase/supabase-js';
import { supabase, signIn, signOut, getSessions, createSession as createSessionApi, getUserProfile, updateUserProfile, uploadProfileImage, SessionData } from './supabase';
import { UserProfile } from './types';

// Function to log store actions if not in production
const logAction = (action: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    console.log(`[STORE] ${action}`, data || '');
  }
};

// Ajouter cette interface pour gérer les erreurs de manière générique
interface GenericError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

interface AppState {
  user: SupabaseUser | null;
  userProfile: UserProfile | null;
  sessions: SessionData[];
  loading: boolean;
  error: string | null;
  authChecked: boolean;
  
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
            const genericError = error as unknown as GenericError;
            logAction('fetchUserProfile failed', { error: genericError.message });
            // Au lieu de définir une erreur qui bloque l'interface, définissons un profil par défaut
            const defaultProfile = {
              id: user.id,
              email: user.email || '',
              full_name: null,
              institution: null,
              title: null,
              bio: null,
              avatar_url: null,
              subscription_status: 'enterprise', // Donner accès complet par défaut
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            set({ userProfile: defaultProfile, loading: false });
            return;
          }
          
          logAction('fetchUserProfile successful', { profileData: data });
          set({ userProfile: data, loading: false });
        } catch (err) {
          const genericError = err as unknown as GenericError;
          logAction('fetchUserProfile unexpected error', { error: genericError.message });
          // Au lieu de définir une erreur qui bloque l'interface, définissons un profil par défaut
          const defaultProfile = {
            id: user.id,
            email: user.email || '',
            full_name: null,
            institution: null,
            title: null,
            bio: null,
            avatar_url: null,
            subscription_status: 'enterprise', // Donner accès complet par défaut
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          set({ userProfile: defaultProfile, loading: false });
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
            const genericError = error as unknown as GenericError;
            logAction('updateProfile failed', { error: genericError.message });
            set({ error: genericError.message, loading: false });
            return { data: null, error };
          }
          
          logAction('updateProfile successful', { profile: updatedProfile });
          set({ userProfile: updatedProfile, loading: false });
          return { data: updatedProfile, error: null };
        } catch (err) {
          const genericError = err as unknown as GenericError;
          logAction('updateProfile unexpected error', { error: genericError.message });
          set({ error: genericError.message || 'An unexpected error occurred', loading: false });
          return { data: null, error: err as PostgrestError };
        }
      },
      
      uploadAvatar: async (file: File): Promise<{ url: string | null; error: PostgrestError | null }> => {
        const { user } = get();
        if (!user) {
          return { url: null, error: null };
        }
        
        logAction('uploadAvatar attempt', { userId: user.id });
        set({ loading: true });
        
        try {
          const { url, error } = await uploadProfileImage(user.id, file);
          
          if (error) {
            const genericError = error as unknown as GenericError;
            logAction('uploadAvatar failed', { error: genericError.message });
            set({ error: genericError.message, loading: false });
            return { url: null, error: error as unknown as PostgrestError };
          }
          
          // Update user profile with new avatar URL if needed
          if (url) {
            try {
              const { data: updatedProfile, error: updateError } = await updateUserProfile(user.id, {
                avatar_url: url
              });
              
              if (updateError) {
                const genericError = updateError as unknown as GenericError;
                logAction('uploadAvatar profile update failed', { error: genericError.message });
              } else if (updatedProfile) {
                set({ userProfile: updatedProfile });
                logAction('uploadAvatar profile updated with new avatar', { url });
              }
            } catch (updateErr) {
              logAction('uploadAvatar profile update exception', { error: updateErr });
              // Continue même si la mise à jour du profil échoue
            }
          }
          
          set({ loading: false });
          return { url, error: null };
        } catch (err) {
          const genericError = err as unknown as GenericError;
          logAction('uploadAvatar unexpected error', { error: genericError.message });
          set({ error: genericError.message || 'An unexpected error occurred', loading: false });
          return { url: null, error: err as unknown as PostgrestError };
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