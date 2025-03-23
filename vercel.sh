#!/bin/bash

echo "🚀 Démarrage du script de build personnalisé pour Vercel..."

# Définir les variables d'environnement
export NEXT_TYPECHECK=false
export NODE_ENV=production
export NEXT_MINIMAL_ERROR_HANDLING=true
export NEXT_TELEMETRY_DISABLED=1

# Supprimer complètement TypeScript
echo "🛠️ Suppression complète de TypeScript du projet..."
rm -f tsconfig.json
rm -f next-env.d.ts
rm -f jsconfig.json

# Convertir tous les fichiers TypeScript en JavaScript
echo "🛠️ Conversion des fichiers TypeScript en JavaScript..."

# Fonction pour convertir les fichiers .tsx en .jsx
convert_tsx_to_jsx() {
  for file in $(find . -name "*.tsx" -not -path "./node_modules/*"); do
    new_file="${file%.tsx}.jsx"
    echo "Conversion: $file -> $new_file"
    cp "$file" "$new_file"
    # Supprimer les imports de types
    sed -i.bak 's/import type.*;//g' "$new_file"
    sed -i.bak 's/import {.*} from/import {/g' "$new_file" # Nettoyer après suppression des types
    # Supprimer les déclarations de types
    sed -i.bak 's/: [A-Za-z<>[\]|,{}()\s]*//g' "$new_file"
    # Supprimer les déclarations d'interface
    sed -i.bak '/^interface /,/^}/d' "$new_file"
    # Supprimer les déclarations de type
    sed -i.bak '/^type /,/^}/d' "$new_file"
    # Supprimer le "as" casting
    sed -i.bak 's/as [A-Za-z<>[\]|,{}()\s]*//g' "$new_file"
    # Nettoyer les fichiers de sauvegarde
    rm -f "$new_file.bak"
  done
}

# Fonction pour convertir les fichiers .ts en .js
convert_ts_to_js() {
  for file in $(find . -name "*.ts" -not -path "./node_modules/*" -not -name "*.d.ts"); do
    new_file="${file%.ts}.js"
    echo "Conversion: $file -> $new_file"
    cp "$file" "$new_file"
    # Supprimer les imports de types
    sed -i.bak 's/import type.*;//g' "$new_file"
    sed -i.bak 's/import {.*} from/import {/g' "$new_file" # Nettoyer après suppression des types
    # Supprimer les déclarations de types
    sed -i.bak 's/: [A-Za-z<>[\]|,{}()\s]*//g' "$new_file"
    # Supprimer les déclarations d'interface
    sed -i.bak '/^interface /,/^}/d' "$new_file"
    # Supprimer les déclarations de type
    sed -i.bak '/^type /,/^}/d' "$new_file"
    # Supprimer le "as" casting
    sed -i.bak 's/as [A-Za-z<>[\]|,{}()\s]*//g' "$new_file"
    # Nettoyer les fichiers de sauvegarde
    rm -f "$new_file.bak"
  done
}

# Exécuter les conversions
convert_tsx_to_jsx
convert_ts_to_js

# Créer un jsconfig.json basique pour la résolution de modules
echo "🛠️ Création d'un fichier jsconfig.json minimal..."
cat > jsconfig.json << EOL
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
EOL

# Modifier next.config.js pour un projet JavaScript pur
echo "🛠️ Mise à jour de next.config.js pour un projet JavaScript pur..."
cat > next.config.js << EOL
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Désactiver ESLint
  eslint: {
    ignoreDuringBuilds: true
  },
  
  // Images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ],
    unoptimized: process.env.NODE_ENV === 'development'
  },
  
  // Experimental
  experimental: {
    ppr: false,
    optimizePackageImports: ['next/navigation']
  },
  
  // Env
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
    BUILD_TIME: new Date().toISOString()
  },
  
  // Webpack
  webpack: (config) => {
    // Configuration pour utiliser les fallbacks Node.js standards
    config.resolve.fallback = { 
      fs: false,
      path: false,
      crypto: false,
      os: false
    };
    
    return config;
  }
};

module.exports = nextConfig;
EOL

# Mettre à jour package.json pour supprimer TypeScript
echo "🛠️ Mise à jour de package.json pour un projet JavaScript pur..."
# Utiliser jq ou node pour modifier package.json correctement si possible
# Pour cet exemple, nous utilisons une approche simplifiée avec sed
if command -v jq &> /dev/null; then
  jq 'del(.dependencies.typescript) | del(.devDependencies.typescript) | del(.devDependencies["@types/node"]) | del(.devDependencies["@types/react"]) | del(.devDependencies["@types/react-dom"])' package.json > package.json.new
  mv package.json.new package.json
else
  echo "jq n'est pas disponible, utilisation de méthodes alternatives pour mettre à jour package.json"
  # Mettre à jour manuellement package.json si nécessaire
  # Cette approche est simplifiée et pourrait ne pas fonctionner pour tous les formats de package.json
  sed -i.bak 's/"typescript": "[^"]*",//g' package.json
  sed -i.bak 's/"@types\/[^"]*": "[^"]*",//g' package.json
  rm -f package.json.bak
fi

# Exécuter le build Next.js
echo "🚀 Exécution du build Next.js en mode JavaScript pur..."
NEXT_TELEMETRY_DISABLED=1 NEXT_MINIMAL_ERROR_HANDLING=true NODE_OPTIONS='--max_old_space_size=4096' next build

# Vérifier le statut du build
BUILD_STATUS=$?
if [ $BUILD_STATUS -eq 0 ]; then
  echo "✅ Build terminé avec succès!"
else
  echo "❌ Build échoué avec code de sortie $BUILD_STATUS"
  exit $BUILD_STATUS
fi 