const { NextResponse } = require('next/server');

/**
 * API route pour récupérer les informations de déploiement Vercel
 */
module.exports.GET = async function() {
  try {
    // Sur Vercel, nous pouvons récupérer certaines informations de déploiement via les variables d'environnement
    // Pour un accès complet à l'API Vercel, il faudrait utiliser un token d'API Vercel
    
    const deploymentInfo = {
      id: process.env.VERCEL_DEPLOYMENT_ID || 'local',
      url: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
      environment: process.env.VERCEL_ENV || 'development',
      createdAt: process.env.VERCEL_GIT_COMMIT_AUTHOR_DATE || new Date().toISOString(),
      status: process.env.VERCEL_ENV ? 'ready' : 'local',
      meta: {
        gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
        gitCommitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE || 'Développement local',
        gitCommitAuthor: process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME || 'Développeur local',
        gitBranch: process.env.VERCEL_GIT_COMMIT_REF || 'main',
        projectId: process.env.VERCEL_PROJECT_ID,
        teamId: process.env.VERCEL_TEAM_ID
      }
    };
    
    // Vérifier si nous sommes sur Vercel
    if (process.env.VERCEL) {
      // Si nous sommes sur Vercel, tenter d'enrichir les données avec l'API Vercel
      // Note: Cela nécessiterait un token d'API Vercel qui n'est pas disponible par défaut
      // Cette partie est donc simulée pour la démonstration
    } else {
      // Ajouter des informations supplémentaires pour l'environnement local
      deploymentInfo.localInfo = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      };
    }
    
    return NextResponse.json(deploymentInfo, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de déploiement:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des informations de déploiement' },
      { status: 500 }
    );
  }
} 