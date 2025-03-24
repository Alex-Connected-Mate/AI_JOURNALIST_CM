const { NextResponse } = require('next/server');

/**
 * API route pour télécharger les logs au format JSON
 */
module.exports.GET = async function() {
  try {
    // Récupérer les logs depuis l'API logs
    const response = await fetch(new URL('/api/admin/logs', process.env.VERCEL_URL || 'http://localhost:3000'));
    const data = await response.json();
    
    // Créer un objet contenant les logs et des métadonnées
    const exportData = {
      exportDate: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV || 'development',
      logs: data.logs || []
    };
    
    // Retourner les logs au format JSON avec des headers appropriés pour le téléchargement
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="ai-journalist-logs.json"'
      }
    });
  } catch (error) {
    console.error('Erreur lors du téléchargement des logs:', error);
    
    // En cas d'erreur, retourner un fichier vide avec une indication d'erreur
    const errorData = {
      exportDate: new Date().toISOString(),
      error: 'Erreur lors de la récupération des logs',
      details: error.message,
      logs: []
    };
    
    return new NextResponse(JSON.stringify(errorData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="ai-journalist-logs-error.json"'
      },
      status: 500
    });
  }
} 