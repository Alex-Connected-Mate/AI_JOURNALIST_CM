const { NextResponse } = require('next/server');
const { fixAllSessionCodes, fixSessionCodes } = require('@/lib/sessionUtils');
const { supabase } = require('@/lib/supabase');
const { logger } = require('@/lib/logger');

/**
 * API endpoint to fix missing session codes
 * 
 * POST /api/admin/fix-session-codes
 * 
 * Request body:
 * {
 *   sessionId?: string // Optional specific session ID to fix
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   fixedCount?: number,
 *   sessionDetails?: object
 * }
 */
module.exports.POST = async function(request) {
  try {
    const { sessionId } = await request.json();
    
    // Log the request
    logger.info('Fix session codes request', { sessionId: sessionId || 'all' });
    
    let result;
    
    // If a specific session ID is provided, fix only that session
    if (sessionId) {
      // Verify the session exists
      const { data: sessionExists } = await supabase
        .from('sessions')
        .select('id, name, title')
        .eq('id', sessionId)
        .single();
        
      if (!sessionExists) {
        return NextResponse.json({
          success: false,
          message: `Session with ID ${sessionId} not found`
        }, { status: 404 });
      }
      
      // Fix the specific session
      result = await fixSessionCodes(sessionId);
      
      return NextResponse.json({
        success: result.success,
        message: result.success 
          ? `Successfully fixed codes for session "${sessionExists.title || sessionExists.name}"`
          : `Failed to fix codes for session: ${result.error?.message || 'Unknown error'}`,
        sessionDetails: {
          id: sessionId,
          name: sessionExists.name,
          title: sessionExists.title,
          code: result.code,
          sessionCode: result.sessionCode,
          accessCode: result.accessCode
        }
      });
    } 
    // Otherwise, fix all sessions with missing codes
    else {
      result = await fixAllSessionCodes();
      
      return NextResponse.json({
        success: result.success,
        message: result.success
          ? `Successfully fixed ${result.fixedCount} sessions with missing codes`
          : `Failed to fix session codes: ${result.error?.message || 'Unknown error'}`,
        fixedCount: result.fixedCount
      });
    }
  } catch (error) {
    logger.error('Error in fix-session-codes API', error);
    
    return NextResponse.json({
      success: false,
      message: `Server error: ${error.message || 'Unknown error'}`
    }, { status: 500 });
  }
}

module.exports.GET = async function() {
  // For GET requests, return instructions
  return NextResponse.json({
    success: false,
    message: 'This endpoint requires a POST request with an optional sessionId parameter'
  }, { status: 405 });
} 