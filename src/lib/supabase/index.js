const { supabase, getCurrentUser, getCurrentSession, signOut } = require('./client');

/**
 * Réutilise les fonctions exportées par client.js
 */
module.exports = { supabase, getCurrentUser, getCurrentSession, signOut,  };

/**
 * Récupère les détails d'une session par ID
 * @param {string} sessionId - L'ID de la session à récupérer
 * @returns {Promise<Object>} Données de la session et éventuelles erreurs
 */
const getSessionById = async (sessionId) => {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  
  return { data, error };
};

/**
 * Crée une nouvelle session
 * @param {Object} sessionData - Les données de la session à créer
 * @returns {Promise<Object>} Résultat de l'opération
 */
const createSession = async (sessionData) => {
  const { data, error } = await supabase
    .rpc('create_session_secure', {
      p_title: sessionData.title,
      p_description: sessionData.description || '',
      p_settings: sessionData.settings || {},
      p_max_participants: sessionData.max_participants || 30
    });
  
  return { data, error };
};

/**
 * Génère un code de session unique de 6 caractères
 * @returns {string} Code de session
 */
const generateSessionCode = () => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

/**
 * Valide les données d'une session
 * @param {Object} sessionData - Les données de session à valider
 * @returns {Object} Résultat de la validation avec propriété valid
 */
const validateSessionData = (sessionData) => {
  const errors = {};
  
  if (!sessionData.name || sessionData.name.trim() === '') {
    errors.name = 'Le nom de la session est requis';
  }
  
  if (!sessionData.host_name || sessionData.host_name.trim() === '') {
    errors.host_name = 'Le nom de l\'organisateur est requis';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Type SessionData pour TypeScript
 * @typedef {Object} SessionData
 * @property {string} name - Nom de la session
 * @property {string} host_name - Nom de l'organisateur
 * @property {string} topic - Sujet de la session
 * @property {number} max_participants - Nombre maximum de participants
 * @property {string} discussion_instructions - Instructions pour la discussion
 * @property {string} voting_instructions - Instructions pour le vote
 */ 

module.exports = { getSessionById, createSession, generateSessionCode, validateSessionData };
