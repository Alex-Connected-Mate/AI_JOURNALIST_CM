/**
 * analysisService.js
 * 
 * Service responsable de l'analyse des discussions et de la génération d'insights
 * Comporte deux niveaux d'analyse:
 * 1. Analyse individuelle des discussions
 * 2. Analyse globale des insights générés
 */

const { supabase } = require('./supabase');
const { openai } = require('./openai');
const logger = require('./logger');

/**
 * Construit le prompt pour l'analyse d'une discussion individuelle
 */
function buildDiscussionAnalysisPrompt(messages, analysisType, rules) {
  const messagesText = messages.map(msg => 
    `[${msg.is_ai ? 'IA' : 'Participant'}]: ${msg.content}`
  ).join('\n\n');

  let prompt = '';
  
  if (analysisType === 'nuggets') {
    prompt = `
    Tu es un expert en analyse de discussions. Ton rôle est d'extraire les insights clés (nuggets) de cette conversation.
    
    Règles d'analyse:
    ${rules.focusOnKeyInsights ? '- Identifie les idées principales et les points clés\n' : ''}
    ${rules.discoverPatterns ? '- Repère les modèles et tendances dans le discours\n' : ''}
    ${rules.quoteRelevantExamples ? '- Cite des exemples pertinents de la discussion\n' : ''}
    ${rules.customRules ? `- Règles personnalisées: ${rules.customRules}\n` : ''}
    
    Format de réponse:
    1. Résumé (3-5 phrases)
    2. Points clés (3-5 points)
    3. Citations importantes (2-3 citations)
    4. Observations additionnelles
    
    Conversation:
    ${messagesText}
    `;
  } else if (analysisType === 'lightbulbs') {
    prompt = `
    Tu es un expert en innovation et créativité. Ton rôle est d'identifier les idées innovantes et créatives (lightbulbs) de cette conversation.
    
    Règles d'analyse:
    ${rules.captureInnovativeThinking ? '- Identifie les idées innovantes et créatives\n' : ''}
    ${rules.identifyCrossPollination ? '- Repère les connexions entre différents domaines\n' : ''}
    ${rules.evaluatePracticalApplications ? '- Évalue les applications pratiques des idées\n' : ''}
    ${rules.customRules ? `- Règles personnalisées: ${rules.customRules}\n` : ''}
    
    Format de réponse:
    1. Idées innovantes (3-5 idées)
    2. Potentiel d'application (pour chaque idée)
    3. Connexions interdisciplinaires
    4. Recommandations pour développement futur
    
    Conversation:
    ${messagesText}
    `;
  } else {
    prompt = `
    Tu es un expert en analyse de conversations. Ton rôle est d'analyser cette discussion et d'en extraire les éléments importants.
    
    Conversation:
    ${messagesText}
    
    Analyse cette conversation et fournit:
    1. Résumé
    2. Points clés
    3. Insights notables
    `;
  }
  
  return prompt;
}

/**
 * Construit le prompt pour l'analyse globale de plusieurs discussions
 */
function buildGlobalAnalysisPrompt(individualAnalyses, analysisType, rules) {
  const analysesText = individualAnalyses.map((analysis, index) => 
    `ANALYSE #${index + 1}:\n${analysis.content}`
  ).join('\n\n---\n\n');

  let prompt = '';
  
  if (analysisType === 'nuggets') {
    prompt = `
    Tu es un expert en synthèse d'information. Ton rôle est de créer une synthèse globale à partir de multiples analyses individuelles de discussions.
    
    Règles d'analyse globale:
    ${rules.synthesizeAllInsights ? '- Synthétise l\'ensemble des insights\n' : ''}
    ${rules.extractActionableRecommendations ? '- Extrait des recommandations actionnables\n' : ''}
    ${rules.provideSessionSummary ? '- Fournit un résumé global de la session\n' : ''}
    ${rules.customRules ? `- Règles personnalisées: ${rules.customRules}\n` : ''}
    
    Format de réponse:
    1. Résumé global (5-7 phrases)
    2. Thèmes principaux (5-7 thèmes)
    3. Points de convergence
    4. Points de divergence
    5. Recommandations
    
    Analyses individuelles:
    ${analysesText}
    `;
  } else if (analysisType === 'lightbulbs') {
    prompt = `
    Tu es un expert en innovation. Ton rôle est de créer une synthèse des idées innovantes (lightbulbs) identifiées dans plusieurs discussions.
    
    Format de réponse:
    1. Innovations majeures (5-7 innovations)
    2. Potentiel de disruption
    3. Connexions entre les idées
    4. Recommandations pour développement
    5. Prochaines étapes suggérées
    
    Analyses individuelles:
    ${analysesText}
    `;
  } else {
    prompt = `
    Tu es un expert en synthèse d'information. Ton rôle est de créer une synthèse globale à partir de multiples analyses.
    
    Analyses individuelles:
    ${analysesText}
    
    Synthétise ces analyses et fournit:
    1. Résumé global
    2. Thèmes principaux
    3. Insights majeurs
    4. Recommandations
    `;
  }
  
  return prompt;
}

