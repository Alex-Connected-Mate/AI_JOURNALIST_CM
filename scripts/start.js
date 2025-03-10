#!/usr/bin/env node
/**
 * Script de démarrage sécurisé pour l'application
 * Vérifie et corrige les erreurs courantes avant de démarrer Next.js
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}🔍 Vérification de pré-démarrage...${colors.reset}`);

// Vérifier et corriger next.config.js
function checkAndFixNextConfig() {
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  
  if (!fs.existsSync(nextConfigPath)) {
    console.error(`${colors.red}❌ next.config.js introuvable.${colors.reset}`);
    return false;
  }
  
  try {
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Vérifier s'il y a des marqueurs de conflit Git
    if (content.includes('<<<<<<<')) {
      console.log(`${colors.yellow}⚠️ Conflit Git détecté dans next.config.js, correction...${colors.reset}`);
      
      // Exécuter le script de correction
      try {
        require('./fix-next-config');
        return true;
      } catch (error) {
        console.error(`${colors.red}❌ Erreur lors de la correction de next.config.js: ${error.message}${colors.reset}`);
        return false;
      }
    }
    
    // Vérifier la syntaxe du fichier
    try {
      execSync(`node --check ${nextConfigPath}`, { stdio: 'ignore' });
      console.log(`${colors.green}✅ next.config.js est valide.${colors.reset}`);
      return true;
    } catch (error) {
      console.error(`${colors.red}❌ next.config.js contient des erreurs de syntaxe.${colors.reset}`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de la lecture de next.config.js: ${error.message}${colors.reset}`);
    return false;
  }
}

// Fonction pour vérifier les erreurs JSON
function checkForJSONErrors() {
  console.log(`${colors.blue}🔍 Recherche de fichiers JSON corrompus...${colors.reset}`);
  
  const checkDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) return;
    
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Ne pas explorer certains dossiers
        if (!['node_modules', '.git', '.next'].includes(file)) {
          checkDir(filePath);
        }
      } else if (file.endsWith('.json')) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          JSON.parse(content); // Tenter de parser le JSON
        } catch (error) {
          console.log(`${colors.yellow}⚠️ Fichier JSON corrompu détecté: ${filePath}${colors.reset}`);
          
          // Créer une sauvegarde
          const backupPath = filePath + '.backup.' + Date.now();
          fs.copyFileSync(filePath, backupPath);
          console.log(`${colors.blue}📦 Sauvegarde créée: ${backupPath}${colors.reset}`);
          
          // Tenter de corriger le JSON (pour les cas simples)
          try {
            // Pour les erreurs de fin inattendue, on peut essayer d'ajouter une accolade fermante
            if (error.message.includes('Unexpected end')) {
              let fixedContent = content.trim();
              // Si le dernier caractère n'est pas une accolade fermante ou un crochet fermant
              const lastChar = fixedContent.charAt(fixedContent.length - 1);
              if (lastChar !== '}' && lastChar !== ']') {
                // Déterminer ce qu'il faut ajouter
                if (fixedContent.startsWith('{')) {
                  fixedContent += '\n}';
                } else if (fixedContent.startsWith('[')) {
                  fixedContent += '\n]';
                }
                
                // Écrire le contenu corrigé
                fs.writeFileSync(filePath, fixedContent);
                console.log(`${colors.green}✅ Tentative de correction pour ${filePath}${colors.reset}`);
              }
            }
          } catch (fixError) {
            console.error(`${colors.red}❌ Impossible de corriger automatiquement ${filePath}: ${fixError.message}${colors.reset}`);
          }
        }
      }
    }
  };
  
  checkDir('./src');
  console.log(`${colors.green}✅ Vérification JSON terminée.${colors.reset}`);
}

// Vérifier si les fichiers Input.tsx ont besoin de correction
function checkInputComponent() {
  console.log(`${colors.blue}🔍 Vérification des composants Input...${colors.reset}`);
  
  // Utiliser une commande grep pour rechercher onValidate dans les fichiers Input
  try {
    const result = execSync('find src -name "Input.tsx" -o -name "Input.jsx" 2>/dev/null || echo ""', { encoding: 'utf8' });
    const inputFiles = result.trim().split('\n').filter(Boolean);
    
    for (const file of inputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Vérifier si le fichier contient onValidate
      if (content.includes('onValidate')) {
        console.log(`${colors.yellow}⚠️ Problème potentiel de validation trouvé dans ${file}${colors.reset}`);
        
        // Créer une sauvegarde
        const backupPath = file + '.backup.' + Date.now();
        fs.copyFileSync(file, backupPath);
        console.log(`${colors.blue}📦 Sauvegarde créée: ${backupPath}${colors.reset}`);
        
        // Remplacer onValidate par validate
        const updatedContent = content.replace(/onValidate/g, 'validate');
        fs.writeFileSync(file, updatedContent);
        
        console.log(`${colors.green}✅ Correction appliquée à ${file}${colors.reset}`);
      } else {
        console.log(`${colors.green}✅ ${file} ne contient pas d'erreurs de validation.${colors.reset}`);
      }
    }
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de la vérification des composants Input: ${error.message}${colors.reset}`);
  }
}

// Fonction principale
async function main() {
  console.log(`${colors.cyan}🚀 Démarrage sécurisé de l'application...${colors.reset}`);
  
  // Vérifier next.config.js
  const nextConfigValid = checkAndFixNextConfig();
  
  if (!nextConfigValid) {
    console.error(`${colors.red}❌ Problèmes avec next.config.js. Tentative de correction automatique...${colors.reset}`);
    // Tenter d'exécuter le script de correction directement
    try {
      execSync('node scripts/fix-next-config.js', { stdio: 'inherit' });
    } catch (error) {
      console.error(`${colors.red}❌ Échec de la correction automatique. Veuillez corriger manuellement next.config.js.${colors.reset}`);
      process.exit(1);
    }
  }
  
  // Vérifier les erreurs JSON
  checkForJSONErrors();
  
  // Vérifier les composants Input
  checkInputComponent();
  
  console.log(`${colors.green}✅ Vérifications terminées. Démarrage de l'application...${colors.reset}`);
  
  // Démarrer l'application
  const nextProcess = spawn('npx', ['next', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  nextProcess.on('error', (error) => {
    console.error(`${colors.red}❌ Erreur lors du démarrage de Next.js: ${error.message}${colors.reset}`);
    process.exit(1);
  });
  
  nextProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`${colors.red}❌ Next.js s'est arrêté avec le code d'erreur ${code}${colors.reset}`);
      process.exit(code);
    }
  });
}

// Exécuter le script principal
main().catch((error) => {
  console.error(`${colors.red}❌ Erreur inattendue: ${error.message}${colors.reset}`);
  process.exit(1);
}); 