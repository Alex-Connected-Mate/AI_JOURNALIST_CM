/**
 * Fichier de compatibilité pour les imports CommonJS
 * Ce module réexporte simplement les fonctions définies dans supabaseClient.ts
 * pour garantir la compatibilité entre les différents types de modules
 */

// Importer depuis le fichier TypeScript
const { createClient, useSupabase } = require('./supabaseClient.ts');

// Exporter pour les modules CommonJS
module.exports = {
  createClient,
  useSupabase
}; 