/**
 * Analyse une discussion individuelle
 * @param {string} discussionId - ID de la discussion
 * @param {string} analysisType - Type d'analyse ('nuggets', 'lightbulbs', etc.)
 * @param {object} rules - Règles d'analyse
 */
module.exports.analyzeDiscussion = async function(discussionId, analysisType, rules) {
  try {
    logger.session(`Début d'analyse de discussion: ${discussionId} (type: ${analysisType})`);
    
    // Récupérer tous les messages de la discussion
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('discussion_id', discussionId)
      .order('created_at', { ascending: true });
    
    if (messagesError) {
      logger.error(`Erreur lors de la récupération des messages: ${messagesError.message}`);
      throw messagesError;
    }
    
    if (!messages || messages.length === 0) {
      logger.warning(`Aucun message trouvé pour la discussion ${discussionId}`);
      return {
        error: 'No messages found'
      };
    }
    
    // Construire le prompt pour l'analyse
    const prompt = buildDiscussionAnalysisPrompt(messages, analysisType, rules);
    
    // Appeler OpenAI pour l'analyse
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Tu es un expert en analyse de discussions, spécialisé dans l'extraction d'insights et la synthèse d'informations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });
    
    const analysisContent = completion.choices[0].message.content;
    
    // Sauvegarder l'analyse dans Supabase
    const { data: analysis, error: analysisError } = await supabase
      .from('discussion_analyses')
      .insert({
        discussion_id: discussionId,
        analysis_type: analysisType,
        content: analysisContent,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (analysisError) {
      logger.error(`Erreur lors de la sauvegarde de l'analyse: ${analysisError.message}`);
      throw analysisError;
    }
    
    logger.session(`Analyse de discussion terminée avec succès: ${discussionId}`);
    return analysis;
  } catch (error) {
    logger.error(`Erreur lors de l'analyse de discussion: ${error.message}`, error);
    throw error;
  }
}

/**
 * Analyse globale des discussions pour une session
 * @param {string} sessionId - ID de la session
 * @param {string} analysisType - Type d'analyse ('nuggets', 'lightbulbs', etc.)
 * @param {object} rules - Règles d'analyse globale
 */
module.exports.createGlobalAnalysis = async function(sessionId, analysisType, rules) {
  try {
    logger.session(`Début d'analyse globale pour la session: ${sessionId} (type: ${analysisType})`);
    
    // Récupérer toutes les analyses individuelles
    const { data: individualAnalyses, error: analysesError } = await supabase
      .from('discussion_analyses')
      .select('*')
      .eq('session_id', sessionId)
      .eq('analysis_type', analysisType);
    
    if (analysesError) {
      logger.error(`Erreur lors de la récupération des analyses: ${analysesError.message}`);
      throw analysesError;
    }
    
    if (!individualAnalyses || individualAnalyses.length === 0) {
      logger.warning(`Aucune analyse individuelle trouvée pour la session ${sessionId}`);
      return {
        error: 'No individual analyses found'
      };
    }
    
    // Construire le prompt pour l'analyse globale
    const globalPrompt = buildGlobalAnalysisPrompt(individualAnalyses, analysisType, rules);
    
    // Appeler OpenAI pour l'analyse globale
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Tu es un expert en synthèse d'informations, spécialisé dans l'agrégation d'analyses et la génération d'insights globaux."
        },
        {
          role: "user",
          content: globalPrompt
        }
      ],
      temperature: 0.5,
      max_tokens: 2000
    });
    
    const globalAnalysisContent = completion.choices[0].message.content;
    
    // Sauvegarder l'analyse globale
    const { data: globalAnalysis, error: globalAnalysisError } = await supabase
      .from('global_analyses')
      .insert({
        session_id: sessionId,
        analysis_type: analysisType,
        content: globalAnalysisContent,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (globalAnalysisError) {
      logger.error(`Erreur lors de la sauvegarde de l'analyse globale: ${globalAnalysisError.message}`);
      throw globalAnalysisError;
    }
    
    logger.session(`Analyse globale terminée avec succès: ${sessionId}`);
    return globalAnalysis;
  } catch (error) {
    logger.error(`Erreur lors de l'analyse globale: ${error.message}`, error);
    throw error;
  }
}

