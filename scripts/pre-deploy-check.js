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
  if (content.includes('<<<<<<<') || content.includes('>>>>>>>') || content.includes('=======')) {
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
      -exec grep -l "<<<<<<< HEAD\\|=======\\|>>>>>>> " {} \\;`;
      
    const { stdout } = await exec(cmd);
    
    if (stdout.trim()) {
      const conflictFiles = stdout.trim().split('\n');
      console.log('\x1b[31m❌ Marqueurs de conflit Git détectés:\x1b[0m');
      conflictFiles.forEach(file => console.log(`- ${file}`));
      return false;
    }
    
    console.log('✅ Aucun marqueur de conflit Git détecté');
    return true;
  } catch (error) {
    console.error('⚠️ Erreur lors de la vérification des conflits Git:', error.message);
    console.log('🔍 Vérification manuelle des fichiers critiques...');
    
    // Vérification de secours pour les fichiers critiques
    try {
      const criticalFiles = [
        './src/app/layout.tsx',
        './next.config.js', 
        './next.config.mjs',
        './package.json'
      ];
      
      let hasConflicts = false;
      
      for (const file of criticalFiles) {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8');
          if (content.includes('<<<<<<< HEAD') || content.includes('=======') || content.includes('>>>>>>> ')) {
            console.log(`\x1b[31m❌ Marqueurs de conflit Git détectés dans ${file}\x1b[0m`);
            hasConflicts = true;
          }
        }
      }
      
      if (!hasConflicts) {
        console.log('✅ Aucun marqueur de conflit Git détecté dans les fichiers critiques');
        return true;
      }
      
      return false;
    } catch (e) {
      console.error('⚠️ Erreur lors de la vérification manuelle des conflits Git:', e.message);
      return false;
    }
  }
}

// Vérifier si les fichiers Supabase sont correctement configurés
function checkSupabaseFiles() {
  console.log(`${colors.blue}🔍 Vérification de la configuration Supabase...${colors.reset}`);
  
  const supabaseClientPaths = [
    path.join(process.cwd(), 'src', 'lib', 'supabase', 'client.js'),
    path.join(process.cwd(), 'src', 'lib', 'supabase', 'client.ts'),
    path.join(process.cwd(), 'src', 'lib', 'supabase.js'),
    path.join(process.cwd(), 'src', 'lib', 'supabase.ts')
  ];
  
  const existingFiles = supabaseClientPaths.filter(file => fs.existsSync(file));
  
  if (existingFiles.length === 0) {
    console.error(`${colors.red}❌ Aucun fichier client Supabase trouvé. L'authentification ne fonctionnera pas.${colors.reset}`);
    hasErrors = true;
    return;
  }
  
  // Vérifier si chaque fichier client contient une gestion d'erreur
  let hasErrorHandling = false;
  
  for (const file of existingFiles) {
    const content = fs.readFileSync(file, 'utf8');
    
    if (content.includes('try') && content.includes('catch')) {
      hasErrorHandling = true;
      break;
    }
  }
  
  if (!hasErrorHandling) {
    console.warn(`${colors.yellow}⚠️ Les fichiers client Supabase ne semblent pas avoir de gestion d'erreur robuste${colors.reset}`);
    warnings++;
  } else {
    console.log(`${colors.green}✅ Gestion d'erreur Supabase détectée${colors.reset}`);
  }
}

// Vérifier si les variables d'environnement sont correctes
function checkEnvVariables() {
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

// Vérifier si les fichiers middleware sont dupliqués
function checkDuplicateMiddleware() {
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