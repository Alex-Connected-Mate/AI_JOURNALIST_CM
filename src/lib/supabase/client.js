import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.warn(
      'Supabase credentials are missing. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.'
    );
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
  },
});

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