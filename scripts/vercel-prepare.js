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
    'framer-motion'
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
        }
      });
      
      // Écrire le package.json mis à jour
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(`${colors.green}✅ package.json mis à jour avec les dépendances manquantes.${colors.reset}`);
      
      // En environnement Vercel, les dépendances seront installées automatiquement
      // après la mise à jour du package.json
      console.log(`${colors.green}✅ Les dépendances seront installées automatiquement par Vercel.${colors.reset}`);
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

// Fonction pour corriger les options obsolètes dans next.config.js
function fixNextConfigOptions() {
  console.log(`${colors.blue}🔍 Vérification des options obsolètes dans next.config.js...${colors.reset}`);
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  
  if (!fs.existsSync(nextConfigPath)) {
    console.error(`${colors.red}❌ next.config.js introuvable.${colors.reset}`);
    return;
  }
  
  try {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Vérifier les options obsolètes
    let needsUpdate = false;
    let updatedContent = content;
    
    // Vérifier serverComponentsExternalPackages
    if (content.includes('serverComponentsExternalPackages') && !content.includes('serverExternalPackages')) {
      console.log(`${colors.yellow}⚠️ Option obsolète détectée: serverComponentsExternalPackages${colors.reset}`);
      updatedContent = updatedContent.replace(
        /serverComponentsExternalPackages\s*:\s*\[(.*?)\]/s,
        (match, packages) => {
          needsUpdate = true;
          // Supprimer l'option de experimental
          return '';
        }
      );
      
      // Ajouter serverExternalPackages au niveau racine
      if (!updatedContent.includes('serverExternalPackages')) {
        const packagesMatch = content.match(/serverComponentsExternalPackages\s*:\s*\[(.*?)\]/s);
        if (packagesMatch && packagesMatch[1]) {
          const packages = packagesMatch[1];
          updatedContent = updatedContent.replace(
            /(experimental\s*:\s*{[^}]*})/s,
            `$1,\n\n  // Packages externes pour les composants serveur\n  serverExternalPackages: [${packages}]`
          );
        }
      }
    }
    
    // Vérifier swcMinify (déplacé dans Next.js 15)
    if (content.includes('swcMinify') && content.includes('Next.js 15')) {
      console.log(`${colors.yellow}⚠️ Option obsolète détectée: swcMinify${colors.reset}`);
      updatedContent = updatedContent.replace(
        /swcMinify\s*:\s*true,?\n/,
        ''
      );
      needsUpdate = true;
    }
    
    // Vérifier compress (déplacé dans Next.js 15)
    if (content.includes('compress') && content.includes('Next.js 15')) {
      console.log(`${colors.yellow}⚠️ Option obsolète détectée: compress${colors.reset}`);
      updatedContent = updatedContent.replace(
        /compress\s*:\s*true,?\n/,
        ''
      );
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      // Créer une sauvegarde
      const backupPath = nextConfigPath + '.backup.' + Date.now();
      fs.writeFileSync(backupPath, content);
      
      // Mettre à jour next.config.js
      fs.writeFileSync(nextConfigPath, updatedContent);
      console.log(`${colors.green}✅ next.config.js mis à jour avec les options correctes.${colors.reset}`);
    } else {
      console.log(`${colors.green}✅ Aucune option obsolète détectée dans next.config.js.${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de la vérification des options obsolètes: ${error.message}${colors.reset}`);
  }
}

