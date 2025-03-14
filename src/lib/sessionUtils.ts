/**
 * Utilities for managing session codes
 */

import { supabase } from './supabase';

/**
 * Generates a random session code (6 characters, uppercase alphanumeric)
 */
export function generateSessionCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Checks if a session has valid codes and returns them
 */
export async function checkSessionCodes(sessionId: string): Promise<{
  hasValidCodes: boolean;
  code: string | null;
  sessionCode: string | null;
  accessCode: string | null;
}> {
  // Query the session to check its codes
  const { data, error } = await supabase
    .from('sessions')
    .select('code, session_code, access_code')
    .eq('id', sessionId)
    .single();
    
  if (error || !data) {
    console.error('Error checking session codes:', error);
    return {
      hasValidCodes: false,
      code: null,
      sessionCode: null,
      accessCode: null
    };
  }
  
  // Check if any codes are missing
  const hasValidCodes = 
    !!data.code && 
    !!data.session_code && 
    !!data.access_code;
    
  return {
    hasValidCodes,
    code: data.code,
    sessionCode: data.session_code,
    accessCode: data.access_code
  };
}

/**
 * Fixes missing session codes by generating and updating them
 */
export async function fixSessionCodes(sessionId: string): Promise<{
  success: boolean;
  code: string | null;
  sessionCode: string | null;
  accessCode: string | null;
  error?: any;
}> {
  try {
    // Check current codes
    const { hasValidCodes, code, sessionCode, accessCode } = await checkSessionCodes(sessionId);
    
    // If codes are valid, just return them
    if (hasValidCodes) {
      return {
        success: true,
        code,
        sessionCode,
        accessCode
      };
    }
    
    // Generate any missing codes
    const updatedCodes: {
      code?: string;
      session_code?: string;
      access_code?: string;
    } = {};
    
    if (!code) {
      updatedCodes.code = generateSessionCode();
    }
    
    if (!sessionCode) {
      updatedCodes.session_code = generateSessionCode();
    }
    
    if (!accessCode) {
      updatedCodes.access_code = generateSessionCode();
    }
    
    // Update the session with new codes
    const { data, error } = await supabase
      .from('sessions')
      .update(updatedCodes)
      .eq('id', sessionId)
      .select('code, session_code, access_code')
      .single();
      
    if (error) {
      console.error('Error updating session codes:', error);
      return {
        success: false,
        code: code,
        sessionCode: sessionCode,
        accessCode: accessCode,
        error
      };
    }
    
    console.log('Session codes fixed successfully:', data);
    
    return {
      success: true,
      code: data.code,
      sessionCode: data.session_code,
      accessCode: data.access_code
    };
  } catch (error) {
    console.error('Exception fixing session codes:', error);
    return {
      success: false,
      code: null,
      sessionCode: null,
      accessCode: null,
      error
    };
  }
}

/**
 * Fixes ALL sessions with missing codes in the database
 */
export async function fixAllSessionCodes(): Promise<{
  success: boolean;
  fixedCount: number;
  error?: any;
}> {
  try {
    // Find all sessions with missing codes
    const { data: missingSessions, error: queryError } = await supabase
      .from('sessions')
      .select('id')
      .or('code.is.null,session_code.is.null,access_code.is.null');
      
    if (queryError) {
      console.error('Error finding sessions with missing codes:', queryError);
      return {
        success: false,
        fixedCount: 0,
        error: queryError
      };
    }
    
    if (!missingSessions || missingSessions.length === 0) {
      console.log('No sessions with missing codes found');
      return {
        success: true,
        fixedCount: 0
      };
    }
    
    console.log(`Found ${missingSessions.length} sessions with missing codes`);
    
    // Fix each session one by one
    let fixedCount = 0;
    
    for (const session of missingSessions) {
      const { success } = await fixSessionCodes(session.id);
      if (success) {
        fixedCount++;
      }
    }
    
    return {
      success: true,
      fixedCount
    };
  } catch (error) {
    console.error('Exception fixing all session codes:', error);
    return {
      success: false,
      fixedCount: 0,
      error
    };
  }
} 