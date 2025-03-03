/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // i18n configuration in next.config.js is not supported in App Router
  // Use middleware.ts instead for internationalization in App Router
  
  // Customize how error pages are handled during static export
  experimental: {
    // This option turns off special handling for 404 pages during static export
    // which will prevent the error when generating _not-found pages
    ppr: false,
    // Skip the generation of static exports for pages that might cause issues
    skipMiddlewareUrlNormalize: true,
    // Use the App Router's not-found handling whenever possible
    optimizePackageImports: ['next/navigation']
  },
  
  // This tells Next.js how to generate the 404 page
  async generateStaticParams() {
    return [];
  },
};

module.exports = nextConfig;
