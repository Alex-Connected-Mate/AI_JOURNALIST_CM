#!/usr/bin/env node
/**
 * Script pour corriger les fichiers JS qui utilisent ES modules
 * Ce script convertit les imports/exports ES en syntaxe CommonJS
 */

const fs = require('fs');
const path = require('path');

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`${colors.cyan}🔧 Correction des fichiers JS avec ES modules...${colors.reset}`);

// Liste des fichiers problématiques identifiés dans les logs
const problematicFiles = [
  // Fichiers spécifiques
  'src/hooks/useLogger.js',
  'src/lib/eventTracker.js',
  'src/lib/i18n.js',
  'src/lib/logger.js',
  'src/lib/promptParser.js',
  'src/lib/supabase.js',
  'src/lib/logStore.js',
  'src/lib/services/agentService.js',
  'src/lib/services/analysisService.js',
  'src/lib/services/sessionService.js',
  'src/lib/services/userService.js',
  'src/pages/_app.js',
  'src/pages/_document.js',
  'src/pages/api/ai/analyze-session.js',
  'src/pages/api/ai/get-analysis.js',
  'src/pages/test-toast.jsx'
];

// Fonction pour convertir un fichier
function convertFile(filePath) {
  console.log(`${colors.blue}🔍 Conversion du fichier: ${filePath}${colors.reset}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`${colors.yellow}⚠️ Fichier introuvable: ${filePath}${colors.reset}`);
    return false;
  }
  
  try {
    // Créer une sauvegarde
    const backupPath = `${filePath}.backup`;
    fs.copyFileSync(filePath, backupPath);
    
    // Lire le contenu du fichier
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Convertir les imports ES en require
    content = content.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, 'const $1 = require(\'$2\')');
    content = content.replace(/import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"]/g, (match, imports, source) => {
      const importList = imports.split(',').map(i => i.trim());
      return `const { ${importList.join(', ')} } = require('${source}')`;
    });
    
    // Convertir les exports nommés
    content = content.replace(/export\s+const\s+(\w+)\s*=/g, 'const $1 =');
    content = content.replace(/export\s+function\s+(\w+)/g, 'function $1');
    
    // Ajouter les exports en bas du fichier
    const exportedVariables = [];
    const exportRegex = /export\s+(const|let|var|function)\s+(\w+)/g;
    let match;
    
    while ((match = exportRegex.exec(content)) !== null) {
      exportedVariables.push(match[2]);
    }
    
    if (exportedVariables.length > 0) {
      const exportsStatement = `\n\nmodule.exports = { ${exportedVariables.join(', ')} };\n`;
      content = content.replace(/export\s+/g, '') + exportsStatement;
    }
    
    // Convertir export default
    const defaultExportRegex = /export\s+default\s+(\w+)/;
    const defaultMatch = defaultExportRegex.exec(content);
    
    if (defaultMatch) {
      const defaultExport = defaultMatch[1];
      content = content.replace(defaultExportRegex, '');
      content += `\nmodule.exports = ${defaultExport};\n`;
    }
    
    // Gérer les cas particuliers comme "export { x }"
    content = content.replace(/export\s+\{\s*([^}]+)\s*\}/g, (match, exports) => {
      const exportList = exports.split(',').map(e => e.trim());
      return `module.exports = { ${exportList.join(', ')} };`;
    });
    
    // Cas spécial pour export default function(...
    content = content.replace(/export\s+default\s+function\s+(\w+)/g, 'function $1');
    if (content.includes('function handler(') || content.includes('function Document(') || content.includes('function MyApp(')) {
      if (!content.includes('module.exports =')) {
        // Si on a une fonction nommée mais pas d'export, ajouter un export à la fin
        const funcNames = [];
        // Rechercher les déclarations de fonction standard
        const funcRegex = /function\s+(\w+)\s*\(/g;
        while ((match = funcRegex.exec(content)) !== null) {
          funcNames.push(match[1]);
        }
        
        // Ajouter l'export pour la première fonction trouvée ou pour 'handler' par défaut
        const exportName = funcNames.length > 0 ? funcNames[0] : 'handler';
        content += `\nmodule.exports = ${exportName};\n`;
      }
    }
    
    // Écrire le fichier converti
    fs.writeFileSync(filePath, content);
    console.log(`${colors.green}✅ Fichier converti avec succès: ${filePath}${colors.reset}`);
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de la conversion du fichier ${filePath}: ${error.message}${colors.reset}`);
    return false;
  }
}

