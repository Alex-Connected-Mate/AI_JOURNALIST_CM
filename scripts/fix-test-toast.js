#!/usr/bin/env node
/**
 * Script pour corriger la syntaxe de test-toast.jsx
 * Le fichier contient une erreur de syntaxe où la fonction
 * est déclarée sans le mot-clé 'function' ou 'export default'
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Correction de la syntaxe de test-toast.jsx...');

// Chemin du fichier
const filePath = path.join(process.cwd(), 'src', 'pages', 'test-toast.jsx');

// Vérifier si le fichier existe
if (!fs.existsSync(filePath)) {
  console.log('⚠️ Fichier test-toast.jsx introuvable. Ignorer.');
  process.exit(0);
}

try {
  // Créer une sauvegarde
  const backupPath = `${filePath}.backup`;
  fs.copyFileSync(filePath, backupPath);
  console.log(`✅ Sauvegarde créée: ${backupPath}`);
  
  // Lire le contenu du fichier
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Vérifier si l'erreur de syntaxe est présente
  if (content.includes('ToastTestPage() {')) {
    console.log('🔍 Erreur de syntaxe détectée dans test-toast.jsx');
    
    // Corriger la syntaxe en ajoutant 'function' ou 'export default function'
    content = content.replace('ToastTestPage() {', 'export default function ToastTestPage() {');
    
    // Écrire le fichier corrigé
    fs.writeFileSync(filePath, content);
    console.log('✅ Syntaxe de test-toast.jsx corrigée avec succès');
  } else {
    console.log('✅ Aucune erreur de syntaxe détectée dans test-toast.jsx');
  }
  
  process.exit(0);
} catch (error) {
  console.error(`❌ Erreur lors de la correction de test-toast.jsx: ${error.message}`);
  process.exit(1);
} 