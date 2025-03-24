const { NextResponse } = require('next/server');
const pkg = require('../../../../../package.json');

/**
 * API route pour récupérer les informations système
 * Compatible avec l'environnement Vercel
 */
module.exports.GET = async function() {
  try {
    // Récupérer les informations système
    const systemInfo = {
      nextVersion: `Next.js ${pkg.dependencies.next.replace('^', '')}`,
      nodeVersion: process.env.NODE_VERSION || process.version,
      environment: process.env.NODE_ENV,
      buildTime: process.env.BUILD_TIME || new Date().toISOString(),
      lastDeployment: process.env.VERCEL_GIT_COMMIT_MESSAGE || 'Inconnu',
      vercelEnv: process.env.VERCEL_ENV || 'development'
    };
    
    return NextResponse.json(systemInfo, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération des informations système:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des informations système' },
      { status: 500 }
    );
  }
} 