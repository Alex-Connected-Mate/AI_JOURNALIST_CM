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
  
  // Sécurité renforcée
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;",
        },
      ],
    },
  ],
  
  // Configuration des images sécurisée
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname || '',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Activation des vérifications de sécurité
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
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
    
    // Remove the problematic babel-loader rule and let Next.js handle it
    config.module.rules = config.module.rules.filter(rule => {
      if (rule.use && rule.use.loader === 'babel-loader') {
        return false;
      }
      return true;
    });
    
    return config;
  },
};

module.exports = nextConfig; 