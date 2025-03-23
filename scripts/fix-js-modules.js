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
  'src/hooks/useLogger.js',
  'src/lib/eventTracker.js',
  'src/lib/i18n.js',
  'src/lib/logger.js',
  'src/lib/promptParser.js'
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
    
    // Écrire le fichier converti
    fs.writeFileSync(filePath, content);
    console.log(`${colors.green}✅ Fichier converti avec succès: ${filePath}${colors.reset}`);
    
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ Erreur lors de la conversion du fichier ${filePath}: ${error.message}${colors.reset}`);
    return false;
  }
}

// Convertir tous les fichiers problématiques
let successCount = 0;
for (const file of problematicFiles) {
  const fullPath = path.join(process.cwd(), file);
  if (convertFile(fullPath)) {
    successCount++;
  }
}

console.log(`${colors.cyan}📊 Résumé: ${successCount}/${problematicFiles.length} fichiers convertis avec succès${colors.reset}`);

// Retourner un code d'erreur si au moins un fichier n'a pas été converti
process.exit(successCount === problematicFiles.length ? 0 : 1); 