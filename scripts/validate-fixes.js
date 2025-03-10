#!/usr/bin/env node
/**
 * Script pour valider que les corrections ont résolu les problèmes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Fonction pour tester si next.config.js est valide
function validateNextConfig() {
  console.log(`${colors.blue}🔍 Vérification de next.config.js...${colors.reset}`);
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  
  if (!fs.existsSync(nextConfigPath)) {
    console.error(`${colors.red}❌ next.config.js introuvable.${colors.reset}`);
    return false;
  }
  
  try {
    // Vérifier le contenu du fichier
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Vérifier s'il y a des marqueurs de conflit Git
    if (content.includes('<<<<<<<')) {
      console.error(`${colors.red}❌ next.config.js contient encore des conflits Git.${colors.reset}`);
      return false;
    }
    
    // Exécuter Node.js pour valider la syntaxe du fichier
    execSync(`node --check ${nextConfigPath}`, { stdio: 'ignore' });
    console.log(`${colors.green}✅ next.config.js est syntaxiquement valide.${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ next.config.js contient des erreurs de syntaxe.${colors.reset}`);
    return false;
  }
}

// Fonction pour vérifier si le problème onValidate est résolu
function validateInputComponents() {
  console.log(`${colors.blue}🔍 Vérification des composants Input...${colors.reset}`);
  
  // Rechercher tous les fichiers Input
  try {
    const result = execSync('find src -name "Input.tsx" -o -name "Input.jsx" 2>/dev/null || echo ""', { encoding: 'utf8' });
    const inputFiles = result.trim().split('\n').filter(Boolean);
    
    if (inputFiles.length === 0) {
      console.warn(`${colors.yellow}⚠️ Aucun fichier Input trouvé.${colors.reset}`);
      return true;
    }
    
    let allValid = true;
    
    for (const file of inputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Vérifier si le fichier contient onValidate comme prop
      if (content.includes('onValidate') && !content.includes('// onValidate')) {
        console.error(`${colors.red}❌ ${file} contient encore des références à onValidate.${colors.reset}`);
        allValid = false;
      } else {
        console.log(`${colors.green}✅ ${file} est correctement configuré.${colors.reset}`);
      }
    }
    
    return allValid;
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de la vérification des composants Input: ${error.message}${colors.reset}`);
    return false;
  }
}

// Fonction pour vérifier les appels vers les composants Input
function validateInputUsage() {
  console.log(`${colors.blue}🔍 Vérification des appels aux composants Input...${colors.reset}`);
  
  try {
    // Rechercher les occurrences de onValidate dans les fichiers JSX/TSX
    const result = execSync('grep -r "onValidate=" --include="*.jsx" --include="*.tsx" src 2>/dev/null || echo ""', { encoding: 'utf8' });
    const lines = result.trim().split('\n').filter(Boolean);
    
    if (lines.length === 0) {
      console.log(`${colors.green}✅ Aucune utilisation de onValidate trouvée dans les composants.${colors.reset}`);
      return true;
    }
    
    for (const line of lines) {
      console.error(`${colors.red}❌ Utilisation de onValidate trouvée: ${line}${colors.reset}`);
    }
    
    return false;
  } catch (error) {
    // Si grep ne trouve rien, il retourne une erreur, ce qui est normal
    if (error.status === 1 && error.stdout === '') {
      console.log(`${colors.green}✅ Aucune utilisation de onValidate trouvée dans les composants.${colors.reset}`);
      return true;
    }
    
    console.error(`${colors.red}❌ Erreur lors de la vérification des appels aux composants Input: ${error.message}${colors.reset}`);
    return false;
  }
}

// Fonction pour vérifier s'il y a des erreurs JSON
function validateJSONFiles() {
  console.log(`${colors.blue}🔍 Vérification des fichiers JSON...${colors.reset}`);
  
  const checkDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) return true;
    
    const files = fs.readdirSync(dirPath);
    let allValid = true;
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Ne pas explorer certains dossiers
        if (!['node_modules', '.git', '.next'].includes(file)) {
          if (!checkDir(filePath)) {
            allValid = false;
          }
        }
      } else if (file.endsWith('.json')) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          JSON.parse(content); // Tenter de parser le JSON
        } catch (error) {
          console.error(`${colors.red}❌ Fichier JSON corrompu: ${filePath} - ${error.message}${colors.reset}`);
          allValid = false;
        }
      }
    }
    
    return allValid;
  };
  
  const isValid = checkDir('./src');
  
  if (isValid) {
    console.log(`${colors.green}✅ Tous les fichiers JSON sont valides.${colors.reset}`);
  }
  
  return isValid;
}

// Fonction principale
function main() {
  console.log(`${colors.cyan}🚀 Validation des corrections...${colors.reset}\n`);
  
  // Valider next.config.js
  const nextConfigValid = validateNextConfig();
  
  // Valider les composants Input
  const inputComponentsValid = validateInputComponents();
  
  // Valider les appels aux composants Input
  const inputUsageValid = validateInputUsage();
  
  // Valider les fichiers JSON
  const jsonFilesValid = validateJSONFiles();
  
  console.log('\n');
  
  // Résumé
  if (nextConfigValid && inputComponentsValid && inputUsageValid && jsonFilesValid) {
    console.log(`${colors.green}✅ Toutes les corrections ont été appliquées avec succès !${colors.reset}`);
    return 0;
  } else {
    console.error(`${colors.red}❌ Certains problèmes n'ont pas été résolus.${colors.reset}`);
    console.log('\nRécapitulatif:');
    console.log(`- next.config.js: ${nextConfigValid ? `${colors.green}✅ OK${colors.reset}` : `${colors.red}❌ Problèmes${colors.reset}`}`);
    console.log(`- Composants Input: ${inputComponentsValid ? `${colors.green}✅ OK${colors.reset}` : `${colors.red}❌ Problèmes${colors.reset}`}`);
    console.log(`- Utilisation des Input: ${inputUsageValid ? `${colors.green}✅ OK${colors.reset}` : `${colors.red}❌ Problèmes${colors.reset}`}`);
    console.log(`- Fichiers JSON: ${jsonFilesValid ? `${colors.green}✅ OK${colors.reset}` : `${colors.red}❌ Problèmes${colors.reset}`}`);
    return 1;
  }
}

// Exécuter le script et stocker le code de sortie
const exitCode = main();

// Quitter avec le code approprié
process.exit(exitCode); 