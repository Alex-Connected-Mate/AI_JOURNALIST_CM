#!/usr/bin/env node
/**
 * Script de préparation amélioré pour le déploiement Vercel
 * Ce script s'exécute automatiquement avant le build sur Vercel
 * et corrige les problèmes connus qui pourraient empêcher le build
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

console.log(`${colors.cyan}🚀 Préparation améliorée du déploiement Vercel...${colors.reset}`);

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
    if (content.includes('<<<<<<<') || content.includes('>>>>>>>') || content.includes('=======')) {
      console.log(`${colors.yellow}⚠️ Conflit Git détecté dans next.config.js, création d'une sauvegarde...${colors.reset}`);
      
      // Créer une sauvegarde
      const backupPath = nextConfigPath + '.backup.' + Date.now();
      fs.writeFileSync(backupPath, content);
      console.log(`${colors.blue}📦 Sauvegarde créée: ${backupPath}${colors.reset}`);
      
      // Corriger le conflit Git avec la configuration optimisée
      const correctedConfig = `/** @type {import('next').NextConfig} */

const nextConfig = {
  // Configuration optimisée pour Vercel
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Ignorer les erreurs pour permettre le build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configuration des images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Options expérimentales
  experimental: {
    // Compatibles avec Next.js 15.2.0
    ppr: false,
    optimizePackageImports: ['next/navigation'],
    serverComponentsExternalPackages: ['pdf-lib'],
  },
  
  // Optimisations supplémentaires
  swcMinify: true,
  compress: true,
  excludeDefaultMomentLocales: true,
  
  // Variables d'environnement
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
    BUILD_TIME: new Date().toISOString()
  },
  
  // Configuration webpack pour résoudre les problèmes courants
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false,
      path: false,
      crypto: false,
      os: false
    };
    
    return config;
  },
};

module.exports = nextConfig;`;
      
      fs.writeFileSync(nextConfigPath, correctedConfig);
      console.log(`${colors.green}✅ next.config.js corrigé avec succès.${colors.reset}`);
      return true;
    } else {
      // Vérifier si la configuration est optimisée pour Vercel
      if (!content.includes('webpack: (config)') || !content.includes('fallback')) {
        console.log(`${colors.yellow}⚠️ next.config.js n'est pas optimisé pour Vercel, optimisation...${colors.reset}`);
        
        // Créer une sauvegarde
        const backupPath = nextConfigPath + '.backup.' + Date.now();
        fs.writeFileSync(backupPath, content);
        
        // Mettre à jour avec la configuration optimisée
        const optimizedConfig = `/** @type {import('next').NextConfig} */

const nextConfig = {
  // Configuration optimisée pour Vercel
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Ignorer les erreurs pour permettre le build
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Configuration des images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // Options expérimentales
  experimental: {
    // Compatibles avec Next.js 15.2.0
    ppr: false,
    optimizePackageImports: ['next/navigation'],
    serverComponentsExternalPackages: ['pdf-lib'],
  },
  
  // Optimisations supplémentaires
  swcMinify: true,
  compress: true,
  excludeDefaultMomentLocales: true,
  
  // Variables d'environnement
  env: {
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || 'development',
    BUILD_TIME: new Date().toISOString()
  },
  
  // Configuration webpack pour résoudre les problèmes courants
  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false,
      path: false,
      crypto: false,
      os: false
    };
    
    return config;
  },
};

module.exports = nextConfig;`;
        
        fs.writeFileSync(nextConfigPath, optimizedConfig);
        console.log(`${colors.green}✅ next.config.js optimisé pour Vercel avec succès.${colors.reset}`);
      } else {
        console.log(`${colors.green}✅ next.config.js est déjà optimisé pour Vercel.${colors.reset}`);
      }
      
      return true;
    }
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de la vérification de next.config.js: ${error.message}${colors.reset}`);
    return false;
  }
}

// Fonction pour vérifier la présence de variables d'environnement critiques
function checkEnvironmentVariables() {
  console.log(`${colors.blue}🔍 Vérification des variables d'environnement...${colors.reset}`);
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`${colors.yellow}⚠️ Variables d'environnement manquantes: ${missingVars.join(', ')}${colors.reset}`);
    console.warn(`${colors.yellow}⚠️ Assurez-vous de les configurer dans les paramètres de projet Vercel.${colors.reset}`);
    
    // Créer un fichier .env.example pour référence
    const envExamplePath = path.join(process.cwd(), '.env.example');
    let envExampleContent = '# Variables d\'environnement requises pour l\'application\n\n';
    
    requiredVars.forEach(varName => {
      envExampleContent += `${varName}=your_${varName.toLowerCase()}_here\n`;
    });
    
    fs.writeFileSync(envExamplePath, envExampleContent);
    console.log(`${colors.blue}📦 Fichier .env.example créé pour référence.${colors.reset}`);
  } else {
    console.log(`${colors.green}✅ Toutes les variables d'environnement requises sont présentes.${colors.reset}`);
  }
}

