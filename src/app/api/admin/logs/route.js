import { NextResponse } from 'next/server';

let logBuffer = [];

/**
 * Stocke un log dans le buffer temporaire
 * En production, ces logs seraient plutôt stockés dans une base de données ou un service comme Supabase
 */
export function logToBuffer(level, message, meta = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    meta,
  };
  
  logBuffer.push(logEntry);
  
  // Limiter la taille du buffer (garder les 1000 derniers logs)
  if (logBuffer.length > 1000) {
    logBuffer = logBuffer.slice(-1000);
  }
  
  return logEntry;
}

/**
 * API route pour récupérer les logs du système
 */
export async function GET() {
  try {
    // En environnement de production réel, on récupérerait les logs depuis une base de données
    // Pour cette démonstration, nous utilisons un buffer en mémoire
    
    // Si le buffer est vide, ajouter quelques logs d'exemple
    if (logBuffer.length === 0) {
      logToBuffer('INFO', 'Application démarrée');
      logToBuffer('INFO', 'Connexion à Supabase établie');
      logToBuffer('WARN', 'API dépréciée utilisée: /api/legacy/sessions');
      logToBuffer('ERROR', 'Erreur lors de la récupération des sessions', { errorCode: 500 });
      logToBuffer('INFO', 'Vérification des configurations terminée');
    }
    
    return NextResponse.json({ 
      logs: logBuffer,
      count: logBuffer.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des logs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des logs' },
      { status: 500 }
    );
  }
}

/**
 * API route pour télécharger les logs au format JSON
 */
export async function POST(request) {
  try {
    const body = await request.json();
    
    if (body.clear === true) {
      // Vider le buffer de logs
      const count = logBuffer.length;
      logBuffer = [];
      
      // Ajouter un log indiquant que les logs ont été effacés
      logToBuffer('INFO', 'Les logs ont été effacés', { count });
      
      return NextResponse.json({ 
        success: true,
        message: `${count} logs ont été effacés`
      });
    }
    
    // Ajouter un nouveau log
    if (body.log) {
      const { level = 'INFO', message, meta = {} } = body.log;
      const logEntry = logToBuffer(level, message, meta);
      
      return NextResponse.json({ 
        success: true,
        log: logEntry
      });
    }
    
    return NextResponse.json({ 
      success: false,
      error: 'Action non reconnue'
    }, { status: 400 });
  } catch (error) {
    console.error('Erreur lors du traitement des logs:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement des logs' },
      { status: 500 }
    );
  }
} 