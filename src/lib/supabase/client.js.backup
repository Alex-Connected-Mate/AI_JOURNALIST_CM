const { createClientComponentClient } = require('@supabase/auth-helpers-nextjs');

// Create a singleton instance to prevent multiple GoTrueClient instances
let supabaseInstance = null;
let lastInitializedUrl = null;

// Function to validate Supabase environment variables
function validateSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const isValid = supabaseUrl && supabaseKey;
  
  if (!isValid) {
    console.error('Missing required Supabase environment variables:',
      !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : '',
      !supabaseKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : ''
    );
  }
  
  return { isValid, supabaseUrl, supabaseKey };
}

function getSupabaseClient() {
  // Check environment variables on every call
  const { isValid, supabaseUrl, supabaseKey } = validateSupabaseEnv();
  
  // If URL has changed or not initialized, recreate the client
  if (!supabaseInstance || lastInitializedUrl !== supabaseUrl) {
    try {
      if (!isValid) {
        console.error('Cannot initialize Supabase client with missing environment variables');
        // Return a dummy client that will gracefully fail
        return {
          auth: {
            getSession: async () => ({ data: { session: null }, error: new Error('Supabase client not properly initialized') }),
            getUser: async () => ({ data: { user: null }, error: new Error('Supabase client not properly initialized') }),
            signOut: async () => ({ error: new Error('Supabase client not properly initialized') }),
            onAuthStateChange: () => ({ data: { subscription: null } }),
          },
          from: () => ({
            select: () => ({ data: null, error: new Error('Supabase client not properly initialized') }),
            insert: () => ({ data: null, error: new Error('Supabase client not properly initialized') }),
            update: () => ({ data: null, error: new Error('Supabase client not properly initialized') }),
            delete: () => ({ data: null, error: new Error('Supabase client not properly initialized') }),
          }),
        };
      }
      
      supabaseInstance = createClientComponentClient({
        supabaseUrl,
        supabaseKey,
        options: {
          // Set global options for better error handling
          auth: {
            persistSession: true,
            autoRefreshToken: true, 
          },
          global: {
            headers: { 'x-client-info': 'vercel-next-js' },
            fetch: (...args) => fetch(...args).catch(error => {
              console.error('Supabase fetch error:', error);
              throw error;
            }),
          },
        },
      });
      
      lastInitializedUrl = supabaseUrl;
      console.log('Supabase client initialized successfully');
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
      // Return a dummy client that will fail gracefully
      return {
        auth: {
          getSession: async () => ({ data: { session: null }, error }),
          getUser: async () => ({ data: { user: null }, error }),
          signOut: async () => ({ error }),
          onAuthStateChange: () => ({ data: { subscription: null } }),
        },
        from: () => ({
          select: () => ({ data: null, error }),
          insert: () => ({ data: null, error }),
          update: () => ({ data: null, error }),
          delete: () => ({ data: null, error }),
        }),
      };
    }
  }
  
  return supabaseInstance;
}

// For backward compatibility with existing code
const supabase = getSupabaseClient();

// Helper for listening to auth changes
const subscribeToAuthChanges = (callback) => {
  try {
    const client = getSupabaseClient();
    const { data } = client.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    
    return data?.subscription || null;
  } catch (error) {
    console.error('Error subscribing to auth changes:', error);
    return null;
  }
};

// Helper to get the current user
const getCurrentUser = async () => {
  try {
    const client = getSupabaseClient();
    const { data: { user }, error } = await client.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error.message);
    return null;
  }
};

// Helper to get the current session
const getCurrentSession = async () => {
  try {
    const client = getSupabaseClient();
    const { data: { session }, error } = await client.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Error getting current session:', error.message);
    return null;
  }
};

// Helper to sign out
const signOut = async () => {
  try {
    const client = getSupabaseClient();
    const { error } = await client.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error.message);
    return { error };
  }
}; 

module.exports = { getSupabaseClient, supabase, subscribeToAuthChanges, getCurrentUser, getCurrentSession, signOut };