/**
 * Lance l'analyse complète d'une session (analyses individuelles puis globale)
 * @param {string} sessionId - ID de la session
 * @param {string} analysisType - Type d'analyse ('nuggets', 'lightbulbs')
 * @param {object} config - Configuration d'analyse
 * @param {function} progressCallback - Fonction de callback pour suivre la progression
 */
module.exports.runSessionAnalysis = async function(sessionId, analysisType, config, progressCallback) {
  try {
    logger.session(`Démarrage de l'analyse complète pour la session: ${sessionId}`);
    
    // Récupérer toutes les discussions de la session
    const { data: discussions, error: discussionsError } = await supabase
      .from('discussions')
      .select('*')
      .eq('session_id', sessionId);
    
    if (discussionsError) {
      logger.error(`Erreur lors de la récupération des discussions: ${discussionsError.message}`);
      throw discussionsError;
    }
    
    if (!discussions || discussions.length === 0) {
      logger.warning(`Aucune discussion trouvée pour la session ${sessionId}`);
      return {
        error: 'No discussions found'
      };
    }
    
    const totalDiscussions = discussions.length;
    let completedDiscussions = 0;
    
    // Mettre à jour l'état d'analyse dans la session
    await supabase
      .from('sessions')
      .update({
        analysis_status: 'in_progress',
        analysis_progress: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    // Analyser chaque discussion individuellement
    for (const discussion of discussions) {
      try {
        // Analyser la discussion
        await analyzeDiscussion(discussion.id, analysisType, config[`${analysisType}Rules`] || {});
        
        // Mettre à jour la progression
        completedDiscussions++;
        const progress = Math.round((completedDiscussions / totalDiscussions) * 100);
        
        // Mettre à jour la base de données
        await supabase
          .from('sessions')
          .update({
            analysis_progress: progress,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);
        
        // Appeler le callback de progression
        if (progressCallback) {
          progressCallback({
            type: 'discussion_analysis',
            sessionId,
            analysisType,
            total: totalDiscussions,
            completed: completedDiscussions,
            progress
          });
        }
        
        logger.session(`Progression de l'analyse: ${completedDiscussions}/${totalDiscussions} (${progress}%)`);
      } catch (error) {
        logger.error(`Erreur lors de l'analyse de la discussion ${discussion.id}: ${error.message}`);
        // Continuer avec les autres discussions malgré l'erreur
      }
    }
    
    // Créer l'analyse globale
    if (completedDiscussions > 0) {
      // Notifier le début de l'analyse globale
      if (progressCallback) {
        progressCallback({
          type: 'global_analysis_started',
          sessionId,
          analysisType
        });
      }
      
      // Effectuer l'analyse globale
      const globalAnalysis = await createGlobalAnalysis(
        sessionId, 
        analysisType, 
        config[`${analysisType === 'nuggets' ? 'overallRules' : 'lightbulbsRules'}`] || {}
      );
      
      // Marquer l'analyse comme terminée
      await supabase
        .from('sessions')
        .update({
          analysis_status: 'completed',
          analysis_progress: 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      // Notifier la fin de l'analyse
      if (progressCallback) {
        progressCallback({
          type: 'analysis_completed',
          sessionId,
          analysisType,
          globalAnalysisId: globalAnalysis?.id
        });
      }
      
      logger.session(`Analyse complète terminée pour la session: ${sessionId}`);
      return { success: true, globalAnalysis };
    } else {
      // Marquer l'analyse comme échouée
      await supabase
        .from('sessions')
        .update({
          analysis_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      
      logger.error(`Échec de l'analyse pour la session ${sessionId}: aucune discussion analysée`);
      return { success: false, error: 'Aucune discussion analysée avec succès' };
    }
  } catch (error) {
    logger.error(`Erreur lors de l'analyse de session: ${error.message}`, error);
    
    // Marquer l'analyse comme échouée
    await supabase
      .from('sessions')
      .update({
        analysis_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    throw error;
  }
}

/**
 * Vérifie l'état d'avancement de l'analyse d'une session
 * @param {string} sessionId - ID de la session
 */
module.exports.getAnalysisStatus = async function(sessionId) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('analysis_status, analysis_progress')
      .eq('id', sessionId)
      .single();
    
    if (error) {
      logger.error(`Erreur lors de la récupération du statut d'analyse: ${error.message}`);
      throw error;
    }
    
    return {
      status: data.analysis_status || 'not_started',
      progress: data.analysis_progress || 0
    };
  } catch (error) {
    logger.error(`Erreur lors de la vérification du statut d'analyse: ${error.message}`);
    throw error;
  }
}

module.exports = {
  analyzeDiscussion,
  createGlobalAnalysis,
  runSessionAnalysis,
  getAnalysisStatus
}; 