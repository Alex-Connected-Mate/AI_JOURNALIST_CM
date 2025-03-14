import { NextRequest, NextResponse } from 'next/server';
import { fixAllSessionCodes, fixSessionCodes } from '@/lib/sessionUtils';
import { supabase } from '@/lib/supabase';

/**
 * API handler to fix session codes
 * 
 * This endpoint can be called in two ways:
 * 1. To fix all sessions: POST /api/admin/fix-session-codes
 * 2. To fix specific session: POST /api/admin/fix-session-codes?id=session_id
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate the request (only admins should use this)
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. You must be logged in to use this endpoint.' },
        { status: 401 }
      );
    }
    
    // Get user role from the database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
      
    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Admin role required.' },
        { status: 403 }
      );
    }
    
    // Check if we're fixing a specific session
    const sessionId = request.nextUrl.searchParams.get('id');
    
    if (sessionId) {
      // Fix specific session
      const result = await fixSessionCodes(sessionId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: 'Failed to fix session codes', details: result.error },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: `Fixed codes for session ${sessionId}`,
        codes: {
          code: result.code,
          sessionCode: result.sessionCode,
          accessCode: result.accessCode
        }
      });
    }
    
    // Fix all sessions with missing codes
    const result = await fixAllSessionCodes();
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to fix all session codes', details: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Fixed codes for ${result.fixedCount} sessions`
    });
  } catch (error) {
    console.error('Error in fix-session-codes API:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 