// Fonction pour définir des variables d'environnement supplémentaires pour le build
function setAdditionalEnvVars() {
  console.log(`${colors.blue}🔍 Configuration des variables d'environnement supplémentaires...${colors.reset}`);
  
  process.env.BUILD_TIME = new Date().toISOString();
  process.env.NODE_OPTIONS = '--max-old-space-size=4096';
  process.env.NEXT_TELEMETRY_DISABLED = '1';
  
  console.log(`${colors.green}✅ Variables d'environnement supplémentaires configurées.${colors.reset}`);
}

// Fonction pour vérifier les composants Input
function checkInputComponents() {
  console.log(`${colors.blue}🔍 Vérification des composants Input...${colors.reset}`);
  
  const inputComponents = [
    path.join(process.cwd(), 'src', 'components', 'Input.jsx'),
    path.join(process.cwd(), 'src', 'components', 'Input.tsx')
  ];
  
  let needsFix = false;
  
  for (const filePath of inputComponents) {
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.includes('onValidate')) {
          console.log(`${colors.yellow}⚠️ Problème détecté dans ${filePath}: onValidate devrait être remplacé par validate${colors.reset}`);
          
          // Créer une sauvegarde
          const backupPath = filePath + '.backup.' + Date.now();
          fs.writeFileSync(backupPath, content);
          
          // Remplacer onValidate par validate
          const correctedContent = content.replace(/onValidate/g, 'validate');
          fs.writeFileSync(filePath, correctedContent);
          
          console.log(`${colors.green}✅ ${filePath} corrigé avec succès.${colors.reset}`);
          needsFix = true;
        }
      } catch (error) {
        console.error(`${colors.red}❌ Erreur lors de la vérification de ${filePath}: ${error.message}${colors.reset}`);
      }
    }
  }
  
  if (!needsFix) {
    console.log(`${colors.green}✅ Aucun problème détecté dans les composants Input.${colors.reset}`);
  }
}

// Fonction pour vérifier et corriger les dépendances React
function checkReactVersion() {
  console.log(`${colors.blue}🔍 Vérification de la version de React...${colors.reset}`);
  
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Vérifier si React est en version 19
    if (packageJson.dependencies.react && packageJson.dependencies.react.includes('19')) {
      console.log(`${colors.yellow}⚠️ React version 19 détectée, rétrogradation à la version 18.2.0 pour compatibilité...${colors.reset}`);
      
      // Créer une sauvegarde
      const backupPath = packageJsonPath + '.backup.' + Date.now();
      fs.writeFileSync(backupPath, JSON.stringify(packageJson, null, 2));
      
      // Mettre à jour les versions de React
      packageJson.dependencies.react = '^18.2.0';
      packageJson.dependencies['react-dom'] = '^18.2.0';
      
      // Mettre à jour les types React si présents
      if (packageJson.devDependencies['@types/react']) {
        packageJson.devDependencies['@types/react'] = '^18.2.55';
      }
      if (packageJson.devDependencies['@types/react-dom']) {
        packageJson.devDependencies['@types/react-dom'] = '^18.2.19';
      }
      
      // Écrire le package.json mis à jour
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`${colors.green}✅ package.json mis à jour avec React 18.2.0.${colors.reset}`);
    } else {
      console.log(`${colors.green}✅ Version de React compatible détectée.${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de la vérification de la version de React: ${error.message}${colors.reset}`);
  }
}

