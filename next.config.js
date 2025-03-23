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
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true
  },

  typescript: {
    // Necessary for deployment but we should fix type errors in development
    ignoreBuildErrors: true,
    tsconfigPath: "./tsconfig.json"
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ],
    unoptimized: process.env.NODE_ENV === 'development',
    domains: imageDomains,
  },

  experimental: {
    // These options are compatible with Next.js 15.2.0
    ppr: false,
    optimizePackageImports: ['next/navigation'],
    serverComponentsExternalPackages: ['pdf-lib'],
  },

  swcMinify: true,
  compress: true,

  // Ensure environment variables are resolved at runtime when possible
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
    BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  },

  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      crypto: false,
      os: false
    };
    
    // Add a custom plugin to perform runtime checks
    config.plugins.push({
      apply: (compiler) => {
        compiler.hooks.afterEmit.tap('CheckEnvVars', (compilation) => {
          const requiredVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
          const missingVars = requiredVars.filter(varName => !process.env[varName]);
          
          if (missingVars.length > 0) {
            console.warn('\x1b[33m%s\x1b[0m', `⚠️  Warning: The following environment variables are missing: ${missingVars.join(', ')}`);
            console.warn('\x1b[33m%s\x1b[0m', '⚠️  Some functionality may not work correctly.');
          }
        });
      }
    });
    
    return config;
  }
}

module.exports = nextConfig 