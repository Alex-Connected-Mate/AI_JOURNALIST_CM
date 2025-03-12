import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User as SupabaseUser, AuthError, AuthResponse } from '@supabase/supabase-js';
import { supabase, signIn, signOut, getSessions, createSession as createSessionApi, getUserProfile, updateUserProfile, uploadProfileImage, SessionData, ensureUserRecord, SupabaseError } from './supabase';
import { UserProfile } from './types';
import { SessionCreationLog } from './sessionCreationLogger';

// Function to log store actions if not in production
const logAction = (action: string, data?: any) => {
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    console.log(`[STORE] ${action}`, data || '');
  }
};

// Helper function to log errors
const logError = (action: string, error: any) => {
  if (typeof window !== 'undefined') {
    console.error(`[STORE ERROR] ${action}:`, error);
    logAction(`${action} failed`, error);
  }
};

// Types
interface GenericError {
  message: string;
}

interface AppState {
  // Auth state
  user: SupabaseUser | null;
  userProfile: UserProfile | null;
  sessions: SessionData[];
  loading: boolean;
  error: string | null;
  authChecked: boolean;
  appInitialized: boolean;
  
  // Session creation logging
  sessionCreationLogs: SessionCreationLog[];
  currentSessionCreation: {
    inProgress: boolean;
    startedAt: string | null;
    currentStep: string | null;
    formData: Record<string, any>;
  };
  
  // Auth actions
  initApp: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error: AuthError | null }>;
  register: (email: string, password: string, username?: string) => Promise<{ success: boolean; error: AuthError | null }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error: AuthError | null }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error: AuthError | null }>;
  
  // Session creation logging actions
  startSessionCreation: () => void;
  finishSessionCreation: (success: boolean, sessionId?: string) => void;
  setSessionCreationStep: (step: string) => void;
  updateSessionCreationField: (field: string, value: any, source?: 'user' | 'profile' | 'default' | 'template') => void;
  logSessionCreationEvent: (log: SessionCreationLog) => void;
  clearSessionCreationLogs: () => void;
  
  // User profile actions
  fetchUserProfile: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{
    data: UserProfile | null;
    error: SupabaseError | null;
  }>;
  uploadAvatar: (file: File) => Promise<{
    url: string | null;
    error: SupabaseError | null;
  }>;
  
  // Session actions
  fetchSessions: () => Promise<void>;
  createSession: (sessionData: Partial<SessionData>) => Promise<{
    data: SessionData | null;
    error: any;
  }>;
}

// Type guard for PostgrestError
function isSupabaseError(error: unknown): error is SupabaseError {
  return typeof error === 'object' && error !== null && 'message' in error;
}

