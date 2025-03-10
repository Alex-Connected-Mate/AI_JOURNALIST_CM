/**
 * openai.js
 * 
 * Service d'intégration avec l'API OpenAI
 * Gère les appels à OpenAI pour les analyses et la génération de contenu
 */

import OpenAI from 'openai';
import { supabase } from './supabase';
import logger from './logger';

// Créer une instance OpenAI
let openai = null;

// Fonction pour initialiser OpenAI avec une clé API fournie
export async function initializeOpenAI(apiKey = null) {
  try {
    // Si une clé API est fournie, l'utiliser directement
    if (apiKey) {
      openai = new OpenAI({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true // Pour le client-side 
      });
      logger.session('OpenAI initialisé avec la clé API fournie');
      return openai;
    }
    
    // Sinon, essayer de récupérer la clé API du .env ou de l'utilisateur connecté
    // Vérifie d'abord la variable d'environnement
    const envApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (envApiKey) {
      openai = new OpenAI({
        apiKey: envApiKey,
        dangerouslyAllowBrowser: true
      });
      logger.session('OpenAI initialisé avec la clé API d\'environnement');
      return openai;
    }
    
    // Essayer de récupérer la clé API de l'utilisateur connecté
    const { data: session } = await supabase.auth.getSession();
    if (session?.user?.id) {
      const { data: userData, error } = await supabase
        .from('users')
        .select('openai_api_key')
        .eq('id', session.user.id)
        .single();
      
      if (error) {
        logger.error('Erreur lors de la récupération de la clé API utilisateur:', error);
        throw new Error('Impossible de récupérer votre clé API');
      }
      
      if (userData?.openai_api_key) {
        openai = new OpenAI({
          apiKey: userData.openai_api_key,
          dangerouslyAllowBrowser: true
        });
        logger.session('OpenAI initialisé avec la clé API de l\'utilisateur');
        return openai;
      }
    }
    
    // Si aucune clé API n'est disponible, utiliser la clé API de secours
    const fallbackApiKey = process.env.NEXT_PUBLIC_OPENAI_FALLBACK_API_KEY;
    if (fallbackApiKey) {
      openai = new OpenAI({
        apiKey: fallbackApiKey,
        dangerouslyAllowBrowser: true
      });
      logger.session('OpenAI initialisé avec la clé API de secours');
      return openai;
    }
    
    throw new Error('Aucune clé API OpenAI disponible');
  } catch (error) {
    logger.error('Erreur lors de l\'initialisation d\'OpenAI:', error);
    throw error;
  }
}

// Fonction pour tester la validité d'une clé API
export async function testApiKey(apiKey) {
  try {
    const testOpenAI = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });
    
    // Effectuer un appel simple pour vérifier que la clé fonctionne
    const completion = await testOpenAI.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello world' }],
      max_tokens: 5
    });
    
    return { 
      valid: true, 
      modelName: completion.model, 
      responseText: completion.choices[0]?.message?.content || '' 
    };
  } catch (error) {
    logger.error('Erreur lors du test de la clé API:', error);
    
    return { 
      valid: false, 
      error: error.message,
      status: error.status,
      type: error.type
    };
  }
}

// Initialiser OpenAI par défaut
if (typeof window !== 'undefined') {
  initializeOpenAI().catch(error => {
    logger.error('Échec de l\'initialisation par défaut d\'OpenAI:', error);
  });
}

export { openai };

export default {
  openai,
  initializeOpenAI,
  testApiKey
}; 