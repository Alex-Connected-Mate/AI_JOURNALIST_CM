/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true
  },

  typescript: {
    ignoreBuildErrors: true
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ],
    unoptimized: process.env.NODE_ENV === 'development',
    domains: ['localhost', process.env.NEXT_PUBLIC_SUPABASE_URL || ''],
  },

  experimental: {
    ppr: false,
    optimizePackageImports: ['next/navigation'],
    serverActions: true,
  },

  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
    BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUBSCRIPTION_ENABLED: process.env.NEXT_PUBLIC_SUBSCRIPTION_ENABLED,
  },

  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      crypto: false,
      os: false
    }
    return config
  }
}

module.exports = nextConfig 