// Enhanced error logging
function logErrorEnhanced(action: string, error: unknown) {
  if (isSupabaseError(error)) {
    console.error(`[STORE] ${action} failed:`, {
      message: error.message,
      details: 'details' in error ? error.details : undefined,
      code: 'code' in error ? error.code : undefined
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
      appInitialized: false,
      
      // Session creation logs initial state
      sessionCreationLogs: [],
      currentSessionCreation: {
        inProgress: false,
        startedAt: null,
        currentStep: null,
        formData: {}
      },
      
      // Session creation logging actions
      startSessionCreation: () => {
        const startTime = new Date().toISOString();
        console.log(`🔵 [SESSION_CREATION] Starting new session creation at ${startTime}`);
        
        set({
          currentSessionCreation: {
            inProgress: true,
            startedAt: startTime,
            currentStep: 'basic',
            formData: {}
          }
        });
        
        // Add initial log
        const newLog: SessionCreationLog = {
          timestamp: startTime,
          action: 'step_change',
          step: 'basic',
          message: 'Session creation started'
        };
        
        get().logSessionCreationEvent(newLog);
      },
      
      finishSessionCreation: (success: boolean, sessionId?: string) => {
        const { currentSessionCreation, sessionCreationLogs } = get();
        const endTime = new Date().toISOString();
        
        if (!currentSessionCreation.inProgress) {
          console.warn('🟡 [SESSION_CREATION] Attempted to finish session creation that was not in progress');
          return;
        }
        
        const startTime = currentSessionCreation.startedAt || new Date().toISOString();
        const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
        
        console.log(`${success ? '✅' : '❌'} [SESSION_CREATION] Finished session creation after ${duration}ms`, 
          success ? { success: true, sessionId } : { success: false }
        );
        
        // Add final log
        const finalLog: SessionCreationLog = {
          timestamp: endTime,
          action: success ? 'api_call_success' : 'api_call_error',
          message: success 
            ? `Session created successfully with ID: ${sessionId}` 
            : 'Session creation failed',
          details: {
            success,
            sessionId,
            duration,
            totalSteps: Object.keys(
              sessionCreationLogs.reduce((acc, log) => {
                if (log.step) acc[log.step] = true;
                return acc;
              }, {} as Record<string, boolean>)
            ).length
          }
        };
        
        const updatedLogs = [...sessionCreationLogs, finalLog];
        
        // Reset current session creation state but keep the logs
        set({
          sessionCreationLogs: updatedLogs,
          currentSessionCreation: {
            inProgress: false,
            startedAt: null,
            currentStep: null,
            formData: {}
          }
        });
        
        // Export logs to console for debugging
        if (process.env.NODE_ENV !== 'production') {
          console.log('📊 [SESSION_CREATION] Complete session creation log:');
          const formattedLogs = updatedLogs.map(log => {
            const time = new Date(log.timestamp).toLocaleTimeString();
            let message = `[${time}] [${log.action}]`;
            if (log.step) message += ` STEP: ${log.step}`;
            if (log.field) message += ` FIELD: ${log.field}`;
            if (log.message) message += ` - ${log.message}`;
            return message;
          }).join('\n');
          console.log(formattedLogs);
        }
      },
      
      setSessionCreationStep: (step: string) => {
        const { currentSessionCreation } = get();
        
        if (!currentSessionCreation.inProgress) {
          console.warn('🟡 [SESSION_CREATION] Attempted to update step while not in progress');
          return;
        }
        
        console.log(`🔵 [SESSION_CREATION] Step changed from ${currentSessionCreation.currentStep} to ${step}`);
        
        // Add step change log
        const newLog: SessionCreationLog = {
          timestamp: new Date().toISOString(),
          action: 'step_change',
          step,
          message: `Navigated to step: ${step}`
        };
        
        get().logSessionCreationEvent(newLog);
        
        // Update current step
        set({
          currentSessionCreation: {
            ...currentSessionCreation,
            currentStep: step
          }
        });
      },
      
      updateSessionCreationField: (field: string, value: any, source: 'user' | 'profile' | 'default' | 'template' = 'user') => {
        const { currentSessionCreation } = get();
        
        if (!currentSessionCreation.inProgress) {
          console.warn('🟡 [SESSION_CREATION] Attempted to update field while not in progress');
          return;
        }
        
        // Determine action type based on source
        let action: string;
        switch (source) {
          case 'profile':
            action = 'profile_info_used';
            break;
          case 'default':
            action = 'default_value_used';
            break;
          case 'template':
            action = 'template_used';
            break;
          default:
            action = 'field_update';
        }
        
        console.log(`🔵 [SESSION_CREATION] Field "${field}" updated via ${source}`, { value });
        
        // Add field update log
        const newLog: SessionCreationLog = {
          timestamp: new Date().toISOString(),
          action: action as any,
          field,
          value,
          message: `Field "${field}" updated via ${source}`
        };
        
        get().logSessionCreationEvent(newLog);
        
        // Update form data
        set({
          currentSessionCreation: {
            ...currentSessionCreation,
            formData: {
              ...currentSessionCreation.formData,
              [field]: value
            }
          }
        });
      },
      
      logSessionCreationEvent: (log: SessionCreationLog) => {
        const { sessionCreationLogs } = get();
        set({
          sessionCreationLogs: [...sessionCreationLogs, log]
        });
      },
      
      clearSessionCreationLogs: () => {
        set({
          sessionCreationLogs: [],
          currentSessionCreation: {
            inProgress: false,
            startedAt: null,
            currentStep: null,
            formData: {}
          }
        });
      },
      
      initApp: async () => {
        if (get().appInitialized) {
          logAction('initApp skipped', 'App already initialized');
          return;
        }
        
        logAction('initApp started');
        set({ loading: true, error: null });
        
        try {
          // Vérifier si l'utilisateur est connecté
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            logAction('initApp session check failed', sessionError);
            set({ 
              authChecked: true, 
              loading: false, 
              error: sessionError.message, 
              appInitialized: true 
            });
            return;
          }
          
          if (!session) {
            logAction('initApp no session found');
            set({ 
              user: null, 
              userProfile: null, 
              authChecked: true, 
              loading: false, 
              appInitialized: true 
            });
            return;
          }
          
          logAction('initApp session found', { userId: session.user.id });
          set({ user: session.user });
          
          // Synchroniser les données entre auth.users et public.users
          try {
            logAction('initApp ensuring user record sync');
            const { data: syncedProfile, error: syncError } = await ensureUserRecord(
              session.user.id, 
              session.user.email || '' // Utiliser une chaîne vide si l'email est undefined
            );
            
            if (syncError) {
              logAction('initApp sync error', syncError);
              set({ 
                error: syncError.message,
                loading: false,
                authChecked: true,
                appInitialized: true
              });
              return;
            }
            
            if (syncedProfile) {
              logAction('initApp sync successful', { profile: syncedProfile });
              set({ userProfile: syncedProfile });
              
              // Mettre à jour le last_login si nécessaire
              if (!syncedProfile.last_login || new Date(syncedProfile.last_login).getTime() < Date.now() - 24 * 60 * 60 * 1000) {
                logAction('initApp updating last_login');
                
                const { error: updateError } = await updateUserProfile(
                  session.user.id, { last_login: new Date().toISOString() }
                );
                
                if (updateError) {
                  logAction('initApp last_login update failed', updateError);
                }
              }
            }
            
            // Charger les sessions de l'utilisateur
            await get().fetchSessions();
          } catch (error) {
            logAction('initApp unexpected error', error);
            set({ error: error instanceof Error ? error.message : 'Unknown error during initialization' });
          }
          
          // Mettre en place les listeners Supabase pour les mises à jour en temps réel si nécessaire
          // TODO: Implémenter si nécessaire
          
          // Finaliser l'initialisation
          set({ 
            authChecked: true, 
            loading: false, 
            appInitialized: true 
          });
          
          logAction('initApp completed successfully');
        } catch (error) {
          logAction('initApp failed', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to initialize app',
            authChecked: true,
            loading: false,
            appInitialized: true // Marquer comme initialisé même en cas d'erreur pour éviter les boucles infinies
          });
        }
      },
      
      login: async (email: string, password: string): Promise<{ success: boolean; error: AuthError | null }> => {
        logAction('login attempt', { email });
        set({ loading: true, error: null });
        try {
          const { data, error } = await signIn(email, password) as AuthResponse;
          
          if (error) {
            logAction('login failed', { error: error.message });
            set({ error: error.message, loading: false });
            return { success: false, error };
          }
          
          if (data?.user) {
            logAction('login successful', { userId: data.user.id });
            set({ user: data.user, loading: false });
            
            // Fetch user data after login
            get().fetchUserProfile();
            get().fetchSessions();
            
            return { success: true, error: null };
          }
          
          // Si nous arrivons ici, c'est qu'il n'y a ni erreur ni utilisateur (cas théorique)
          logAction('login indeterminate', { data });
          set({ loading: false });
          return { success: false, error: { message: 'No user returned', name: 'IndeterminateAuthError' } as AuthError };
        } catch (err) {
          const error = err as AuthError;
          logAction('login unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
          return { success: false, error };
        }
      },
      
      logout: async () => {
        logAction('logout attempt');
        set({ loading: true, error: null });
        
        try {
          // Capture l'état actuel pour vérifier plus tard si la déconnexion a fonctionné
          const initialUser = get().user;
          if (!initialUser) {
            logAction('logout skipped', 'No user found');
            set({ loading: false });
            return;
          }
          
          console.log('🔵 [STORE] Starting logout process');
          
          // Suspendre toutes les connexions en temps réel
          if (typeof window !== 'undefined') {
            try {
              // Récupérer et fermer toutes les souscriptions actives
              const channels = supabase.getChannels();
              if (channels.length > 0) {
                console.log(`🔵 [STORE] Closing ${channels.length} active channel(s)`);
                for (const channel of channels) {
                  console.log(`🔵 [STORE] Removing channel: ${channel.topic}`);
                  supabase.removeChannel(channel);
                }
              }
            } catch (e) {
              console.warn('Failed to close realtime connections', e);
            }
          }
          
          // Nettoyage préventif du localStorage et sessionStorage
          if (typeof window !== 'undefined') {
            console.log('🔵 [STORE] Clearing storage items before logout');
            localStorage.clear();
            sessionStorage.clear();
            
            // Nettoyage spécifique des éléments liés à Supabase
            const items = ['supabase.auth.token', 'supabase.auth.refreshToken', 'app-storage'];
            items.forEach(item => {
              try {
                localStorage.removeItem(item);
                sessionStorage.removeItem(item);
              } catch (e) {
                console.warn(`Failed to remove ${item}`, e);
              }
            });
          }
          
          // Déconnexion avec Supabase
          console.log('🔵 [STORE] Calling signOut API');
          const { error: signOutError } = await signOut();
          
          if (signOutError) {
            console.error('🔴 [STORE] Supabase signOut error:', signOutError);
            
            // Même en cas d'erreur, forcer la déconnexion côté client
            console.log('🔵 [STORE] Forcing client-side logout due to API error');
          }
          
          // Vérification de la session après déconnexion
          console.log('🔵 [STORE] Verifying logout was successful');
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            console.warn('🟡 [STORE] Session still exists after logout, forcing removal');
            
            // Forcer l'expiration de la session
            try {
              await supabase.auth.setSession({
                access_token: '',
                refresh_token: ''
              });
            } catch (e) {
              console.error('Failed to force session expiration', e);
            }
          } else {
            console.log('✅ [STORE] Session successfully removed');
          }
          
          // Reset state
          console.log('🔵 [STORE] Resetting application state');
          set({
            user: null,
            userProfile: null,
            sessions: [],
            loading: false,
            authChecked: false,
            error: null
          });
          
          console.log('✅ [STORE] Logout process completed successfully');
          
          // Vérifier que la redirection sera faite après
          if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
            console.log('🔵 [STORE] Logout completed, ready for redirect');
          }
        } catch (err) {
          logAction('logout error', err);
          
          // Nettoyage forcé en cas d'erreur
          console.error('🔴 [STORE] Error during logout:', err);
          
          // Clear state even on error
          set({ 
            user: null,
            userProfile: null,
            sessions: [],
            loading: false,
            authChecked: false,
            error: err instanceof Error ? err.message : 'Logout failed'
          });
          
          // Force clear storage on error
          if (typeof window !== 'undefined') {
            console.log('🔵 [STORE] Forcing storage clear due to error');
            window.localStorage.clear();
            window.sessionStorage.clear();
          }
          
          throw err; // Re-throw to handle in the component
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
            } as SupabaseError 
          };
        }
        
        logAction('updateProfile attempt', { userId: user.id, profileData: data });
        set({ loading: true, error: null });
        
        try {
          // Log current state
          console.log('🔵 [STORE] Current profile state:', get().userProfile);
          
          // Validate required fields
          if (data.role && !['user', 'admin', 'premium'].includes(data.role)) {
            console.error('🔴 [STORE] Invalid role:', data.role);
            const error = {
              message: 'Invalid role',
              details: 'Role must be one of: user, admin, premium',
              code: 'VALIDATION_ERROR'
            } as SupabaseError;
            logError('updateProfile', error);
            return { data: null, error };
          }

          if (data.subscription_status && 
              !['free', 'basic', 'premium', 'enterprise'].includes(data.subscription_status)) {
            console.error('🔴 [STORE] Invalid subscription status:', data.subscription_status);
            const error = {
              message: 'Invalid subscription status',
              details: 'Status must be one of: free, basic, premium, enterprise',
              code: 'VALIDATION_ERROR'
            } as SupabaseError;
            logError('updateProfile', error);
            return { data: null, error };
          }
          
          console.log('🔵 [STORE] Calling updateUserProfile with data:', data);
          const result = await updateUserProfile(user.id, data);
          
          if (result.error) {
            console.error('🔴 [STORE] Update failed:', result.error);
            logError('updateProfile', result.error);
            set({ 
              error: result.error.message, 
              loading: false,
              userProfile: get().userProfile // Keep existing profile data
            });
            return { data: null, error: result.error };
          }
          
          if (!result.data) {
            console.error('🔴 [STORE] No data returned from update');
            const error = {
              message: 'Failed to update profile',
              details: 'No profile data returned',
              code: 'UPDATE_FAILED'
            } as SupabaseError;
            logError('updateProfile', error);
            set({ 
              error: error.message, 
              loading: false,
              userProfile: get().userProfile // Keep existing profile data
            });
            return { data: null, error };
          }
          
          // Verify the update by comparing fields
          const currentProfile = get().userProfile;
          const updatedFields = Object.keys(data).filter(key => 
            data[key as keyof UserProfile] !== result.data?.[key as keyof UserProfile]
          );

          if (updatedFields.length > 0) {
            console.warn('🟡 [STORE] Some fields may not have updated correctly:', {
              expected: data,
              actual: result.data,
              differences: updatedFields
            });
          }
          
          console.log('✅ [STORE] Profile update successful:', {
            oldProfile: currentProfile,
            newProfile: result.data
          });
          
          // Update the store
          set({ 
            userProfile: result.data, 
            loading: false,
            error: null
          });
          
          return { data: result.data, error: null };
        } catch (err) {
          console.error('🔴 [STORE] Unexpected error in updateProfile:', err);
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
            } as SupabaseError 
          };
        } finally {
          if (get().loading) {
            console.log('🔵 [STORE] Forcing end of loading state');
            set({ loading: false });
          }
        }
      },
      
      uploadAvatar: async (file: File): Promise<{ url: string | null; error: SupabaseError | null }> => {
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
            return { url: null, error: error as unknown as SupabaseError };
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
          return { url: null, error: err as unknown as SupabaseError };
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
        
        // Log session creation attempt in the new logging system
        const logTimestamp = new Date().toISOString();
        get().logSessionCreationEvent({
          timestamp: logTimestamp,
          action: 'api_call_start',
          message: 'Starting API call to create session',
          details: { sessionData }
        });
        
        try {
          const fullSessionData = {
            ...sessionData,
            user_id: user.id
          };
          
          const { data, error } = await createSessionApi(fullSessionData);
          
          if (error) {
            logAction('createSession failed', { error });
            
            // Log error in the new logging system
            get().logSessionCreationEvent({
              timestamp: new Date().toISOString(),
              action: 'api_call_error',
              message: 'Session creation API call failed',
              details: { error }
            });
            
            return { data: null, error };
          }
          
          if (data) {
            logAction('createSession successful', { sessionId: data.id });
            const sessions = [...get().sessions, data];
            set({ sessions });
            
            // Log success in the new logging system
            get().logSessionCreationEvent({
              timestamp: new Date().toISOString(),
              action: 'api_call_success',
              message: 'Session created successfully',
              details: { sessionId: data.id }
            });
          }
          
          return { data, error };
        } catch (err: any) {
          logAction('createSession unexpected error', { error: err?.message });
          
          // Log error in the new logging system
          get().logSessionCreationEvent({
            timestamp: new Date().toISOString(),
            action: 'api_call_error',
            message: 'Unexpected error during session creation',
            details: { errorMessage: err?.message }
          });
          
          return { data: null, error: err?.message || 'Failed to create session' };
        }
      },
      
      register: async (email: string, password: string, username?: string): Promise<{ success: boolean; error: AuthError | null }> => {
        logAction('register attempt', { email });
        set({ loading: true, error: null });
        
        try {
          // Implémenter l'enregistrement lorsque la fonction sera disponible dans supabase.ts
          // Pour l'instant, utilisons une implémentation fictive
          logAction('register not implemented');
          set({ loading: false });
          return {
            success: false,
            error: {
              name: 'NotImplementedError',
              message: 'La fonction register n\'est pas encore implémentée'
            } as AuthError
          };
        } catch (err) {
          const error = err as AuthError;
          logAction('register unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
          return { success: false, error };
        }
      },
      
      resetPassword: async (email: string): Promise<{ success: boolean; error: AuthError | null }> => {
        logAction('resetPassword attempt', { email });
        set({ loading: true, error: null });
        
        try {
          // Implémenter la réinitialisation de mot de passe lorsque la fonction sera disponible dans supabase.ts
          // Pour l'instant, utilisons une implémentation fictive
          logAction('resetPassword not implemented');
          set({ loading: false });
          return {
            success: false,
            error: {
              name: 'NotImplementedError',
              message: 'La fonction resetPassword n\'est pas encore implémentée'
            } as AuthError
          };
        } catch (err) {
          const error = err as AuthError;
          logAction('resetPassword unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
          return { success: false, error };
        }
      },
      
      forgotPassword: async (email: string): Promise<{ success: boolean; error: AuthError | null }> => {
        logAction('forgotPassword attempt', { email });
        set({ loading: true, error: null });
        
        try {
          // Implémenter la récupération de mot de passe lorsque la fonction sera disponible dans supabase.ts
          // Pour l'instant, utilisons une implémentation fictive
          logAction('forgotPassword not implemented');
          set({ loading: false });
          return {
            success: false,
            error: {
              name: 'NotImplementedError',
              message: 'La fonction forgotPassword n\'est pas encore implémentée'
            } as AuthError
          };
        } catch (err) {
          const error = err as AuthError;
          logAction('forgotPassword unexpected error', { error: error.message });
          set({ error: error.message || 'An unexpected error occurred', loading: false });
          return { success: false, error };
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