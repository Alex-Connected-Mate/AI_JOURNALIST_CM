#!/usr/bin/env node
/**
 * Script simplifié pour convertir les imports/exports ES en CommonJS
 * Cette version évite les expressions régulières complexes qui posent problème dans vercel.sh
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Conversion minimaliste des modules ES vers CommonJS...');

// Liste des fichiers problématiques connus
const problematicFiles = [
  'src/lib/logStore.js',
  'src/lib/services/agentService.js',
  'src/hooks/useLogger.js',
  'src/lib/eventTracker.js',
  'src/lib/i18n.js',
  'src/lib/logger.js',
  'src/pages/test-toast.jsx',
  'src/pages/_app.js',
  'src/pages/_document.js',
  'src/pages/api/ai/analyze-session.js',
  'src/pages/api/ai/get-analysis.js'
];

// Fonction pour trouver tous les fichiers JS/JSX dans un répertoire
function findJsFiles(directory) {
  const files = [];
  
  try {
    if (!fs.existsSync(directory)) {
      return files;
    }
    
    const items = fs.readdirSync(directory);
    
    for (const item of items) {
      const fullPath = path.join(directory, item);
      
      if (fs.statSync(fullPath).isDirectory()) {
        // Recursively search subdirectories
        const subFiles = findJsFiles(fullPath);
        files.push(...subFiles);
      } else if (
        item.endsWith('.js') || 
        item.endsWith('.jsx') || 
        item.endsWith('.mjs')
      ) {
        // Check if file contains ES modules syntax
        const content = fs.readFileSync(fullPath, 'utf8');
        if (
          content.includes('import ') || 
          content.includes('export ') || 
          content.includes('export default')
        ) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Erreur lors de la recherche de fichiers JS: ${error.message}`);
  }
  
  return files;
}

// Rechercher automatiquement les fichiers supplémentaires avec syntax ES modules
const srcPath = path.join(process.cwd(), 'src');
console.log('🔍 Recherche de fichiers JS avec syntax ES modules...');

try {
  const additionalFiles = findJsFiles(srcPath)
    .map(file => path.relative(process.cwd(), file))
    .filter(file => !problematicFiles.includes(file));
  
  console.log(`📋 ${additionalFiles.length} fichiers supplémentaires détectés avec syntax ES modules`);
  
  // Ajouter les fichiers supplémentaires à la liste
  problematicFiles.push(...additionalFiles);
} catch (error) {
  console.error(`❌ Erreur lors de la recherche automatique: ${error.message}`);
}

function convertFileContent(content) {
  // Sauvegarde du contenu original
  const originalContent = content;
  
  try {
    // Conversion basique des imports
    let newContent = content;
    
    // Première étape : Correction des exports default de composants React
    // Cela remplace "export default function ComponentName" par "module.exports = function ComponentName"
    newContent = newContent.replace(
      /export\s+default\s+function\s+(\w+)\s*\(/g,
      'module.exports = function $1('
    );
    
    // Convertir les imports nommés: import { x, y } from 'module';
    newContent = newContent.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/g, 
      (match, importNames, moduleName) => {
        // Prétraitement pour gérer les renommages avec "as"
        const processedNames = importNames.split(',').map(item => {
          const trimmed = item.trim();
          // Si c'est un renommage avec "as", le convertir en format CommonJS
          if (trimmed.includes(' as ')) {
            const [original, renamed] = trimmed.split(' as ').map(x => x.trim());
            return `${original}: ${renamed}`;
          }
          return trimmed;
        });
        
        const destructuring = processedNames.join(', ');
        return `const { ${destructuring} } = require('${moduleName}');`;
      }
    );
    
    // Convertir les imports par défaut: import x from 'module';
    newContent = newContent.replace(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g, 
      (match, importName, moduleName) => {
        return `const ${importName} = require('${moduleName}');`;
      }
    );
    
    // Convertir les imports simples: import 'module';
    newContent = newContent.replace(/import\s+['"]([^'"]+)['"]/g, 
      (match, moduleName) => {
        return `require('${moduleName}');`;
      }
    );
    
    // Convertir les exports par défaut: export default x;
    newContent = newContent.replace(/export\s+default\s+(\w+)/g, 
      (match, exportName) => {
        return `module.exports = ${exportName}`;
      }
    );
    
    // Convertir les exports par défaut avec fonction/classe/objet: export default function/class/{ ... }
    newContent = newContent.replace(/export\s+default\s+(function|class|{)/g, 
      (match, keyword) => {
        return `module.exports = ${keyword}`;
      }
    );
    
    // Corriger le problème de point-virgule après "function"
    newContent = newContent.replace(/module\.exports = function;(\s+)(\w+)/g, 
      (match, space, funcName) => {
        return `module.exports = function${space}${funcName}`;
      }
    );
    
    // Corriger tous les doubles points-virgules qui auraient pu être introduits
    newContent = newContent.replace(/;;/g, ';');
    
    // Corriger les problèmes avec les "require" suivis d'un point-virgule supplémentaire
    newContent = newContent.replace(/require\('([^']+)'\);;/g, "require('$1');");
    
    // Supprimer les exports ES modules si un module.exports est déjà présent
    if (newContent.includes('module.exports =')) {
      newContent = newContent.replace(/export\s+\{\s*([^}]+)\s*\};?/g, '');
    } else {
      // Convertir les exports nommés sous forme d'objet: export { x, y };
      newContent = newContent.replace(/export\s+\{\s*([^}]+)\s*\};?/g, 
        (match, exportNames) => {
          const names = exportNames.split(',').map(name => name.trim());
          return `module.exports = { ${names.join(', ')} };`;
        }
      );
    }
    
    // Convertir les exports nommés: export const x = y;
    newContent = newContent.replace(/export\s+(const|let|var|function|class)\s+(\w+)/g, 
      (match, type, name) => {
        return `${type} ${name}`;
      }
    );
    
    // Gérer les API routes de Next.js App Router
    // Convertir "export async function GET()" en "module.exports.GET = async function()"
    newContent = newContent.replace(/export\s+(async\s+)?function\s+(\w+)\s*\(/g, 
      (match, asyncKeyword, functionName) => {
        const async = asyncKeyword || '';
        return `module.exports.${functionName} = ${async}function(`;
      }
    );
    
    // Ajouter les exports nommés à la fin du fichier
    // Cette étape est approximative et pourrait nécessiter des ajustements manuels
    const namedExports = [];
    const namedExportMatches = content.matchAll(/export\s+(const|let|var|function|class)\s+(\w+)/g);
    for (const match of namedExportMatches) {
      namedExports.push(match[2]);
    }
    
    // Vérifier si le fichier est un module de logging ou contient des constantes LOG_LEVELS
    // et s'assurer que ces constantes sont accessibles globalement
    if (content.includes('LOG_LEVELS')) {
      // Remplacer les références à LOG_LEVELS.X par des références directes aux propriétés de LOG_LEVELS
      // Dans certains fichiers, LOG_LEVELS peut ne pas être accessible après conversion
      if (newContent.includes('LOG_LEVELS.INFO')) {
        newContent = newContent.replace(/LOG_LEVELS\.INFO/g, "LOG_LEVELS && LOG_LEVELS.INFO || { label: 'INFO', color: '#3b82f6' }");
      }
      if (newContent.includes('LOG_LEVELS.WARNING')) {
        newContent = newContent.replace(/LOG_LEVELS\.WARNING/g, "LOG_LEVELS && LOG_LEVELS.WARNING || { label: 'WARN', color: '#f59e0b' }");
      }
      if (newContent.includes('LOG_LEVELS.ERROR')) {
        newContent = newContent.replace(/LOG_LEVELS\.ERROR/g, "LOG_LEVELS && LOG_LEVELS.ERROR || { label: 'ERROR', color: '#ef4444' }");
      }
      if (newContent.includes('LOG_LEVELS.DEBUG')) {
        newContent = newContent.replace(/LOG_LEVELS\.DEBUG/g, "LOG_LEVELS && LOG_LEVELS.DEBUG || { label: 'DEBUG', color: '#10b981' }");
      }
      if (newContent.includes('LOG_LEVELS.SESSION')) {
        newContent = newContent.replace(/LOG_LEVELS\.SESSION/g, "LOG_LEVELS && LOG_LEVELS.SESSION || { label: 'SESSION', color: '#8b5cf6' }");
      }
    }
    
    if (namedExports.length > 0) {
      // Ajouter l'export à la fin seulement s'il n'y a pas déjà d'export par défaut
      if (!content.includes('export default')) {
        newContent += `\n\nmodule.exports = { ${namedExports.join(', ')} };\n`;
      } else {
        // S'il y a un export par défaut, ajouter les exports nommés comme propriétés
        const exportLines = namedExports.map(name => `module.exports.${name} = ${name};`);
        newContent += `\n\n${exportLines.join('\n')}\n`;
      }
    }
    
    return newContent;
  } catch (error) {
    console.error(`Erreur de conversion, utilisation du contenu original: ${error.message}`);
    return originalContent;
  }
}

// Traitement de chaque fichier
console.log(`📋 Traitement de ${problematicFiles.length} fichiers...`);
let filesProcessed = 0;

for (const filePath of problematicFiles) {
  const fullPath = path.join(process.cwd(), filePath);
  
  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️ Fichier ${filePath} non trouvé. Ignorer.`);
      continue;
    }
    
    // Lire le contenu
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Créer une sauvegarde
    fs.writeFileSync(`${fullPath}.backup-${Date.now()}`, content);
    
    // Convertir le contenu
    const convertedContent = convertFileContent(content);
    
    // Écrire le nouveau contenu
    fs.writeFileSync(fullPath, convertedContent);
    
    console.log(`✅ Conversion terminée pour ${filePath}`);
    filesProcessed++;
  } catch (error) {
    console.error(`❌ Erreur lors du traitement de ${filePath}: ${error.message}`);
  }
}

console.log(`✅ Conversion des modules ES terminée. ${filesProcessed} fichiers traités avec succès.`); 