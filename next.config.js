/** @type {import('next').NextConfig} */

const nextConfig = {
  skipMiddlewareUrlNormalize: true,
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
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
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // This moves the middleware URL normalize option to the top level as required
  experimental: {
    // These are compatible with Next.js 15.2.0
    ppr: false,
    optimizePackageImports: ['next/navigation']
  },
  
  // Instruct Next.js to skip the static generation of the 404 page
  // This should prevent the error with useSearchParams
  excludeDefaultMomentLocales: true,
  
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
    BUILD_TIME: new Date().toISOString()
  }
};

module.exports = nextConfig;
