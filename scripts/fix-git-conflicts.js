#!/usr/bin/env node
/**
 * Script pour résoudre automatiquement les conflits Git dans les fichiers
 * Ce script va identifier et résoudre les conflits en choisissant
 * la version la plus récente du code (après le marqueur =======)
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

console.log(`${colors.cyan}🔍 Recherche et résolution des conflits Git...${colors.reset}`);

// Fichiers spécifiques à vérifier en priorité
const specificFiles = [
  'src/lib/supabase.ts'
];

// Fonction pour résoudre les conflits dans un fichier
function resolveConflictsInFile(filePath) {
  console.log(`${colors.blue}🔍 Vérification des conflits dans: ${filePath}${colors.reset}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`${colors.yellow}⚠️ Fichier introuvable: ${filePath}${colors.reset}`);
    return false;
  }
  
  try {
    // Lire le contenu du fichier
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifier s'il y a des marqueurs de conflit
    if (!content.includes('<<<<<<< HEAD') && !content.includes('=======') && !content.includes('>>>>>>>')) {
      console.log(`${colors.green}✅ Aucun conflit détecté dans: ${filePath}${colors.reset}`);
      return false;
    }
    
    // Créer une sauvegarde
    const backupPath = `${filePath}.conflict.backup`;
    fs.copyFileSync(filePath, backupPath);
    console.log(`${colors.blue}📄 Sauvegarde créée: ${backupPath}${colors.reset}`);
    
    // Résoudre les conflits en gardant la version plus récente (après le marqueur =======)
    let newContent = '';
    let inConflict = false;
    let keepCurrentVersion = false;
    let conflictCount = 0;
    
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('<<<<<<< HEAD')) {
        inConflict = true;
        keepCurrentVersion = false;
        conflictCount++;
        continue;
      }
      
      if (line.includes('=======')) {
        keepCurrentVersion = true;
        continue;
      }
      
      if (line.includes('>>>>>>>')) {
        inConflict = false;
        keepCurrentVersion = false;
        continue;
      }
      
      if (!inConflict || keepCurrentVersion) {
        newContent += line + '\n';
      }
    }
    
    // Écrire le contenu résolu
    fs.writeFileSync(filePath, newContent);
    console.log(`${colors.green}✅ Résolution de ${conflictCount} conflits dans: ${filePath}${colors.reset}`);
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de la résolution des conflits dans ${filePath}: ${error.message}${colors.reset}`);
    return false;
  }
}

// Résoudre les conflits dans les fichiers spécifiques
let resolvedCount = 0;
for (const file of specificFiles) {
  const fullPath = path.join(process.cwd(), file);
  if (resolveConflictsInFile(fullPath)) {
    resolvedCount++;
  }
}

// Rechercher tous les autres fichiers avec des conflits
console.log(`${colors.blue}🔍 Recherche d'autres fichiers avec des conflits...${colors.reset}`);

try {
  // Utiliser find et grep pour trouver les fichiers avec des marqueurs de conflit
  const command = `find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.next/*" -not -path "*/scripts/fix-git-conflicts.js" -exec grep -l "<<<<<<< HEAD\\|=======\\|>>>>>>>" {} \\;`;
  const output = execSync(command).toString();
  
  if (output.trim()) {
    const conflictFiles = output.trim().split('\n');
    console.log(`${colors.yellow}⚠️ ${conflictFiles.length} fichiers avec des conflits détectés.${colors.reset}`);
    
    for (const file of conflictFiles) {
      // Ignorer les fichiers déjà traités
      if (specificFiles.some(specificFile => file.endsWith(specificFile))) {
        continue;
      }
      
      if (resolveConflictsInFile(file)) {
        resolvedCount++;
      }
    }
  } else {
    console.log(`${colors.green}✅ Aucun autre fichier avec des conflits détecté.${colors.reset}`);
  }
} catch (error) {
  console.error(`${colors.red}❌ Erreur lors de la recherche des fichiers avec des conflits: ${error.message}${colors.reset}`);
}

console.log(`${colors.cyan}📊 Résumé: ${resolvedCount} fichiers avec des conflits résolus.${colors.reset}`);

// Retourner un code d'erreur si aucun fichier n'a été résolu
process.exit(resolvedCount > 0 ? 0 : 1); 