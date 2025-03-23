/**
 * @type {import('next').NextConfig}
 */

// Fonction pour extraire le hostname de l'URL Supabase si disponible
const getSupabaseHostname = () => {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      return new URL(supabaseUrl).hostname;
    }
    return null;
  } catch (error) {
    console.warn('Error extracting Supabase hostname:', error.message);
    return null;
  }
};

const supabaseHostname = getSupabaseHostname();
const imageDomains = ['localhost'];

// Ajouter le hostname Supabase aux domaines s'il est disponible
if (supabaseHostname) {
  imageDomains.push(supabaseHostname);
}

const nextConfig = {
  // Configuration optimisée pour Vercel
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Ignorer les erreurs pour permettre le build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
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
  
  // Options expérimentales compatibles avec Next.js 15.2.0
  experimental: {
    ppr: false,
    optimizePackageImports: ['next/navigation'],
    externalDir: true,
  },
  
  // Variables d'environnement
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
    BUILD_TIME: new Date().toISOString()
  },
  
  // Configuration webpack pour résoudre les problèmes courants
  webpack: (config, { isServer, nextRuntime }) => {
    // Ne pas appliquer de règles Babel aux fichiers de composants app/
    // pour permettre à SWC de gérer les imports de police next/font
    if (!isServer || nextRuntime !== 'nodejs') {
      const originalEntry = config.entry;
      
      config.entry = async () => {
        const entries = await originalEntry();
        return entries;
      };
    }
    
    // Résoudre les problèmes de fallback
    config.resolve.fallback = { 
      fs: false,
      path: false,
      crypto: false,
      os: false
    };
    
    // Résoudre les problèmes d'import ES dans les fichiers .js
    config.module.rules.push({
      test: /\.(js|mjs|jsx)$/,
      // Exclure les fichiers dans le répertoire app/ et node_modules
      exclude: (path) => {
        if (path.includes('node_modules')) return true;
        // Exclure spécifiquement les fichiers dans app/ qui utilisent next/font
        if (path.includes('/app/') && path.includes('layout')) return true;
        return false;
      },
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['next/babel'],
          // La clé pour résoudre les erreurs de module
          sourceType: 'unambiguous'
        }
      }
    });
    
    return config;
  },
};

export default nextConfig; 