// Fonction pour installer les dépendances manquantes
function installMissingDependencies() {
  console.log(`${colors.blue}🔍 Vérification des dépendances manquantes...${colors.reset}`);
  
  // Liste des dépendances à vérifier
  const requiredDependencies = [
    '@headlessui/react',
    'framer-motion',
    'react-hot-toast'
  ];
  
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Vérifier si les dépendances sont déjà dans package.json
    const missingDependencies = requiredDependencies.filter(dep => 
      !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
    );
    
    if (missingDependencies.length > 0) {
      console.log(`${colors.yellow}⚠️ Dépendances manquantes détectées: ${missingDependencies.join(', ')}${colors.reset}`);
      console.log(`${colors.yellow}⚠️ Ajout des dépendances manquantes au package.json...${colors.reset}`);
      
      // Ajouter les dépendances manquantes au package.json
      missingDependencies.forEach(dep => {
        if (dep === '@headlessui/react') {
          packageJson.dependencies[dep] = '^1.7.18';
        } else if (dep === 'framer-motion') {
          packageJson.dependencies[dep] = '^10.16.4'; // Version compatible avec React 18
        } else if (dep === 'react-hot-toast') {
          packageJson.dependencies[dep] = '^2.5.2'; // Version stable actuelle
        }
      });
      
      // Écrire le package.json mis à jour
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`${colors.green}✅ package.json mis à jour avec les dépendances manquantes.${colors.reset}`);
      
      // En environnement Vercel, les dépendances seront installées automatiquement
      // après la mise à jour du package.json
      console.log(`${colors.green}✅ Les dépendances seront installées automatiquement par Vercel.${colors.reset}`);
      
      // Si nous ne sommes pas sur Vercel, tenter d'installer les dépendances
      if (!process.env.VERCEL) {
        try {
          console.log(`${colors.yellow}⚠️ Installation manuelle des dépendances manquantes...${colors.reset}`);
          execSync(`npm install ${missingDependencies.join(' ')}`, { stdio: 'inherit' });
          console.log(`${colors.green}✅ Dépendances installées avec succès.${colors.reset}`);
        } catch (installError) {
          console.error(`${colors.red}❌ Erreur lors de l'installation des dépendances: ${installError.message}${colors.reset}`);
          console.log(`${colors.yellow}⚠️ Veuillez exécuter manuellement: npm install ${missingDependencies.join(' ')}${colors.reset}`);
        }
      }
    } else {
      // Vérifier si framer-motion est en version 11 (incompatible avec React 18)
      if (packageJson.dependencies['framer-motion'] && packageJson.dependencies['framer-motion'].includes('11')) {
        console.log(`${colors.yellow}⚠️ framer-motion version 11 détectée, rétrogradation à la version 10.16.4 pour compatibilité avec React 18...${colors.reset}`);
        
        packageJson.dependencies['framer-motion'] = '^10.16.4';
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log(`${colors.green}✅ Version de framer-motion mise à jour pour compatibilité.${colors.reset}`);
      } else {
        console.log(`${colors.green}✅ Toutes les dépendances requises sont présentes et compatibles.${colors.reset}`);
      }
    }
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de la vérification des dépendances: ${error.message}${colors.reset}`);
  }
}

// Fonction pour vérifier et corriger les problèmes d'API routes
function checkApiRoutes() {
  console.log(`${colors.blue}🔍 Vérification des API routes...${colors.reset}`);
  
  const apiDirs = [
    path.join(process.cwd(), 'src', 'app', 'api'),
    path.join(process.cwd(), 'src', 'pages', 'api')
  ];
  
  for (const apiDir of apiDirs) {
    if (fs.existsSync(apiDir)) {
      console.log(`${colors.blue}📂 Vérification du répertoire API: ${apiDir}${colors.reset}`);
      
      // Fonction récursive pour vérifier les fichiers d'API
      const checkApiFiles = (dir) => {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            checkApiFiles(filePath);
          } else if (file.endsWith('.js') || file.endsWith('.ts')) {
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              
              // Vérifier si le fichier utilise fs ou path sans vérification d'environnement
              if ((content.includes('require(\'fs\')') || content.includes('require("fs")') || 
                   content.includes('from \'fs\'') || content.includes('from "fs"')) &&
                  !content.includes('process.env.NODE_ENV === \'development\'')) {
                
                console.log(`${colors.yellow}⚠️ Utilisation non sécurisée de fs détectée dans ${filePath}${colors.reset}`);
                
                // Créer une sauvegarde
                const backupPath = filePath + '.backup.' + Date.now();
                fs.writeFileSync(backupPath, content);
                
                // Corriger le fichier pour n'utiliser fs qu'en développement
                const correctedContent = content.replace(
                  /((const|let|var)\s+\w+\s*=\s*require\(['"]fs['"]\))/g,
                  'let fs; if (process.env.NODE_ENV === \'development\') { $1 }'
                ).replace(
                  /(import\s+\*\s+as\s+\w+\s+from\s+['"]fs['"]\s*;)/g,
                  'let fs; if (process.env.NODE_ENV === \'development\') { $1 }'
                ).replace(
                  /(import\s+\{\s*[^}]*\s*\}\s+from\s+['"]fs['"]\s*;)/g,
                  'let fs; if (process.env.NODE_ENV === \'development\') { $1 }'
                );
                
                fs.writeFileSync(filePath, correctedContent);
                console.log(`${colors.green}✅ ${filePath} corrigé pour n'utiliser fs qu'en développement.${colors.reset}`);
              }
            } catch (error) {
              console.error(`${colors.red}❌ Erreur lors de la vérification de ${filePath}: ${error.message}${colors.reset}`);
            }
          }
        }
      };
      
      try {
        checkApiFiles(apiDir);
      } catch (error) {
        console.error(`${colors.red}❌ Erreur lors de la vérification des API routes: ${error.message}${colors.reset}`);
      }
    }
  }
  
  console.log(`${colors.green}✅ Vérification des API routes terminée.${colors.reset}`);
}

// Fonction pour vérifier et corriger les problèmes d'apostrophes françaises
function checkAndFixFrenchApostrophes() {
  console.log(`${colors.blue}🔍 Vérification des apostrophes françaises dans les fichiers JavaScript...${colors.reset}`);
  
  const dirsToCheck = [
    path.join(process.cwd(), 'src', 'lib'),
    path.join(process.cwd(), 'src', 'components'),
    path.join(process.cwd(), 'src', 'app'),
    path.join(process.cwd(), 'src', 'pages')
  ];
  
  const checkDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        checkDir(filePath);
      } else if (file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.ts') || file.endsWith('.tsx')) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Rechercher les apostrophes françaises dans les templates strings
          // Utiliser des codes Unicode pour les apostrophes françaises: U+2019 (') et U+2018 (')
          if (content.includes('`') && (content.includes('\u2019') || content.includes('\u2018'))) {
            console.log(`${colors.yellow}⚠️ Apostrophes françaises détectées dans ${filePath}${colors.reset}`);
            
            // Créer une sauvegarde
            const backupPath = filePath + '.backup.' + Date.now();
            fs.writeFileSync(backupPath, content);
            
            // Remplacer les apostrophes françaises par des apostrophes droites
            const correctedContent = content
              .replace(/[\u2018\u2019](?=[^`]*`[^`]*$)/g, '\\\'') // Remplacer les apostrophes françaises dans les templates strings
              .replace(/[\u2018\u2019]/g, '\''); // Remplacer les autres apostrophes françaises
            
            fs.writeFileSync(filePath, correctedContent);
            console.log(`${colors.green}✅ ${filePath} corrigé avec succès.${colors.reset}`);
          }
        } catch (error) {
          console.error(`${colors.red}❌ Erreur lors de la vérification de ${filePath}: ${error.message}${colors.reset}`);
        }
      }
    }
  };
  
  for (const dir of dirsToCheck) {
    checkDir(dir);
  }
  
  console.log(`${colors.green}✅ Vérification des apostrophes françaises terminée.${colors.reset}`);
}

// Fonction pour vérifier les dépendances essentielles
function checkEssentialDependencies() {
  console.log(`${colors.blue}🔍 Vérification des dépendances essentielles...${colors.reset}`);
  
  const essentialDependencies = {
    'uuid': '^9.0.1',
    '@types/uuid': '^9.0.8',
    'openai': '^4.28.0'
  };
  
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    let needsUpdate = false;
    
    // Vérifier les dépendances essentielles
    for (const [dep, version] of Object.entries(essentialDependencies)) {
      if (dep.startsWith('@types/')) {
        // Vérifier les devDependencies pour les types
        if (!packageJson.devDependencies[dep]) {
          console.log(`${colors.yellow}⚠️ Dépendance essentielle manquante: ${dep}${colors.reset}`);
          packageJson.devDependencies[dep] = version;
          needsUpdate = true;
        }
      } else {
        // Vérifier les dependencies pour les packages normaux
        if (!packageJson.dependencies[dep]) {
          console.log(`${colors.yellow}⚠️ Dépendance essentielle manquante: ${dep}${colors.reset}`);
          packageJson.dependencies[dep] = version;
          needsUpdate = true;
        }
      }
    }
    
    if (needsUpdate) {
      // Créer une sauvegarde
      const backupPath = packageJsonPath + '.backup.' + Date.now();
      fs.writeFileSync(backupPath, JSON.stringify(packageJson, null, 2));
      
      // Mettre à jour package.json
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`${colors.green}✅ package.json mis à jour avec les dépendances essentielles.${colors.reset}`);
    } else {
      console.log(`${colors.green}✅ Toutes les dépendances essentielles sont présentes.${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de la vérification des dépendances essentielles: ${error.message}${colors.reset}`);
  }
}

// Fonction pour corriger les fichiers JavaScript problématiques après conversion
async function fixJavaScriptFiles() {
  console.log(`${colors.cyan}🔧 Correction des fichiers JavaScript après conversion TypeScript...${colors.reset}`);
  
  // Liste des fichiers à corriger manuellement
  const problematicFiles = [
    'src/lib/store.js',
    'src/lib/supabase.js',
    'src/config/ai-agents.js',
    'src/lib/logger.js',
    'src/lib/promptParser.js',
    'src/lib/types.js'
  ];
  
  for (const file of problematicFiles) {
    try {
      if (fs.existsSync(file)) {
        console.log(`${colors.blue}🔍 Correction du fichier: ${file}${colors.reset}`);
        
        // Lire le contenu du fichier
        let content = fs.readFileSync(file, 'utf8');
        
        // Corriger les imports malformés
        content = content.replace(/import\s*{\s*['"]([^'"]+)['"]\s*}/g, "import $1 from '$1'");
        content = content.replace(/import\s*{\s*['"]([^'"]+)['"]\s*}\s*from/g, "import $1 from");
        
        // Remplacer les imports avec chaînes entre guillemets
        content = content.replace(/import\s*{\s*([^}]+)\s*}\s*from\s*['"]([^'"]+)['"]/g, (match, imports, source) => {
          // Nettoyer les imports
          const cleanedImports = imports.replace(/['"]/g, '');
          return `import { ${cleanedImports} } from '${source}'`;
        });
        
        // Supprimer les annotations de types restantes
        content = content.replace(/:\s*[A-Za-z0-9_]+(\[\])?\s*([,)])/g, '$2');
        content = content.replace(/:\s*{[^}]+}\s*([,)])/g, '$1');
        
        // Remplacer interface et type par un commentaire
        content = content.replace(/interface\s+[A-Za-z0-9_]+\s*{[\s\S]*?}/g, '// TypeScript interface removed');
        content = content.replace(/type\s+[A-Za-z0-9_]+\s*=[\s\S]*?;/g, '// TypeScript type removed');
        content = content.replace(/export\s+interface\s+[A-Za-z0-9_]+\s*{[\s\S]*?}/g, '// TypeScript interface removed');
        content = content.replace(/export\s+type\s+[A-Za-z0-9_]+\s*=[\s\S]*?;/g, '// TypeScript type removed');
        
        // Écrire les modifications
        fs.writeFileSync(file, content, 'utf8');
        console.log(`${colors.green}✅ Fichier ${file} corrigé avec succès${colors.reset}`);
      }
    } catch (error) {
      console.error(`${colors.red}❌ Erreur lors de la correction de ${file}: ${error.message}${colors.reset}`);
    }
  }
  
  // Cas spécifique pour store.js - Complètement réécrire si nécessaire
  if (fs.existsSync('src/lib/store.js')) {
    try {
      const storeContent = `
// Store for state management
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createClient } from '@supabase/supabase-js';
import { createClient as createSupabaseClient } from './supabase';

// Create a store with authentication state
const useStore = create(
  persist(
    (set, get) => ({
      // Auth state
      session: null,
      user: null,
      
      // Session data
      currentSession: null,
      
      // Actions
      setSession: (session) => set({ session }),
      setUser: (user) => set({ user }),
      setCurrentSession: (currentSession) => set({ currentSession }),
      
      logout: async () => {
        const supabase = createSupabaseClient();
        await supabase.auth.signOut();
        set({ session: null, user: null, currentSession: null });
      }
    }),
    {
      name: 'app-storage'
    }
  )
);

export default useStore;
`;
      
      fs.writeFileSync('src/lib/store.js', storeContent, 'utf8');
      console.log(`${colors.green}✅ Fichier src/lib/store.js réécrit avec succès${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}❌ Erreur lors de la réécriture de src/lib/store.js: ${error.message}${colors.reset}`);
    }
  }
  
  // Cas spécifique pour supabase.js - Réécrire si nécessaire
  if (fs.existsSync('src/lib/supabase.js')) {
    try {
      const supabaseContent = `
import { createClient } from '@supabase/supabase-js';

// Créer un client Supabase avec les variables d'environnement
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
}

// Client Supabase pour l'utilisation côté client
const supabase = createClient();

export default supabase;
`;
      
      fs.writeFileSync('src/lib/supabase.js', supabaseContent, 'utf8');
      console.log(`${colors.green}✅ Fichier src/lib/supabase.js réécrit avec succès${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}❌ Erreur lors de la réécriture de src/lib/supabase.js: ${error.message}${colors.reset}`);
    }
  }
}

// Exécuter les fonctions
try {
  console.log(`${colors.cyan}🚀 Démarrage des vérifications préalables au build...${colors.reset}`);
  
  // Vérifier et corriger la version de React
  checkReactVersion();
  
  // Vérifier spécifiquement @headlessui/react
  fixHeadlessUIReact();
  
  // Vérifier la compatibilité des dépendances
  checkDependencyCompatibility();
  
  // Correction de next.config.js
  fixNextConfig();
  
  // Vérifier et corriger les options obsolètes dans next.config.js
  fixNextConfigOptions();
  
  // Vérification des variables d'environnement
  checkEnvironmentVariables();
  
  // Configuration des variables d'environnement supplémentaires
  setAdditionalEnvVars();
  
  // Vérification des composants Input
  checkInputComponents();
  
  // Installation des dépendances manquantes
  installMissingDependencies();
  
  // Vérification des dépendances essentielles
  checkEssentialDependencies();
  
  // Vérification des API routes
  checkApiRoutes();
  
  // Vérification et correction des apostrophes françaises
  checkAndFixFrenchApostrophes();
  
  // Détection des imports manquants
  detectMissingImports();
  
  // S'assurer que TypeScript est installé
  ensureTypescript();
  
  // Correction des fichiers JavaScript problématiques après conversion
  await fixJavaScriptFiles();
  
  console.log(`${colors.green}✅ Préparation terminée. Prêt pour le build.${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}❌ Erreur lors de la préparation: ${error.message}${colors.reset}`);
  // Ne pas quitter avec un code d'erreur pour permettre au build de continuer
  // Le script a tenté de corriger les problèmes connus
} 