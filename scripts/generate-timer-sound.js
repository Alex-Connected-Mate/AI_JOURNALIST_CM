// Ce script utilise node et fs pour copier un fichier audio existant ou générer un placeholder pour le son de fin de timer
// Il est exécuté manuellement avec `node scripts/generate-timer-sound.js`

const fs = require('fs');
const path = require('path');

// Chemin vers le dossier public/sounds
const soundsDir = path.join(__dirname, '../public/sounds');

// S'assurer que le dossier existe
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
  console.log(`Dossier créé: ${soundsDir}`);
}

// Créer un fichier texte pour expliquer comment ajouter un vrai fichier audio
const placeholderPath = path.join(soundsDir, 'README.txt');
const timerEndPath = path.join(soundsDir, 'timer-end.mp3');

fs.writeFileSync(placeholderPath, `
Pour utiliser de vrais sons dans l'application:
1. Renommez votre fichier audio en 'timer-end.mp3'
2. Placez-le dans ce dossier (public/sounds/)
3. Redémarrez l'application

Note: Le fichier placeholder timer-end.mp3 est vide. Remplacez-le par un vrai fichier audio.
`);

// Créer un fichier MP3 vide (placeholder)
if (!fs.existsSync(timerEndPath)) {
  // On crée un fichier vide juste pour que les chemins de l'application soient valides
  fs.writeFileSync(timerEndPath, '');
  console.log(`Fichier placeholder créé: ${timerEndPath}`);
}

console.log('Terminé! Remplacez le placeholder par un vrai fichier audio au besoin.'); 