import { createClient } from '@supabase/supabase-js';
import { UserProfile } from './types';
import { PostgrestError } from '@supabase/supabase-js';

// These environment variables will need to be set in a .env.local file
// or in Vercel's deployment settings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or API key');
}

// Maximum number of retries for authentication operations
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Helper function to implement delay between retries
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to handle retries
async function withRetry<T>(operation: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && error instanceof Error && error.message.includes('Failed to fetch')) {
      await delay(RETRY_DELAY);
      console.warn(`Retrying operation, ${retries - 1} attempts remaining`);
      return withRetry(operation, retries - 1);
    }
    throw error;
  }
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'connected-mate'
    }
  }
});

// Helper functions for authentication with retry logic
export async function signIn(email: string, password: string) {
  return withRetry(async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Authentication error:', error.message);
      throw error;
    }
    
    return { data, error };
  });
}

export async function signUp(email: string, password: string) {
  return withRetry(async () => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      console.error('Sign up error:', error.message);
      throw error;
    }
    
    return { data, error };
  });
}

export async function signOut() {
  return withRetry(async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error.message);
      throw error;
    }
    
    return { error };
  });
}

// Helper function to ensure user record exists and is synchronized
async function ensureUserRecord(userId: string, email: string): Promise<{ data: UserProfile | null; error: PostgrestError | null }> {
  console.log('Ensuring user record exists:', { userId, email });
  try {
    // Check if user exists in public.users
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error('Error checking user existence:', checkError);
      return { data: null, error: checkError };
    }

    if (!existingUser) {
      console.log('User not found in public.users, creating new record');
      const now = new Date().toISOString();
      const newUser = {
        id: userId,
        email: email,
        created_at: now,
        updated_at: now,
        subscription_status: 'free',
        role: 'user',
        subscription_end_date: '2099-12-31T23:59:59.999Z'
      };

      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .insert(newUser)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating user record:', insertError);
        return { data: null, error: insertError };
      }

      console.log('User record created successfully:', insertedUser);
      return { data: insertedUser, error: null };
    }

    // Update last_login if needed
    if (!existingUser.last_login) {
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating last_login:', updateError);
        return { data: existingUser, error: null }; // Return existing user even if update fails
      }

      return { data: updatedUser, error: null };
    }

    return { data: existingUser, error: null };
  } catch (err) {
    console.error('Unexpected error in ensureUserRecord:', err);
    return { 
      data: null, 
      error: {
        message: err instanceof Error ? err.message : 'Failed to ensure user record',
        details: 'Unexpected error in ensureUserRecord function',
        code: 'SYNC_ERROR'
      } as PostgrestError
    };
  }
}

// Update the getUserProfile function to use ensureUserRecord
export async function getUserProfile(userId: string) {
  return withRetry(async () => {
    try {
      // Get the user's email from auth.users
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Error getting auth user:', authError);
        throw authError;
      }
      
      if (!user || user.id !== userId) {
        throw new Error('User not authenticated or ID mismatch');
      }

      // Ensure user record exists and is synchronized
      const { data: profile, error: syncError } = await ensureUserRecord(userId, user.email || '');
      
      if (syncError) {
        console.error('Error ensuring user record:', syncError);
        throw syncError;
      }
      
      if (!profile) {
        throw new Error('Failed to get or create user profile');
      }

      return { data: profile, error: null };
    } catch (err) {
      console.error('Unexpected error in getUserProfile:', err);
      return { 
        data: null, 
        error: { 
          message: err instanceof Error ? err.message : 'Failed to get user profile',
          details: 'Error in getUserProfile function',
          code: 'PROFILE_ERROR'
        } as PostgrestError 
      };
    }
  });
}

// Interface temporaire pour gérer les champs d'abonnement supplémentaires
interface UserProfileWithSubscription extends Partial<UserProfile> {
  subscription_status?: 'free' | 'basic' | 'premium' | 'enterprise';
  subscription_end_date?: string | null;
  stripe_customer_id?: string | null;
}

