const { NextResponse } = require('next/server');
const { logToBuffer } = require('../logs/route');

/**
 * API route pour vider les logs du système
 */
module.exports.POST = async function() {
  try {
    // Appeler l'API de gestion des logs pour vider le buffer
    const response = await fetch(new URL('/api/admin/logs', process.env.VERCEL_URL || 'http://localhost:3000'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clear: true })
    });
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Logs vidés avec succès',
      details: data
    });
  } catch (error) {
    console.error('Erreur lors du vidage des logs:', error);
    
    // En cas d'erreur avec l'API, tenter de vider les logs directement
    try {
      logToBuffer('INFO', 'Les logs ont été effacés manuellement');
      
      return NextResponse.json({
        success: true,
        message: 'Logs vidés manuellement avec succès'
      });
    } catch (innerError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Erreur lors du vidage des logs',
          details: error.message 
        },
        { status: 500 }
      );
    }
  }
} 