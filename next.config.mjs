/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: true,
    serverActionsBodySizeLimit: '10mb'
  }
};

export default nextConfig; 