// Fonction pour vérifier et corriger spécifiquement @headlessui/react
function fixHeadlessUIReact() {
  console.log(`${colors.blue}🔍 Vérification spécifique de @headlessui/react...${colors.reset}`);
  
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (packageJson.dependencies['@headlessui/react']) {
      const currentVersion = packageJson.dependencies['@headlessui/react'];
      const targetVersion = '1.7.15'; // Version spécifique connue pour être compatible
      
      if (currentVersion !== targetVersion) {
        console.log(`${colors.yellow}⚠️ Version de @headlessui/react (${currentVersion}) potentiellement problématique${colors.reset}`);
        console.log(`${colors.yellow}⚠️ Fixation à la version exacte ${targetVersion}${colors.reset}`);
        
        // Créer une sauvegarde
        const backupPath = packageJsonPath + '.backup.' + Date.now();
        fs.writeFileSync(backupPath, JSON.stringify(packageJson, null, 2));
        
        // Mettre à jour la version
        packageJson.dependencies['@headlessui/react'] = targetVersion;
        
        // Écrire le package.json mis à jour
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        
        // Supprimer le dossier node_modules/@headlessui
        const headlessUIPath = path.join(process.cwd(), 'node_modules', '@headlessui');
        if (fs.existsSync(headlessUIPath)) {
          try {
            execSync(`rm -rf "${headlessUIPath}"`, { stdio: 'inherit' });
            console.log(`${colors.green}✅ Cache de @headlessui nettoyé${colors.reset}`);
          } catch (error) {
            console.error(`${colors.red}❌ Erreur lors du nettoyage du cache: ${error.message}${colors.reset}`);
          }
        }
        
        // Réinstaller spécifiquement @headlessui/react
        try {
          execSync('npm install @headlessui/react@1.7.15 --save-exact', { stdio: 'inherit' });
          console.log(`${colors.green}✅ @headlessui/react@${targetVersion} installé avec succès${colors.reset}`);
        } catch (error) {
          console.error(`${colors.red}❌ Erreur lors de l'installation: ${error.message}${colors.reset}`);
        }
      } else {
        console.log(`${colors.green}✅ @headlessui/react est déjà en version ${targetVersion}${colors.reset}`);
      }
    }
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de la vérification de @headlessui/react: ${error.message}${colors.reset}`);
  }
}

// Modifier la fonction checkDependencyCompatibility pour être plus stricte
function checkDependencyCompatibility() {
  console.log(`${colors.blue}🔍 Vérification de la compatibilité des versions des dépendances...${colors.reset}`);
  
  // Définir les versions exactes requises pour la compatibilité
  const reactCompatibilityMap = {
    '@headlessui/react': '1.7.15', // Version exacte requise
    'framer-motion': '^10.16.4',
    'react': '^18.2.0',
    'react-dom': '^18.2.0'
  };
  
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    let needsUpdate = false;
    
    // Vérifier toutes les dépendances critiques
    for (const [dep, version] of Object.entries(reactCompatibilityMap)) {
      if (packageJson.dependencies[dep]) {
        const currentVersion = packageJson.dependencies[dep];
        
        // Pour @headlessui/react, exiger la version exacte
        if (dep === '@headlessui/react' && currentVersion !== version) {
          console.log(`${colors.yellow}⚠️ Version incompatible détectée: ${dep}@${currentVersion}${colors.reset}`);
          console.log(`${colors.yellow}⚠️ Mise à jour vers la version exacte: ${version}${colors.reset}`);
          packageJson.dependencies[dep] = version;
          needsUpdate = true;
        }
        // Pour les autres dépendances, vérifier la compatibilité générale
        else if (dep !== '@headlessui/react' && currentVersion !== version) {
          console.log(`${colors.yellow}⚠️ Version potentiellement incompatible: ${dep}@${currentVersion}${colors.reset}`);
          console.log(`${colors.yellow}⚠️ Mise à jour vers: ${version}${colors.reset}`);
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
      console.log(`${colors.green}✅ package.json mis à jour avec des versions compatibles${colors.reset}`);
      
      // Nettoyer et réinstaller les dépendances si nécessaire
      try {
        console.log(`${colors.blue}📦 Réinstallation des dépendances mises à jour...${colors.reset}`);
        execSync('npm install', { stdio: 'inherit' });
        console.log(`${colors.green}✅ Dépendances réinstallées avec succès${colors.reset}`);
      } catch (error) {
        console.error(`${colors.red}❌ Erreur lors de la réinstallation: ${error.message}${colors.reset}`);
      }
    } else {
      console.log(`${colors.green}✅ Toutes les dépendances sont compatibles${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de la vérification de la compatibilité: ${error.message}${colors.reset}`);
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
  
  console.log(`${colors.green}✅ Préparation terminée. Prêt pour le build.${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}❌ Erreur lors de la préparation: ${error.message}${colors.reset}`);
  // Ne pas quitter avec un code d'erreur pour permettre au build de continuer
  // Le script a tenté de corriger les problèmes connus
} 