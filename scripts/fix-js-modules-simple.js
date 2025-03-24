#!/usr/bin/env node
/**
 * Script simplifié pour convertir les imports/exports ES en CommonJS
 * Cette version évite les expressions régulières complexes qui posent problème dans vercel.sh
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Conversion minimaliste des modules ES vers CommonJS...');

// Constantes de log qui pourraient être définies dans des fichiers problématiques
// Ces constantes seront ré-injectées dans les fichiers qui les utilisent
const INFO = 'INFO';
const WARNING = 'WARNING';
const ERROR = 'ERROR';
const DEBUG = 'DEBUG';
const SESSION = 'SESSION';

// Liste des fichiers connus pour être problématiques
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

// Fonction pour trouver des fichiers JS dans un répertoire et vérifier s'ils utilisent la syntaxe ES module
function findJsFiles(directory) {
  const jsFiles = [];
  
  function scanDir(dir) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        scanDir(fullPath); // Recursively scan subdirectories
      } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
        // Lire le contenu et vérifier si ce fichier utilise import/export
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (
            (content.includes('import ') || content.includes('export ') || 
             content.includes('import.meta') || content.includes('export default')) && 
            !problematicFiles.includes(fullPath)
          ) {
            jsFiles.push(fullPath);
          }
        } catch (err) {
          console.error(`Erreur lors de la lecture du fichier ${fullPath}:`, err);
        }
      }
    }
  }
  
  scanDir(directory);
  return jsFiles;
}

// Trouver d'autres fichiers avec la syntaxe ES module
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

console.log(`Fichiers à traiter: ${problematicFiles.length}`);

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
    
    console.log(`Traitement de ${filePath}`);
    
    // Créer une sauvegarde
    const backupPath = `${fullPath}.esm-backup`;
    fs.copyFileSync(fullPath, backupPath);
    
    // Lire le contenu
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Convertir les importations ES module en require CommonJS
    content = content.replace(/import\s+(\{[^}]+\})\s+from\s+['"]([^'"]+)['"]/g, (match, imports, source) => {
      const cleanImports = imports.replace(/\s+as\s+/g, ': ').trim();
      return `const ${cleanImports} = require('${source}')`;
    });
    
    // Convertir les imports par défaut
    content = content.replace(/import\s+([^{}\s,]+)\s+from\s+['"]([^'"]+)['"]/g, (match, name, source) => {
      return `const ${name} = require('${source}')`;
    });
    
    // Convertir les exports nommés
    content = content.replace(/export\s+const\s+([^=\s]+)\s*=/g, 'const $1 =');
    
    // Convertir export default en module.exports
    content = content.replace(/export\s+default\s+([^;]+)/g, 'module.exports = $1');
    
    // Supprimer ou remplacer les références à import.meta.webpackHot qui causent des problèmes
    content = content.replace(/if\s*\(\s*import\.meta\.webpackHot\s*\)\s*\{\s*[^}]*import\.meta\.webpackHot\.accept\(\)[^}]*\}/g, 
      '// HMR disabled - removed problematic import.meta.webpackHot\n/* if (typeof window !== "undefined" && module && module.hot) { module.hot.accept() } */');
    
    // Remplacer toutes les occurrences restantes de import.meta.webpackHot
    content = content.replace(/import\.meta\.webpackHot/g, '(false && {})');
    
    // Supprimer les imports de react-refresh
    content = content.replace(/import\s+.*from\s+['"]@next\/react-refresh-utils.*['"]/g, '// Removed react-refresh import');
    content = content.replace(/import\s+.*from\s+['"]react-refresh.*['"]/g, '// Removed react-refresh import');
    
    // Supprimer toute fonction ou code lié à HMR
    content = content.replace(/const\s+getRefreshModuleRuntime\s*=.*?;/g, '// Removed HMR runtime function');
    content = content.replace(/function\s+registerExportsForReactRefresh.*?\}/gs, '// Removed React Refresh function');
    content = content.replace(/function\s+isReactRefreshBoundary.*?\}/gs, '// Removed React Refresh function');
    
    // Supprimer les blocs complets liés à HMR
    content = content.replace(/\/\/ Handle HMR.*?}\)\(\);/gs, '// Removed HMR block');
    
    // Remplacer toutes les références à import.meta (pas seulement webpackHot)
    content = content.replace(/import\.meta\./g, '/* import.meta disabled */ ({}).');
    
    // Remplacer les références à LOG_LEVELS.X par les constantes directes
    content = content.replace(/LOG_LEVELS\.INFO/g, 'INFO');
    content = content.replace(/LOG_LEVELS\.WARNING/g, 'WARNING');
    content = content.replace(/LOG_LEVELS\.ERROR/g, 'ERROR');
    content = content.replace(/LOG_LEVELS\.DEBUG/g, 'DEBUG');
    content = content.replace(/LOG_LEVELS\.SESSION/g, 'SESSION');
    
    // Ajouter les exports nommés à la fin du fichier si nécessaire
    const namedExports = [];
    const exportMatches = content.match(/export\s+const\s+([^=\s]+)\s*=/g);
    if (exportMatches) {
      exportMatches.forEach(match => {
        const name = match.replace(/export\s+const\s+/, '').replace(/\s*=/, '');
        namedExports.push(name);
      });
    }
    
    if (namedExports.length > 0) {
      namedExports.forEach(name => {
        content += `\nmodule.exports.${name} = ${name};`;
      });
    }
    
    // Écrire le contenu modifié
    fs.writeFileSync(fullPath, content);
    console.log(`Le fichier ${filePath} a été converti avec succès.`);
    filesProcessed++;
  } catch (error) {
    console.error(`❌ Erreur lors du traitement de ${filePath}: ${error.message}`);
  }
}

console.log(`✅ Conversion des modules ES terminée. ${filesProcessed} fichiers traités avec succès.`); 