import { createClient } from '@supabase/supabase-js';
import logger from './logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function createSession(sessionData) {
  try {
    logger.info('Creating new session:', sessionData);

    // Call the create_session_secure RPC function
    const { data, error } = await supabase.rpc('create_session_secure', {
      p_title: sessionData.title,
      p_description: sessionData.description || '',
      p_institution: sessionData.institution || '',
      p_professor_name: sessionData.professor_name || '',
      p_show_professor_name: sessionData.show_professor_name !== false,
      p_max_participants: sessionData.max_participants || 30,
      p_settings: sessionData.settings || {},
      p_status: sessionData.status || 'draft'
    });

    if (error) {
      logger.error('Error creating session:', error);
      throw error;
    }

    logger.info('Session created successfully:', data);
    return { data, error: null };
  } catch (error) {
    logger.error('Error in createSession:', error);
    return { data: null, error };
  }
}

// Add other Supabase helper functions here... 