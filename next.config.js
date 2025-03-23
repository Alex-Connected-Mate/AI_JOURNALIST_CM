/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,

  eslint: {
    ignoreDuringBuilds: true
  },

  typescript: {
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
    domains: ['localhost', process.env.NEXT_PUBLIC_SUPABASE_URL || ''],
  },

  experimental: {
    ppr: false,
    optimizePackageImports: ['next/navigation'],
    serverComponentsExternalPackages: ['pdf-lib'],
  },

  swcMinify: true,
  compress: true,

  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
    BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
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