// Trouver et convertir tous les fichiers dans src/pages/
function findAndConvertPagesFiles() {
  console.log(`${colors.blue}🔍 Recherche des fichiers à convertir dans src/pages/...${colors.reset}`);
  
  const pagesDir = path.join(process.cwd(), 'src', 'pages');
  if (!fs.existsSync(pagesDir)) {
    console.log(`${colors.yellow}⚠️ Répertoire src/pages/ non trouvé. Ignorer.${colors.reset}`);
    return 0;
  }
  
  let convertedCount = 0;
  
  // Fonction récursive pour parcourir les répertoires
  const processDir = (dir) => {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // Ignorer node_modules et .next
        if (file !== 'node_modules' && file !== '.next') {
          processDir(filePath);
        }
      } else if ((file.endsWith('.js') || file.endsWith('.jsx')) && !file.endsWith('.backup.js')) {
        // Vérifier si le fichier contient des imports/exports ES
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('import ') || content.includes('export ')) {
          if (convertFile(filePath)) {
            convertedCount++;
          }
        }
      }
    }
  };
  
  try {
    processDir(pagesDir);
    console.log(`${colors.green}✅ ${convertedCount} fichiers supplémentaires convertis dans src/pages/${colors.reset}`);
    return convertedCount;
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de la conversion des fichiers dans src/pages/: ${error.message}${colors.reset}`);
    return 0;
  }
}

// Fonction pour vérifier récursivement les répertoires supplémentaires
function scanAdditionalDirectories() {
  console.log(`${colors.blue}🔍 Recherche des fichiers à convertir dans les sous-répertoires de src/lib/...[0m`);
  
  const directories = [
    path.join(process.cwd(), 'src', 'lib', 'services'),
    path.join(process.cwd(), 'src', 'lib', 'hooks'),
    path.join(process.cwd(), 'src', 'lib', 'utils')
  ];
  
  let convertedCount = 0;
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`${colors.yellow}⚠️ Répertoire ${dir} non trouvé. Ignorer.[0m`);
      return;
    }
    
    console.log(`${colors.blue}🔍 Vérification du répertoire: ${dir}[0m`);
    
    // Fonction récursive pour parcourir les répertoires
    const processDir = (directory) => {
      if (!fs.existsSync(directory)) return;
      
      const files = fs.readdirSync(directory);
      
      for (const file of files) {
        const filePath = path.join(directory, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          // Ignorer node_modules et .next
          if (file !== 'node_modules' && file !== '.next') {
            processDir(filePath);
          }
        } else if ((file.endsWith('.js') || file.endsWith('.jsx')) && !file.endsWith('.backup.js') && !file.includes('.backup.')) {
          // Ne pas traiter les fichiers déjà dans la liste
          const relativePath = path.relative(process.cwd(), filePath);
          if (problematicFiles.some(f => path.join(process.cwd(), f) === filePath)) {
            continue;
          }
          
          // Vérifier si le fichier contient des imports/exports ES
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes('import ') || content.includes('export ')) {
            console.log(`${colors.blue}🔍 Fichier ES Module détecté: ${relativePath}[0m`);
            if (convertFile(filePath)) {
              convertedCount++;
            }
          }
        }
      }
    };
    
    try {
      processDir(dir);
    } catch (error) {
      console.error(`${colors.red}❌ Erreur lors de la conversion des fichiers dans ${dir}: ${error.message}[0m`);
    }
  });
  
  console.log(`${colors.green}✅ ${convertedCount} fichiers supplémentaires convertis dans les sous-répertoires[0m`);
  return convertedCount;
}

// Convertir tous les fichiers problématiques spécifiques
let successCount = 0;
for (const file of problematicFiles) {
  const fullPath = path.join(process.cwd(), file);
  if (convertFile(fullPath)) {
    successCount++;
  }
}

// Trouver et convertir les autres fichiers dans src/pages/
const additionalFilesConverted = findAndConvertPagesFiles();

// Vérifier les sous-répertoires supplémentaires
const additionalDirFilesConverted = scanAdditionalDirectories();

console.log(`${colors.cyan}📊 Résumé: ${successCount}/${problematicFiles.length} fichiers spécifiques convertis avec succès[0m`);
console.log(`${colors.cyan}📊 ${additionalFilesConverted} fichiers supplémentaires convertis dans src/pages/[0m`);
console.log(`${colors.cyan}📊 ${additionalDirFilesConverted} fichiers supplémentaires convertis dans les sous-répertoires[0m`);

// Retourner un code d'erreur si au moins un fichier spécifique n'a pas été converti
process.exit(successCount === problematicFiles.length ? 0 : 1); 