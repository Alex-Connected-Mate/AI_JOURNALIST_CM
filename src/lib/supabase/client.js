import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Create a singleton instance to prevent multiple GoTrueClient instances
let supabaseInstance = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient();
  }
  return supabaseInstance;
}

// For backward compatibility with existing code
export const supabase = getSupabaseClient();

// Helper pour écouter les changements d'auth
export const subscribeToAuthChanges = (callback) => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  
  return data?.subscription || null;
};

// Helper pour obtenir l'utilisateur actuel
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper pour obtenir la session actuelle
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// Helper pour se déconnecter
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
}; 