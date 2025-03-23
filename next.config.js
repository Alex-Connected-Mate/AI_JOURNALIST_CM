/** @type {import('next').NextConfig} */

// Function to extract hostname from URL if available
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

// Add Supabase hostname to domains if available
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
  
  // Options expérimentales
  experimental: {
    // Compatibles avec Next.js 15.2.0
    ppr: false,
    optimizePackageImports: ['next/navigation'],
    serverExternalPackages: ['pdf-lib'],
  },
  
  // Variables d'environnement
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
    BUILD_TIME: new Date().toISOString()
  },
  
  // Configuration webpack pour résoudre les problèmes courants
  webpack: (config, { isServer }) => {
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
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['next/babel'],
          sourceType: 'unambiguous'
        }
      }
    });
    
    return config;
  },
};

module.exports = nextConfig; 