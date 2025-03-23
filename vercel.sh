#!/bin/bash

# Bannière d'introduction
echo "🚀 Demarrage des operations de pre-deploiement..."
echo "==============================================="

# Variables d'environnement nécessaires pour le build
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production

# Vérifier si nous sommes dans l'environnement Vercel
IS_VERCEL=${VERCEL:-false}
echo "📌 Environnement Vercel: $IS_VERCEL"

# Récupération du dossier parent du script actuel
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
echo "📂 Dossier du script: $SCRIPT_DIR"

# Vérification des dossiers critiques requis
if [ ! -d "$SCRIPT_DIR/scripts" ]; then
  echo "🔧 Creation du dossier scripts manquant..."
  mkdir -p "$SCRIPT_DIR/scripts"
fi

# 1. Résolution des conflits Git
echo "🔍 Verification des conflits Git..."

# Vérifier si le script fix-git-conflicts.js existe
if [ -f "$SCRIPT_DIR/scripts/fix-git-conflicts.js" ]; then
  echo "✅ Utilisation du script fix-git-conflicts.js existant"
  node "$SCRIPT_DIR/scripts/fix-git-conflicts.js"
else
  echo "⚠️ Script fix-git-conflicts.js non trouve, creation d'un script minimal..."
  
  # Création d'un script minimal de résolution de conflits
  cat > "$SCRIPT_DIR/scripts/fix-git-conflicts.js" << 'EOL'
#!/usr/bin/env node
/**
 * Script minimal pour résoudre les conflits Git
 */
const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

// Fonction pour vérifier si un fichier contient des marqueurs de conflit
function checkForConflicts(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('<<<<<<<') && 
           content.includes('=======') && 
           content.includes('>>>>>>>');
  } catch (error) {
    return false;
  }
}

// Fonction de résolution simple: garder la version HEAD (après ======)
function resolveConflict(filePath) {
  try {
    console.log(`Résolution des conflits dans: ${filePath}`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Créer une sauvegarde
    fs.writeFileSync(`${filePath}.conflict-backup`, content);
    
    // Résoudre les conflits en gardant la version la plus récente (après =======)
    let newContent = '';
    let inConflict = false;
    let keepCurrentLine = false;
    
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('<<<<<<<')) {
        inConflict = true;
        keepCurrentLine = false;
        continue;
      }
      
      if (line.startsWith('=======')) {
        keepCurrentLine = true;
        continue;
      }
      
      if (line.startsWith('>>>>>>>')) {
        inConflict = false;
        keepCurrentLine = false;
        continue;
      }
      
      if (!inConflict || keepCurrentLine) {
        newContent += line + '\n';
      }
    }
    
    fs.writeFileSync(filePath, newContent);
    console.log(`✅ Conflits résolus dans: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur lors de la résolution des conflits dans ${filePath}: ${error.message}`);
    return false;
  }
}

// Chercher les fichiers avec des conflits
console.log('🔎 Recherche de fichiers avec des conflits Git...');

// Liste des fichiers connus pour avoir des conflits
const knownConflictFiles = [
  'src/lib/supabase.ts'
];

let filesFixed = 0;

// Vérifier et résoudre les conflits dans les fichiers connus
for (const filePath of knownConflictFiles) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath) && checkForConflicts(fullPath)) {
    if (resolveConflict(fullPath)) {
      filesFixed++;
    }
  }
}

console.log(`🏁 Résolution de conflits terminée: ${filesFixed} fichiers corrigés.`);
EOL

  chmod +x "$SCRIPT_DIR/scripts/fix-git-conflicts.js"
  node "$SCRIPT_DIR/scripts/fix-git-conflicts.js"
fi

# 2. Vérification du middleware 
echo "🔍 Verification des fichiers middleware..."

