#!/usr/bin/env node
/**
 * Script de préparation simplifié pour le déploiement Vercel
 * Ce script corrige les problèmes syntaxiques qui causaient des erreurs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}🚀 Préparation simplifiée du déploiement Vercel...${colors.reset}`);

// Fonction pour vérifier et corriger next.config.js
function fixNextConfig() {
  console.log(`${colors.blue}🔍 Vérification de next.config.js...${colors.reset}`);
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  
  if (!fs.existsSync(nextConfigPath)) {
    console.error(`${colors.red}❌ next.config.js introuvable.${colors.reset}`);
    return false;
  }
  
  try {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Vérifier s'il y a des marqueurs de conflit Git
    if (content.includes('<<<<<<<') || content.includes('=======') || content.includes('>>>>>>>')) {
      console.log(`${colors.yellow}⚠️ Conflit Git détecté dans next.config.js, création d'une sauvegarde...${colors.reset}`);
      
      // Créer une sauvegarde
      const backupPath = nextConfigPath + '.backup.' + Date.now();
      fs.writeFileSync(backupPath, content);
      console.log(`${colors.blue}📦 Sauvegarde créée: ${backupPath}${colors.reset}`);
      
      // Corriger le conflit Git avec la configuration optimisée
      const correctedConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@tremor/react']
  },
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com']
  }
};

module.exports = nextConfig;`;
      
      fs.writeFileSync(nextConfigPath, correctedConfig);
      console.log(`${colors.green}✅ next.config.js corrigé avec succès.${colors.reset}`);
      return true;
    } 
    
    // Vérifier si la configuration est optimisée pour Vercel
    if (!content.includes('serverComponentsExternalPackages') && !content.includes('images')) {
      console.log(`${colors.yellow}⚠️ next.config.js n'est pas optimisé pour Vercel, optimisation...${colors.reset}`);
      
      // Créer une sauvegarde
      const backupPath = nextConfigPath + '.backup.' + Date.now();
      fs.writeFileSync(backupPath, content);
      
      // Mettre à jour avec la configuration optimisée
      const optimizedConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@tremor/react']
  },
  images: {
    domains: ['avatars.githubusercontent.com', 'lh3.googleusercontent.com']
  }
};

module.exports = nextConfig;`;
      
      fs.writeFileSync(nextConfigPath, optimizedConfig);
      console.log(`${colors.green}✅ next.config.js optimisé pour Vercel avec succès.${colors.reset}`);
    } else {
      console.log(`${colors.green}✅ next.config.js est déjà optimisé pour Vercel.${colors.reset}`);
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de la vérification de next.config.js: ${error.message}${colors.reset}`);
    return false;
  }
}

// Fonction pour vérifier les conflits Git dans tous les fichiers
function checkGitConflicts() {
  console.log(`${colors.blue}🔍 Vérification des conflits Git...${colors.reset}`);
  
  try {
    const output = execSync('grep -l -r "<<<<<<<\\|=======\\|>>>>>>>" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" --include="*.json" .', { encoding: 'utf8' });
    
    if (output.trim()) {
      const files = output.trim().split('\n');
      console.log(`${colors.yellow}⚠️ Conflits Git détectés dans ${files.length} fichiers.${colors.reset}`);
      
      for (const file of files) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          const backupPath = file + '.conflict-backup-' + Date.now();
          
          // Créer une sauvegarde
          fs.writeFileSync(backupPath, content);
          console.log(`${colors.blue}📄 Sauvegarde créée: ${backupPath}${colors.reset}`);
          
          // Résoudre les conflits en prenant la version "incoming" (après le marqueur =======)
          let resolved = content;
          
          // Remplacer les blocs de conflit par la version "incoming"
          const conflictPattern = /<<<<<<< HEAD([\s\S]*?)=======([\s\S]*?)>>>>>>>/g;
          resolved = resolved.replace(conflictPattern, '$2');
          
          fs.writeFileSync(file, resolved);
          
          const conflictCount = (content.match(conflictPattern) || []).length;
          console.log(`${colors.green}✅ Résolution de ${conflictCount} conflits dans: ${file}${colors.reset}`);
        }
      }
    } else {
      console.log(`${colors.green}✅ Aucun conflit Git détecté.${colors.reset}`);
    }
    
    return true;
  } catch (error) {
    console.log(`${colors.green}✅ Aucun conflit Git détecté.${colors.reset}`);
    return true;
  }
}

// Fonction principale
function main() {
  console.log(`${colors.cyan}🚀 Démarrage des vérifications préalables au build...${colors.reset}`);
  
  // Résoudre les conflits Git
  checkGitConflicts();
  
  // Vérifier et corriger next.config.js
  const nextConfigFixed = fixNextConfig();
  
  if (nextConfigFixed) {
    console.log(`${colors.green}✅ Préparation terminée. Prêt pour le build.${colors.reset}`);
    return 0;
  } else {
    console.error(`${colors.red}❌ Échec de la préparation. Des erreurs ont été rencontrées.${colors.reset}`);
    return 1;
  }
}

// Exécuter le script
main(); 
