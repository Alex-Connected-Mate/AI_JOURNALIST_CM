import { createClient } from '@supabase/supabase-js';

// These environment variables will need to be set in a .env.local file
// or in Vercel's deployment settings
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or API key');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for authentication
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// Profile management functions
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  return { data, error };
}

export async function updateUserProfile(userId: string, profileData: any) {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...profileData,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();
    
  return { data, error };
}

export async function uploadProfileImage(userId: string, file: File) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-avatar.${fileExt}`;
  
  // Upload the file to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from('avatars')
    .upload(fileName, file, {
      upsert: true
    });
    
  if (uploadError) {
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
  
  return { data, error };
}

// Helper functions for session data management
export async function getSessions(userId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId);
    
  return { data, error };
}

export async function createSession(sessionData: any) {
  const { data, error } = await supabase
    .from('sessions')
    .insert(sessionData)
    .select()
    .single();
    
  return { data, error };
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