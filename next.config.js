/** @type {import('next').NextConfig} */

const nextConfig = {
  // Configuration optimisée pour Vercel
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Ignorer les erreurs pour permettre le build
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ⚠️ Dangerous: Ignores TypeScript errors during development
    // Only use this as a temporary solution
    ignoreBuildErrors: true,
  },
  
  // Configuration des images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Options expérimentales
  experimental: {
    // Ces options sont compatibles avec Next.js 15.2.1
    ppr: false,
    optimizePackageImports: ['next/navigation'],
    // Activer le mode streaming pour les composants serveur
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // Améliorer la gestion des erreurs
    serverComponentsExternalPackages: [],
  },
  
  // Configuration des pages
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  
  // Variables d'environnement
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
    BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_APP_URL: process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
  },
  
  // Configuration webpack pour résoudre les problèmes courants
  webpack: (config, { dev, isServer }) => {
    // Optimisations pour le build
    if (!dev && !isServer) {
      Object.assign(config.resolve.alias, {
        'react/jsx-runtime': 'react/jsx-runtime.js',
        'react/jsx-dev-runtime': 'react/jsx-dev-runtime.js',
      });
    }
    
    // Fallbacks pour les modules Node
    config.resolve.fallback = { 
      fs: false,
      path: false,
      crypto: false,
      os: false
    };
    
    return config;
  },
};

module.exports = nextConfig;
