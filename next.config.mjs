/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Configuration expérimentale
  experimental: {
    esmExternals: 'loose',
  },
  
  // Configuration webpack personnalisée
  webpack: (config, { dev, isServer }) => {
    // Désactiver le HMR en développement
    if (dev) {
      config.plugins = config.plugins.filter(plugin => 
        plugin.constructor.name !== 'HotModuleReplacementPlugin'
      );
    }
    
    // Ajouter une règle pour les fichiers JS/JSX
    config.module.rules.push({
      test: /\.(js|jsx)$/,
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
  
  // Désactiver l'export statique pour permettre les API Routes
  output: 'standalone',
  
  // Configuration des images
  images: {
    domains: ['localhost'],
    unoptimized: true
  }
};

export default nextConfig; 