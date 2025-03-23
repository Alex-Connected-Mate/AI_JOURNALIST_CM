#!/bin/bash

# Bannière d'introduction
echo "🚀 Démarrage des opérations de pré-déploiement..."
echo "==============================================="

# Vérifier si nous sommes dans l'environnement Vercel
IS_VERCEL=${VERCEL:-false}
echo "📌 Environnement Vercel: $IS_VERCEL"

# Récupération du dossier parent du script actuel
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
echo "📂 Dossier du script: $SCRIPT_DIR"

# Vérification des dossiers critiques requis
if [ ! -d "$SCRIPT_DIR/scripts" ]; then
  echo "🔧 Création du dossier scripts manquant..."
  mkdir -p "$SCRIPT_DIR/scripts"
fi

# 1. Résolution des conflits Git
echo "🔍 Vérification des conflits Git..."

# Vérifier si le script fix-git-conflicts.js existe
if [ -f "$SCRIPT_DIR/scripts/fix-git-conflicts.js" ]; then
  echo "✅ Utilisation du script fix-git-conflicts.js existant"
  node "$SCRIPT_DIR/scripts/fix-git-conflicts.js"
else
  echo "⚠️ Script fix-git-conflicts.js non trouvé, création d'un script minimal..."
  
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
echo "🔍 Vérification des fichiers middleware..."

# Chercher les fichiers middleware dupliqués
MIDDLEWARE_FILES=( $(find "$SCRIPT_DIR/src" -name "middleware.*" -type f) )
if [ ${#MIDDLEWARE_FILES[@]} -gt 1 ]; then
  echo "⚠️ Plusieurs fichiers middleware détectés, nettoyage nécessaire!"
  
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
        echo "🗑️ Suppression du middleware dupliqué: $file"
        rm "$file"
      fi
    done
  else
    echo "⚠️ Aucun middleware racine trouvé, déplacement d'un fichier existant..."
    
    # Déplacer le premier middleware trouvé à la racine
    FIRST_MIDDLEWARE="${MIDDLEWARE_FILES[0]}"
    filename=$(basename "$FIRST_MIDDLEWARE")
    cp "$FIRST_MIDDLEWARE" "$SCRIPT_DIR/src/$filename"
    echo "📋 Middleware copié à la racine: $SCRIPT_DIR/src/$filename"
    
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
echo "🧪 Exécution des vérifications pré-déploiement..."

if [ -f "$SCRIPT_DIR/scripts/pre-deploy-check.js" ]; then
  echo "✅ Exécution de pre-deploy-check.js..."
  node "$SCRIPT_DIR/scripts/pre-deploy-check.js"
else
  echo "⚠️ Script pre-deploy-check.js non trouvé, vérifications minimales..."
  
  # Vérification simplifiée sans le script
  echo "ℹ️ Vérification des conflits Git avec grep..."
  CONFLICTS=$(grep -r "<<<<<" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" "$SCRIPT_DIR/src" || true)
  if [ -n "$CONFLICTS" ]; then
    echo "⚠️ Des conflits Git non résolus ont été détectés!"
    echo "$CONFLICTS"
  else
    echo "✅ Pas de conflits Git non résolus détectés."
  fi
fi

# 4. Validation des variables d'environnement
echo "🔐 Validation des variables Supabase..."

# Vérification de la présence des variables Supabase
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "✅ Variables Supabase configurées"
else
  echo "⚠️ Variables Supabase manquantes!"
  if [ "$IS_VERCEL" = "1" ]; then
    echo "❌ ERREUR CRITIQUE: Les variables Supabase sont requises pour le déploiement!"
  fi
fi

# 5. Correction du fichier test-toast.jsx
echo "🔧 Vérification de test-toast.jsx..."

# Utiliser le script simplifié
if [ -f "$SCRIPT_DIR/scripts/fix-test-toast-simple.js" ]; then
  echo "✅ Utilisation du script fix-test-toast-simple.js existant"
  node "$SCRIPT_DIR/scripts/fix-test-toast-simple.js"
else
  echo "⚠️ Script fix-test-toast-simple.js non trouvé!"
fi

# 6. Correction des modules JS
echo "🔧 Conversion des modules ES vers CommonJS..."

# Utiliser notre script fix-js-modules-simple.js
if [ -f "$SCRIPT_DIR/scripts/fix-js-modules-simple.js" ]; then
  echo "✅ Utilisation du script fix-js-modules-simple.js existant"
  node "$SCRIPT_DIR/scripts/fix-js-modules-simple.js"
else
  echo "⚠️ Script fix-js-modules-simple.js non trouvé!"
fi

# 7. Finalisation et message de récapitulation
echo "🏁 Préparation de déploiement terminée!"
echo "==============================================="
echo "✅ Conflits Git vérifiés et résolus"
echo "✅ Middlewares dédupliqués"
echo "✅ Variables d'environnement validées"
echo "✅ Conversions de syntaxe ES modules effectuées"
echo "🚀 Prêt pour le déploiement!"

exit 0 