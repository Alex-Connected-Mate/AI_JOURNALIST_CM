#!/usr/bin/env node
/**
 * Script de vérification avant déploiement
 * Exécuté automatiquement avant le build sur Vercel
 * pour s'assurer que la configuration est correcte
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}🔍 Exécution des vérifications pré-déploiement...${colors.reset}`);

// Fonction principale pour exécuter les différentes vérifications
async function main() {
  console.log('🚀 Démarrage des vérifications pré-déploiement...');
  
  let hasErrors = false;
  let warnings = 0;
  
  // Vérifier les conflits Git
  const gitConflictsResult = await checkGitConflicts();
  if (!gitConflictsResult) {
    hasErrors = true;
  }

  // Vérifier les variables d'environnement
  if (!checkEnvVariables()) {
    hasErrors = true;
  }
  
  // Vérifier les middlewares dupliqués
  if (!checkDuplicateMiddleware()) {
    hasErrors = true;
  }
  
  // Vérifier la config Next.js
  if (!checkNextConfig()) {
    warnings++;
  }
  
  // Vérifier la configuration Supabase
  checkSupabaseFiles();
  
  // Afficher le résultat final
  if (hasErrors) {
    console.log('\x1b[31m❌ Des erreurs ont été détectées lors des vérifications pré-déploiement.\x1b[0m');
    process.exit(1);
  } else if (warnings > 0) {
    console.log(`\x1b[33m⚠️ Vérifications pré-déploiement terminées avec ${warnings} avertissement(s).\x1b[0m`);
    process.exit(0);
  } else {
    console.log('\x1b[32m✅ Toutes les vérifications pré-déploiement sont passées avec succès.\x1b[0m');
    process.exit(0);
  }
}

// Exécuter la fonction principale
main().catch(error => {
  console.error(`\x1b[31m❌ Erreur lors des vérifications pré-déploiement: ${error.message}\x1b[0m`);
  process.exit(1);
});

// Vérifier les variables d'environnement requises
function checkEnvironmentVariables() {
  console.log(`${colors.blue}🔍 Vérification des variables d'environnement...${colors.reset}`);
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.warn(`${colors.yellow}⚠️ Variable d'environnement manquante: ${varName}${colors.reset}`);
      warnings++;
    } else {
      console.log(`${colors.green}✅ Variable présente: ${varName}${colors.reset}`);
    }
  }
}

// Vérifier s'il y a des fichiers middleware en double
function checkMiddlewareFiles() {
  console.log(`${colors.blue}🔍 Vérification des fichiers middleware...${colors.reset}`);
  
  const middlewareFiles = [
    path.join(process.cwd(), 'middleware.js'),
    path.join(process.cwd(), 'middleware.ts'),
    path.join(process.cwd(), 'src', 'middleware.js'),
    path.join(process.cwd(), 'src', 'middleware.ts')
  ];
  
  const existingFiles = middlewareFiles.filter(file => fs.existsSync(file));
  
  if (existingFiles.length > 1) {
    console.error(`${colors.red}❌ Plusieurs fichiers middleware détectés:${colors.reset}`);
    existingFiles.forEach(file => console.log(`  - ${file}`));
    console.error(`${colors.red}   Cela peut causer des conflits de routage. Gardez uniquement un fichier middleware.${colors.reset}`);
    hasErrors = true;
  } else if (existingFiles.length === 0) {
    console.warn(`${colors.yellow}⚠️ Aucun fichier middleware trouvé. L'authentification peut ne pas fonctionner correctement.${colors.reset}`);
    warnings++;
  } else {
    console.log(`${colors.green}✅ Un seul fichier middleware trouvé: ${existingFiles[0]}${colors.reset}`);
  }
}

// Vérifier la configuration Next.js
function checkNextConfig() {
  console.log(`${colors.blue}🔍 Vérification de next.config.js...${colors.reset}`);
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  
  if (!fs.existsSync(nextConfigPath)) {
    console.error(`${colors.red}❌ Fichier next.config.js introuvable.${colors.reset}`);
    hasErrors = true;
    return false;
  }
  
  const content = fs.readFileSync(nextConfigPath, 'utf8');
  
  // Vérifier s'il y a des marqueurs de conflit Git
    console.error(`${colors.red}❌ Marqueurs de conflit Git détectés dans next.config.js${colors.reset}`);
    hasErrors = true;
    return false;
  } else {
    console.log(`${colors.green}✅ Pas de conflit Git dans next.config.js${colors.reset}`);
    return true;
  }
}

/**
 * Vérifie la présence de marqueurs de conflit Git dans les fichiers
 */
async function checkGitConflicts() {
  try {
    console.log('🔍 Checking for Git conflict markers...');
    
    const excludeList = [
      './scripts/pre-deploy-check.js',
      './scripts/start.js',
      './scripts/vercel-prepare.js',
      './scripts/fix-js-modules.js',
      './scripts/validate-fixes.js',
      './scripts/fix-next-config.js',
      './node_modules',
      './.next',
      './.git',
      './.vercel',
      './dist',
      './out',
      './.turbo',
    ];
    
    // Construire la commande pour rechercher les marqueurs de conflit
    // en excluant les fichiers spécifiques et les fichiers de sauvegarde
    const cmd = `find . -type f \\( -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.vue" -o -name "*.scss" -o -name "*.css" \\) \\
      ${excludeList.map(path => `-not -path "${path}*"`).join(' ')} \\
      -not -path "*/node_modules/*" \\
      -not -path "*/.next/*" \\
      -not -path "*/.git/*" \\
      -not -name "*.backup*" \\
      -not -name "*.bak" \\
      -not -name "*.backup.*" \\
      -not -name "*.tmp" \\
