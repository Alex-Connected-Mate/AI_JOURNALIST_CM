#!/usr/bin/env node
/**
 * Script de vérification avant déploiement
 * Exécuté automatiquement avant le build sur Vercel
 * pour s'assurer que la configuration est correcte
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

console.log(`${colors.cyan}🔍 Exécution des vérifications pré-déploiement...${colors.reset}`);

let hasErrors = false;
let warnings = 0;

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
    return;
  }
  
  const content = fs.readFileSync(nextConfigPath, 'utf8');
  
  // Vérifier s'il y a des marqueurs de conflit Git
  if (content.includes('<<<<<<<') || content.includes('>>>>>>>') || content.includes('=======')) {
    console.error(`${colors.red}❌ Marqueurs de conflit Git détectés dans next.config.js${colors.reset}`);
    hasErrors = true;
  } else {
    console.log(`${colors.green}✅ Pas de conflit Git dans next.config.js${colors.reset}`);
  }
  
  // Vérifier si la configuration webpack est présente
  if (!content.includes('webpack')) {
    console.warn(`${colors.yellow}⚠️ Configuration webpack manquante dans next.config.js${colors.reset}`);
    warnings++;
  } else {
    console.log(`${colors.green}✅ Configuration webpack présente${colors.reset}`);
  }
  
  // Vérifier si la configuration d'images est correcte
  if (!content.includes('images') || !content.includes('domains')) {
    console.warn(`${colors.yellow}⚠️ Configuration d'images potentiellement incorrecte dans next.config.js${colors.reset}`);
    warnings++;
  } else {
    console.log(`${colors.green}✅ Configuration d'images présente${colors.reset}`);
  }
}

// Vérifier les conflits Git dans les fichiers source
function checkGitConflicts() {
  console.log(`${colors.blue}🔍 Recherche de conflits Git...${colors.reset}`);
  
  try {
    // Rechercher dans tous les fichiers .js, .jsx, .ts, .tsx et .json
    const command = "grep -r '<<<<<<<\\|=======\\|>>>>>>>' --include='*.js' --include='*.jsx' --include='*.ts' --include='*.tsx' --include='*.json' . | grep -v 'node_modules\\|.next' || echo 'No conflicts found'";
    const result = execSync(command, { shell: true }).toString();
    
    if (result.trim() !== 'No conflicts found') {
      console.error(`${colors.red}❌ Marqueurs de conflit Git détectés:${colors.reset}`);
      console.error(result);
      hasErrors = true;
    } else {
      console.log(`${colors.green}✅ Pas de conflit Git détecté${colors.reset}`);
    }
  } catch (error) {
    console.warn(`${colors.yellow}⚠️ Impossible de vérifier les conflits Git: ${error.message}${colors.reset}`);
    warnings++;
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

// Exécuter toutes les vérifications
function runAllChecks() {
  checkEnvironmentVariables();
  checkMiddlewareFiles();
  checkNextConfig();
  checkGitConflicts();
  checkSupabaseFiles();
  
  console.log('\n');
  
  if (hasErrors) {
    console.error(`${colors.red}❌ Des erreurs critiques ont été détectées. Veuillez les corriger avant le déploiement.${colors.reset}`);
    process.exit(1);
  } else if (warnings > 0) {
    console.warn(`${colors.yellow}⚠️ ${warnings} avertissements détectés. Le déploiement peut continuer mais pourrait rencontrer des problèmes.${colors.reset}`);
    process.exit(0); // Exit avec code 0 pour ne pas bloquer le déploiement
  } else {
    console.log(`${colors.green}✅ Toutes les vérifications ont réussi. Prêt pour le déploiement.${colors.reset}`);
    process.exit(0);
  }
}

// Exécuter toutes les vérifications
runAllChecks(); 