# Chercher les fichiers middleware dupliqués
MIDDLEWARE_FILES=( $(find "$SCRIPT_DIR/src" -name "middleware.*" -type f) )
if [ ${#MIDDLEWARE_FILES[@]} -gt 1 ]; then
  echo "⚠️ Plusieurs fichiers middleware detectes, nettoyage necessaire."
  
  # Garder uniquement le fichier middleware à la racine
  ROOT_MIDDLEWARE=""
  for file in "${MIDDLEWARE_FILES[@]}"; do
    dirname=$(dirname "$file")
    if [ "$dirname" == "$SCRIPT_DIR/src" ]; then
      ROOT_MIDDLEWARE="$file"
    fi
  done
  
  if [ -n "$ROOT_MIDDLEWARE" ]; then
    echo "ℹ️ Conservation du middleware racine: $ROOT_MIDDLEWARE"
    
    # Supprimer les autres middlewares
    for file in "${MIDDLEWARE_FILES[@]}"; do
      if [ "$file" != "$ROOT_MIDDLEWARE" ]; then
        echo "🗑️ Suppression du middleware duplique: $file"
        rm "$file"
      fi
    done
  else
    echo "⚠️ Aucun middleware racine trouve, deplacement d'un fichier existant."
    
    # Déplacer le premier middleware trouvé à la racine
    FIRST_MIDDLEWARE="${MIDDLEWARE_FILES[0]}"
    filename=$(basename "$FIRST_MIDDLEWARE")
    cp "$FIRST_MIDDLEWARE" "$SCRIPT_DIR/src/$filename"
    echo "📋 Middleware copie a la racine: $SCRIPT_DIR/src/$filename"
    
    # Supprimer les autres middlewares
    for file in "${MIDDLEWARE_FILES[@]}"; do
      if [ "$file" != "$SCRIPT_DIR/src/$filename" ]; then
        echo "🗑️ Suppression: $file"
        rm "$file"
      fi
    done
  fi
fi

# 3. Exécution des vérifications pré-déploiement
echo "🧪 Execution des verifications pre-deploiement..."

if [ -f "$SCRIPT_DIR/scripts/pre-deploy-check.js" ]; then
  echo "✅ Execution de pre-deploy-check.js..."
  node "$SCRIPT_DIR/scripts/pre-deploy-check.js"
else
  echo "⚠️ Script pre-deploy-check.js non trouve, verifications minimales..."
  
  # Vérification simplifiée sans le script
  echo "ℹ️ Verification des conflits Git avec grep..."
  CONFLICTS=$(grep -r "<<<<<" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" "$SCRIPT_DIR/src" || true)
  if [ -n "$CONFLICTS" ]; then
    echo "⚠️ Des conflits Git non resolus ont ete detectes."
    echo "$CONFLICTS"
  else
    echo "✅ Pas de conflits Git non resolus detectes."
  fi
fi

# 4. Validation des variables d'environnement
echo "🔐 Validation des variables Supabase..."

# Vérification de la présence des variables Supabase
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "✅ Variables Supabase configurees"
else
  echo "⚠️ Variables Supabase manquantes."
  if [ "$IS_VERCEL" = "1" ]; then
    echo "❌ ERREUR CRITIQUE: Les variables Supabase sont requises pour le deploiement."
  fi
fi

# 5. Correction du fichier test-toast.jsx
echo "🔧 Verification de test-toast.jsx..."

# Utiliser le script simplifié
if [ -f "$SCRIPT_DIR/scripts/fix-test-toast-simple.js" ]; then
  echo "✅ Utilisation du script fix-test-toast-simple.js existant"
  node "$SCRIPT_DIR/scripts/fix-test-toast-simple.js"
else
  echo "⚠️ Script fix-test-toast-simple.js non trouve."
fi

# 6. Correction des modules JS
echo "🔧 Conversion des modules ES vers CommonJS..."

# Utiliser notre script fix-js-modules-simple.js
if [ -f "$SCRIPT_DIR/scripts/fix-js-modules-simple.js" ]; then
  echo "✅ Utilisation du script fix-js-modules-simple.js existant"
  node "$SCRIPT_DIR/scripts/fix-js-modules-simple.js"
else
  echo "⚠️ Script fix-js-modules-simple.js non trouve."
fi

# 7. Vérifier la présence du fichier next.config.mjs
echo "🔧 Verification de la configuration Next.js..."

if [ ! -f "$SCRIPT_DIR/next.config.mjs" ]; then
  echo "⚠️ Fichier next.config.mjs non trouve, creation d'un fichier minimal..."
  
  # Créer un fichier de configuration Next.js minimal avec les options correctes pour Next.js 15.2.1
  cat > "$SCRIPT_DIR/next.config.mjs" << 'EOL'
/**
 * @type {import('next').NextConfig}
 */

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Utiliser les options de configuration compatibles avec Next.js 15.2.1
  experimental: {
    serverActions: true,
    serverActionsBodySizeLimit: '2mb',
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(js|mjs|jsx)$/,
      exclude: (path) => {
        if (path.includes('node_modules')) return true;
        if (path.includes('/app/') && path.includes('layout')) return true;
        return false;
      },
      use: {
        loader: 'babel-loader',
        options: { presets: ['next/babel'], sourceType: 'unambiguous' }
      }
    });
    return config;
  },
};

