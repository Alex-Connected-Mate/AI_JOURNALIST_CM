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
  'src/pages/test-toast.jsx',
  'src/pages/_app.js',
  'src/pages/_document.js',
  'src/pages/api/ai/analyze-session.js',
  'src/pages/api/ai/get-analysis.js'
];

function convertFileContent(content) {
  // Sauvegarde du contenu original
  const originalContent = content;
  
  try {
    // Conversion basique des imports
    let newContent = content;
    
    // Convertir les imports nommés: import { x, y } from 'module';
    newContent = newContent.replace(/import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/g, 
      (match, importNames, moduleName) => {
        const names = importNames.split(',').map(name => name.trim());
        const destructuring = names.join(', ');
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
        return `module.exports = ${exportName};`;
      }
    );
    
    // Convertir les exports par défaut avec fonction/classe/objet: export default function/class/{ ... }
    newContent = newContent.replace(/export\s+default\s+(function|class|{)/g, 
      (match, keyword) => {
        return `module.exports = ${keyword}`;
      }
    );
    
    // Convertir les exports nommés: export const x = y;
    newContent = newContent.replace(/export\s+(const|let|var|function|class)\s+(\w+)/g, 
      (match, type, name) => {
        return `${type} ${name}`;
      }
    );
    
    // Ajouter les exports nommés à la fin du fichier
    // Cette étape est approximative et pourrait nécessiter des ajustements manuels
    const namedExports = [];
    const namedExportMatches = content.matchAll(/export\s+(const|let|var|function|class)\s+(\w+)/g);
    for (const match of namedExportMatches) {
      namedExports.push(match[2]);
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
  } catch (error) {
    console.error(`❌ Erreur lors du traitement de ${filePath}: ${error.message}`);
  }
}

console.log('✅ Conversion des modules ES terminée.'); 