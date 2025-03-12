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

// Type guard for PostgrestError
function isPostgrestError(error: unknown): error is PostgrestError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

// Enhanced error logging
function logError(action: string, error: unknown) {
  if (isPostgrestError(error)) {
    console.error(`[STORE] ${action} failed:`, {
      message: error.message,
      details: error.details,
      code: error.code,
      hint: error.hint
    });
  } else if (error instanceof Error) {
    console.error(`[STORE] ${action} failed:`, {
      message: error.message,
      stack: error.stack
    });
  } else {
    console.error(`[STORE] ${action} failed:`, error);
  }
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
          // Clear all state first
          set({ 
            sessions: [],
            userProfile: null,
            error: null
          });

          // Attempt to sign out
          const { error } = await signOut();
          
          if (error) {
            logAction('logout failed', { error: error.message });
            set({ error: error.message, loading: false });
            return;
          }
          
          // Clear remaining state and ensure user is null
          set({ 
            user: null,
            loading: false,
            authChecked: false // Reset auth check
          });

          // Force clear persisted state
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('app-storage');
          }
          
          logAction('logout successful');
        } catch (err) {
          const error = err as AuthError;
          logAction('logout unexpected error', { error: error.message });
          set({ 
            error: error.message || 'An unexpected error occurred', 
            loading: false,
            // Keep user null to ensure they're logged out even if there's an error
            user: null
          });
        }
      },
      
      fetchUserProfile: async () => {
        const { user } = get();
        if (!user) {
          logAction('fetchUserProfile aborted', 'No user found');
          return;
        }
        
        if (get().loading) {
          logAction('fetchUserProfile aborted', 'Already loading');
          return;
        }
        
        logAction('fetchUserProfile', { userId: user.id });
        set({ loading: true, error: null });
        
        try {
          const { data, error } = await getUserProfile(user.id);
          
          if (error) {
            logError('fetchUserProfile', error);
            set({ 
              error: error.message,
              loading: false,
              userProfile: get().userProfile // Keep existing profile data
            });
            return;
          }
          
          if (!data) {
            const err = 'No profile data returned';
            logAction('fetchUserProfile failed', err);
            set({ 
              error: err,
              loading: false,
              userProfile: get().userProfile // Keep existing profile data
            });
            return;
          }
          
          logAction('fetchUserProfile successful', { profileData: data });
          set({ 
            userProfile: data, 
            loading: false,
            error: null 
          });
        } catch (err) {
          logError('fetchUserProfile', err);
          set({ 
            error: err instanceof Error ? err.message : 'An unexpected error occurred',
            loading: false,
            userProfile: get().userProfile // Keep existing profile data
          });
        }
      },
      
      updateProfile: async (data: Partial<UserProfile>) => {
        const { user } = get();
        if (!user) {
          const error = 'User not authenticated';
          logAction('updateProfile failed', { reason: error });
          return { 
            data: null, 
            error: { 
              message: error,
              details: 'No user found in store',
              code: 'AUTH_ERROR'
            } as PostgrestError 
          };
        }
        
        logAction('updateProfile attempt', { userId: user.id, profileData: data });
        set({ loading: true, error: null });
        
        try {
          // Validate required fields
          if (data.role && !['user', 'admin', 'premium'].includes(data.role)) {
            const error = {
              message: 'Invalid role',
              details: 'Role must be one of: user, admin, premium',
              code: 'VALIDATION_ERROR'
            } as PostgrestError;
            logError('updateProfile', error);
            return { data: null, error };
          }

          if (data.subscription_status && 
              !['free', 'basic', 'premium', 'enterprise'].includes(data.subscription_status)) {
            const error = {
              message: 'Invalid subscription status',
              details: 'Status must be one of: free, basic, premium, enterprise',
              code: 'VALIDATION_ERROR'
            } as PostgrestError;
            logError('updateProfile', error);
            return { data: null, error };
          }
          
          logAction('calling updateUserProfile');
          const result = await updateUserProfile(user.id, data);
          
          if (result.error) {
            logError('updateProfile', result.error);
            set({ 
              error: result.error.message, 
              loading: false,
              userProfile: get().userProfile // Keep existing profile data
            });
            return { data: null, error: result.error };
          }
          
          if (!result.data) {
            const error = {
              message: 'Failed to update profile',
              details: 'No profile data returned',
              code: 'UPDATE_FAILED'
            } as PostgrestError;
            logError('updateProfile', error);
            set({ 
              error: error.message, 
              loading: false,
              userProfile: get().userProfile // Keep existing profile data
            });
            return { data: null, error };
          }
          
          logAction('updateProfile successful', { profile: result.data });
          set({ 
            userProfile: result.data, 
            loading: false,
            error: null
          });
          return { data: result.data, error: null };
        } catch (err) {
          logError('updateProfile', err);
          set({ 
            error: err instanceof Error ? err.message : 'An unexpected error occurred',
            loading: false,
            userProfile: get().userProfile // Keep existing profile data
          });
          return { 
            data: null, 
            error: {
              message: err instanceof Error ? err.message : 'An unexpected error occurred',
              details: 'Unexpected error in updateProfile',
              code: 'INTERNAL_ERROR'
            } as PostgrestError 
          };
        } finally {
          if (get().loading) {
            logAction('updateProfile force end loading state');
            set({ loading: false });
          }
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