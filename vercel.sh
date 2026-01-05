#!/bin/bash

# Bannière d'introduction
echo "🚀 Démarrage du build pour Vercel..."

# Variables d'environnement pour le build
export NEXT_TELEMETRY_DISABLED=1
export NODE_ENV=production
export NEXT_DISABLE_HMR=1

# Vérifier si nous sommes dans l'environnement Vercel
IS_VERCEL=${VERCEL:-false}
echo "📌 Environnement Vercel: $IS_VERCEL"

# Récupération du dossier parent du script actuel
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
echo "📂 Dossier du script: $SCRIPT_DIR"

# Nettoyer les builds précédents
echo "🧹 Nettoyage des builds précédents..."
rm -rf "$SCRIPT_DIR/.next"

# Validation des variables d'environnement critiques
echo "🔐 Validation des variables Supabase..."
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "✅ Variables Supabase configurées"
else
  echo "⚠️ Variables Supabase manquantes. Le déploiement pourrait échouer."
fi

# Lancer la construction
echo "🏗️ Démarrage du build Next.js..."
npx next build

# Capturer le code de retour de la commande next build
BUILD_STATUS=$?

# Vérifier si le build a réussi
if [ $BUILD_STATUS -eq 0 ] && [ -f "$SCRIPT_DIR/.next/routes-manifest.json" ]; then
  echo "✅ Build Next.js réussi!"
  echo "🎉 Build terminé avec succès!"
  exit 0
else
  echo "❌ Build Next.js échoué. Code de retour: $BUILD_STATUS"
  echo "❌ Vérifiez les erreurs et les dépendances manquantes."
  exit 1
fi 