// Update the updateUserProfile function to validate data against DB constraints
export async function updateUserProfile(userId: string, profileData: Partial<UserProfile>) {
  console.log('Starting profile update process:', { userId, profileData });
  
  return withRetry(async () => {
    try {
      // Validate role if provided
      if (profileData.role && !['user', 'admin', 'premium'].includes(profileData.role)) {
        return {
          data: null,
          error: {
            message: 'Invalid role',
            details: 'Role must be one of: user, admin, premium',
            code: 'VALIDATION_ERROR'
          } as PostgrestError
        };
      }

      // Validate subscription_status if provided
      if (profileData.subscription_status && 
          !['free', 'basic', 'premium', 'enterprise'].includes(profileData.subscription_status)) {
        return {
          data: null,
          error: {
            message: 'Invalid subscription status',
            details: 'Status must be one of: free, basic, premium, enterprise',
            code: 'VALIDATION_ERROR'
          } as PostgrestError
        };
      }

      // Ensure user record exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
        
      if (checkError) {
        console.error('User check failed:', checkError);
        return { data: null, error: checkError };
      }
      
      if (!existingUser) {
        console.error('User not found:', userId);
        return { 
          data: null, 
          error: { 
            message: 'User not found',
            details: `No user found with ID: ${userId}`,
            code: 'NOT_FOUND'
          } as PostgrestError 
        };
      }

      // Prepare update data with proper timestamp handling
      const now = new Date().toISOString();
      const updateData = {
        ...profileData,
        updated_at: now,
        // Preserve existing timestamps and values
        created_at: existingUser.created_at || now,
        deleted_at: existingUser.deleted_at,
        last_login: existingUser.last_login,
        subscription_end_date: existingUser.subscription_end_date || '2099-12-31T23:59:59.999Z',
        role: profileData.role || existingUser.role || 'user',
        subscription_status: profileData.subscription_status || existingUser.subscription_status || 'free'
      };

      console.log('Performing update with data:', updateData);
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();
        
      if (error) {
        console.error('Update failed:', error);
        return { data: null, error };
      }
      
      if (!data) {
        console.error('Update succeeded but no data returned');
        return {
          data: null,
          error: {
            message: 'Failed to update profile',
            details: 'No data returned after update',
            code: 'UPDATE_FAILED'
          } as PostgrestError
        };
      }

      console.log('Profile update completed successfully:', data);
      return { data, error: null };
    } catch (err) {
      console.error('Unexpected error in updateUserProfile:', err);
      return { 
        data: null, 
        error: { 
          message: err instanceof Error ? err.message : 'An unexpected error occurred',
          details: 'Error in updateUserProfile function',
          code: 'INTERNAL_ERROR'
        } as PostgrestError 
      };
    }
  });
}

