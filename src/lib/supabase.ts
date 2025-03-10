import { createClient } from '@supabase/supabase-js';

// These environment variables will need to be set in a .env.local file
// or in Vercel's deployment settings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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

// Profile management functions with retry logic
export async function getUserProfile(userId: string) {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error('Get user profile error:', error.message);
      throw error;
    }
      
    return { data, error };
  });
}

export async function updateUserProfile(userId: string, profileData: any) {
  return withRetry(async () => {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
      
    if (error) {
      console.error('Update user profile error:', error.message);
      throw error;
    }
      
    return { data, error };
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
        return { data: null, error: uploadError };
      }
      
      // Get the public URL for the uploaded file
      const { data: urlData } = await supabase
        .storage
        .from('avatars')
        .getPublicUrl(fileName);
        
      // Update the user's profile with the new avatar URL
      const { data, error } = await updateUserProfile(userId, {
        avatar_url: urlData?.publicUrl
      });
      
      if (error) {
        console.error('Update avatar URL error:', error);
        throw error;
      }
      
      return { data, error };
    } catch (error) {
      console.error('Profile image upload failed:', error);
      throw error;
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
    try {
      console.log('Creating session with data:', sessionData);
      
      // Validate session data
      const validation = validateSessionData(sessionData);
      if (!validation.isValid) {
        console.error('Session validation failed:', validation.error);
        throw new Error(validation.error || 'Invalid session data');
      }
      
      // Generate a random access code (6 characters, uppercase letters and numbers)
      const generateAccessCode = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return Array.from({length: 6}, () => 
          characters.charAt(Math.floor(Math.random() * characters.length))
        ).join('');
      };

      // Map the application SessionData to the database schema fields
      const dbSessionData = {
        user_id: sessionData.user_id,
        name: sessionData.title, // Map title to name in DB
        institution: sessionData.settings?.institution || null,
        professor_name: sessionData.settings?.professorName || null,
        show_professor_name: sessionData.settings?.showProfessorName !== undefined ? 
          sessionData.settings.showProfessorName : true,
        max_participants: sessionData.settings?.maxParticipants || 100,
        status: sessionData.status || 'draft',
        access_code: generateAccessCode(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        started_at: sessionData.started_at || null,
        ended_at: sessionData.ended_at || null
      };

      console.log('Mapped session data for DB:', dbSessionData);

      // Insert the session
      const { data: result, error } = await supabase
        .from('sessions')
        .insert(dbSessionData)
        .select()
        .single();
        
      if (error) {
        console.error('Failed to create session:', error);
        throw error;
      }
      
      console.log('Session created successfully:', result);
      
      // Create session profile if anonymity level is specified
      if (sessionData.settings?.connection?.anonymityLevel) {
        try {
          console.log('Creating session profile with anonymity level:', 
            sessionData.settings.connection.anonymityLevel);
            
          const profileData = {
            session_id: result.id,
            profile_mode: sessionData.settings.connection.anonymityLevel,
            color: sessionData.settings.connection.color || null,
            emoji: sessionData.settings.connection.emoji || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { error: profileError } = await supabase
            .from('session_profiles')
            .insert(profileData);
            
          if (profileError) {
            console.warn('Failed to create session profile:', profileError);
            // Continue execution, don't throw error for profile creation failure
          } else {
            console.log('Session profile created successfully');
          }
        } catch (profileErr) {
          console.warn('Error creating session profile:', profileErr);
          // Continue execution, don't throw error for profile creation failure
        }
      } else {
        console.log('No anonymity level specified, skipping profile creation');
      }
      
      // Create vote settings with defaults
      try {
        const voteSettingsData = {
          session_id: result.id,
          max_votes_per_participant: 3,
          require_reason: false,
          voting_duration: 1200, // 20 minutes in seconds
          top_voted_count: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { error: voteSettingsError } = await supabase
          .from('vote_settings')
          .insert(voteSettingsData);
          
        if (voteSettingsError) {
          console.warn('Failed to create vote settings:', voteSettingsError);
          // Continue execution, don't throw error for vote settings creation failure
        } else {
          console.log('Vote settings created successfully');
        }
      } catch (voteSettingsErr) {
        console.warn('Error creating vote settings:', voteSettingsErr);
        // Continue execution, don't throw error for vote settings creation failure
      }
      
      return { data: result, error: null };
    } catch (error) {
      console.error('Session creation failed:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error during session creation') 
      };
    }
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