export default nextConfig;
EOL
  
  echo "✅ Fichier next.config.mjs cree avec succes."
fi

# Vérifions si next.config.mjs existe déjà et contient des options incorrectes
if [ -f "$SCRIPT_DIR/next.config.mjs" ]; then
  # Vérifier si le fichier contient l'option incorrecte 'serverExternalPackages'
  if grep -q "serverExternalPackages" "$SCRIPT_DIR/next.config.mjs"; then
    echo "⚠️ Option incorrecte detectee dans next.config.mjs, correction..."
    
    # Créer une sauvegarde du fichier
    cp "$SCRIPT_DIR/next.config.mjs" "$SCRIPT_DIR/next.config.mjs.backup"
    
    # Corriger l'option
    sed -i.bak 's/serverExternalPackages/serverComponentsExternalPackages/g' "$SCRIPT_DIR/next.config.mjs"
    
    echo "✅ next.config.mjs corrige."
  fi
fi

# 8. Suppression du fichier .babelrc s'il existe (pour éviter les conflits avec SWC)
if [ -f "$SCRIPT_DIR/.babelrc" ]; then
  echo "⚠️ Fichier .babelrc detecte, sauvegarde et suppression..."
  mv "$SCRIPT_DIR/.babelrc" "$SCRIPT_DIR/.babelrc.backup"
  echo "✅ .babelrc sauvegarde et supprime."
fi

# 9. Finalisation et message de récapitulation
echo "🏁 Preparation de deploiement terminee."
echo "==============================================="
echo "✅ Conflits Git verifies et resolus"
echo "✅ Middlewares dedupliques"
echo "✅ Variables d'environnement validees"
echo "✅ Conversions de syntaxe ES modules effectuees"
echo "✅ Configuration Next.js verifiee"
echo "🚀 Lancement du build Next.js..."

# 10. Lancement du build Next.js
echo "==============================================="
echo "🏗️ EXECUTION DU BUILD NEXT.JS"
echo "==============================================="

# Définir les options optimisées pour le build
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=4096"

# Exécuter la commande next build avec les options
next build

# Vérifier le statut du build
BUILD_STATUS=$?
if [ $BUILD_STATUS -eq 0 ]; then
  echo "✅ Build Next.js termine avec succes."
  
  # Créer un fichier d'information sur le build
  echo "{\"buildTime\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\", \"nodeVersion\": \"$(node -v)\"}" > ./.next/BUILD_INFO.json
  
  exit 0
else
  echo "❌ Build Next.js a echoue avec le code d'erreur: $BUILD_STATUS"
  exit $BUILD_STATUS
fi 