export async function uploadProfileImage(userId: string, file: File) {
  return withRetry(async () => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-avatar.${fileExt}`;
    
    try {
      // Upload the file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true
        });
        
      if (uploadError) {
        console.error('Upload profile image error:', uploadError);
        return { url: null, error: uploadError };
      }
      
      // Get the public URL for the uploaded file
      const { data: urlData } = await supabase
        .storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      return { url: urlData?.publicUrl || null, error: null };
        
    } catch (error) {
      console.error('Upload profile image unexpected error:', error);
      return { url: null, error };
    }
  });
}

// Helper functions for session data management
export async function getSessions(userId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId);
    
  return { data, error };
}

// Session Types
export interface SessionData {
  id?: string;
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'ended';
  user_id: string;
  started_at?: string;
  ended_at?: string;
  access_code?: string;
  settings?: {
    institution?: string;
    professorName?: string;
    showProfessorName?: boolean;
    maxParticipants?: number;
    connection?: {
      anonymityLevel?: 'anonymous' | 'semi-anonymous' | 'non-anonymous';
      loginMethod?: string;
      approvalRequired?: boolean;
      color?: string;
      emoji?: string;
    };
    discussion?: Record<string, any>;
    aiInteraction?: {
      nuggets?: Record<string, any>;
      lightbulbs?: Record<string, any>;
      overall?: Record<string, any>;
    };
    visualization?: {
      enableWordCloud?: boolean;
      enableThemeNetwork?: boolean;
      enableLightbulbCategorization?: boolean;
      enableIdeaImpactMatrix?: boolean;
      enableEngagementChart?: boolean;
      showTopThemes?: boolean;
    };
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

// Session validation functions
export function validateSessionData(data: Partial<SessionData>): { isValid: boolean; error?: string } {
  console.log('Validating session data:', JSON.stringify(data, null, 2));
  
  // Check required fields
  if (!data.title?.trim()) {
    console.error('Session validation failed: title is required');
    return { isValid: false, error: 'Session title is required' };
  }
  
  if (!data.user_id) {
    console.error('Session validation failed: user_id is required');
    return { isValid: false, error: 'User ID is required' };
  }
  
  // Check valid status if provided
  if (data.status && !['draft', 'active', 'ended'].includes(data.status)) {
    console.error('Session validation failed: invalid status', data.status);
    return { isValid: false, error: 'Invalid session status' };
  }
  
  // Check connection settings if provided
  if (data.settings?.connection?.anonymityLevel && 
      !['anonymous', 'semi-anonymous', 'non-anonymous'].includes(data.settings.connection.anonymityLevel)) {
    console.error('Session validation failed: invalid anonymity level', data.settings.connection.anonymityLevel);
    return { isValid: false, error: 'Invalid anonymity level' };
  }
  
  // Validate max participants if provided
  if (data.settings?.maxParticipants !== undefined) {
    if (isNaN(data.settings.maxParticipants) || data.settings.maxParticipants < 1) {
      console.error('Session validation failed: invalid max participants count', data.settings.maxParticipants);
      return { isValid: false, error: 'Max participants must be a positive number' };
    }
  }
  
  console.log('Session data validation passed');
  return { isValid: true };
}

export async function createSession(sessionData: Partial<SessionData>) {
  return withRetry(async () => {
    // Validate required fields
    if (!sessionData.user_id || !sessionData.title) {
      throw new Error('Missing required fields: user_id and title are required');
    }

    // Generate a unique access code
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Prepare session data
    const session = {
      ...sessionData,
      status: 'draft',
      access_code: accessCode,
      created_at: new Date().toISOString(),
      settings: {
        ...sessionData.settings,
        participant_settings: {
          anonymity_level: sessionData.settings?.participant_settings?.anonymity_level || 'anonymous',
          require_approval: sessionData.settings?.participant_settings?.require_approval ?? true,
          allow_chat: sessionData.settings?.participant_settings?.allow_chat ?? true,
          allow_reactions: sessionData.settings?.participant_settings?.allow_reactions ?? true
        },
        ai_configuration: {
          model: 'gpt-4',
          temperature: 0.7,
          max_tokens: 2000,
          presence_penalty: 0.5,
          frequency_penalty: 0.5,
          custom_instructions: null
        }
      }
    };

    // Insert session into database
    const { data, error } = await supabase
      .from('sessions')
      .insert(session)
      .select()
      .single();

    if (error) {
      console.error('Create session error:', error);
      throw error;
    }

    return { data, error: null };
  });
}

export async function getSessionById(sessionId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
    
  return { data, error };
}

// ======== Fonctions pour le système de vote ========

// Récupérer tous les participants d'une session
export async function getSessionParticipants(sessionId: string) {
  const { data, error } = await supabase
    .from('session_participants')
    .select('*')
    .eq('session_id', sessionId)
    .order('joined_at');
    
  return { data, error };
}

// Créer ou mettre à jour les paramètres de vote pour une session
export async function saveVoteSettings(sessionId: string, settings: any) {
  // Vérifier si des paramètres existent déjà pour cette session
  const { data: existingSettings } = await supabase
    .from('vote_settings')
    .select('id')
    .eq('session_id', sessionId)
    .single();
  
  if (existingSettings) {
    // Mettre à jour les paramètres existants
    const { data, error } = await supabase
      .from('vote_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSettings.id)
      .select()
      .single();
      
    return { data, error };
  } else {
    // Créer de nouveaux paramètres
    const { data, error } = await supabase
      .from('vote_settings')
      .insert({
        session_id: sessionId,
        ...settings
      })
      .select()
      .single();
      
    return { data, error };
  }
}

// Récupérer les paramètres de vote d'une session
export async function getVoteSettings(sessionId: string) {
  const { data, error } = await supabase
    .from('vote_settings')
    .select('*')
    .eq('session_id', sessionId)
    .single();
    
  return { data, error };
}

// Voter pour un participant
export async function voteForParticipant(sessionId: string, voterId: string, votedForId: string, reason?: string) {
  const { data, error } = await supabase
    .from('participant_votes')
    .insert({
      session_id: sessionId,
      voter_id: voterId,
      voted_for_id: votedForId,
      reason
    })
    .select()
    .single();
    
  return { data, error };
}

// Récupérer les votes émis par un participant
export async function getVotesByParticipant(sessionId: string, participantId: string) {
  const { data, error } = await supabase
    .from('participant_votes')
    .select('*, voted_for_id(anonymous_identifier, nickname, full_name)')
    .eq('session_id', sessionId)
    .eq('voter_id', participantId);
    
  return { data, error };
}

// Récupérer tous les votes d'une session (pour le professeur)
export async function getAllSessionVotes(sessionId: string) {
  const { data, error } = await supabase
    .from('participant_votes')
    .select(`
      *,
      voter:voter_id(id, anonymous_identifier, nickname, full_name),
      voted_for:voted_for_id(id, anonymous_identifier, nickname, full_name)
    `)
    .eq('session_id', sessionId);
    
  return { data, error };
}

// Récupérer les résultats des votes pour une session
export async function getVoteResults(sessionId: string) {
  const { data, error } = await supabase
    .from('vote_results')
    .select(`
      *,
      participant:participant_id(id, anonymous_identifier, nickname, full_name, color, emoji)
    `)
    .eq('session_id', sessionId)
    .order('rank');
    
  return { data, error };
}

// Récupérer uniquement les participants les mieux votés
export async function getTopVotedParticipants(sessionId: string) {
  const { data, error } = await supabase
    .from('vote_results')
    .select(`
      *,
      participant:participant_id(id, anonymous_identifier, nickname, full_name, color, emoji)
    `)
    .eq('session_id', sessionId)
    .eq('is_top_voted', true)
    .order('rank');
    
  return { data, error };
}

// Démarrer une session (changer le statut à 'active')
export async function startSession(sessionId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .update({ 
      status: 'active', 
      started_at: new Date().toISOString() 
    })
    .eq('id', sessionId)
    .select()
    .single();
    
  return { data, error };
}

// Terminer une session (changer le statut à 'ended')
export async function endSession(sessionId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .update({ 
      status: 'ended', 
      ended_at: new Date().toISOString() 
    })
    .eq('id', sessionId)
    .select()
    .single();
    
  return { data, error };
} 