/**
 * API endpoint pour récupérer les résultats d'analyse d'une session
 * 
 * Cette API permet de récupérer les analyses globales et individuelles générées
 * pour une session. Seul le propriétaire de la session ou les participants ayant
 * le droit (quand la session est terminée) peuvent accéder aux analyses.
 */

const { supabase } = require('@/lib/supabase');
const { getAnalysisStatus } = require('@/lib/analysisService');

module.exports = async function handler(req, res) {
  // Cette API n'accepte que les méthodes GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Récupérer la session Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    // Vérifier que l'utilisateur est authentifié
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }
    
    // Récupérer les paramètres de la requête
    const { sessionId, analysisType, showAll } = req.query;
    
    // Vérifier que les paramètres requis sont présents
    if (!sessionId) {
      return res.status(400).json({ error: 'ID de session requis' });
    }
    
    // Vérifier que l'analyse est valide (si fournie)
    if (analysisType && !['nuggets', 'lightbulbs', 'overall'].includes(analysisType)) {
      return res.status(400).json({ error: 'Type d\'analyse invalide' });
    }
    
    // Vérifier que l'utilisateur a accès à la session
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id, status')
      .eq('id', sessionId)
      .single();
    
    if (sessionError) {
      console.error('Erreur lors de la récupération de la session:', sessionError);
      return res.status(500).json({ error: 'Erreur lors de la récupération de la session' });
    }
    
    // Vérifier si l'utilisateur est le propriétaire
    const isOwner = sessionData && sessionData.user_id === session.user.id;
    
    // Si l'utilisateur n'est pas le propriétaire, vérifier s'il est participant (et si la session est terminée)
    if (!isOwner) {
      const { data: participantData, error: participantError } = await supabase
        .from('session_participants')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', session.user.id)
        .single();
      
      if (participantError && participantError.code !== 'PGRST116') { // PGRST116 = Not found
        console.error('Erreur lors de la vérification du participant:', participantError);
        return res.status(500).json({ error: 'Erreur lors de la vérification de votre participation' });
      }
      
      const isParticipant = !!participantData;
      const isSessionEnded = sessionData && sessionData.status === 'ended';
      
      // Seuls les participants de sessions terminées peuvent voir les analyses
      if (!isParticipant || !isSessionEnded) {
        return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à accéder à ces analyses' });
      }
    }
    
    // Obtenir le statut d'analyse
    const analysisStatus = await getAnalysisStatus(sessionId);
    
    // Récupérer les analyses globales
    let globalAnalysesQuery = supabase
      .from('global_analyses')
      .select('*')
      .eq('session_id', sessionId);
    
    if (analysisType) {
      globalAnalysesQuery = globalAnalysesQuery.eq('analysis_type', analysisType);
    }
    
    const { data: globalAnalyses, error: globalError } = await globalAnalysesQuery;
    
    if (globalError) {
      console.error('Erreur lors de la récupération des analyses globales:', globalError);
      return res.status(500).json({ error: 'Erreur lors de la récupération des analyses globales' });
    }
    
    // Si showAll est true et que l'utilisateur est le propriétaire, récupérer aussi les analyses individuelles
    let individualAnalyses = null;
    if (showAll === 'true' && isOwner) {
      let individualAnalysesQuery = supabase
        .from('discussion_analyses')
        .select('*')
        .eq('session_id', sessionId);
      
      if (analysisType) {
        individualAnalysesQuery = individualAnalysesQuery.eq('analysis_type', analysisType);
      }
      
      const { data: individualData, error: individualError } = await individualAnalysesQuery;
      
      if (individualError) {
        console.error('Erreur lors de la récupération des analyses individuelles:', individualError);
        return res.status(500).json({ error: 'Erreur lors de la récupération des analyses individuelles' });
      }
      
      individualAnalyses = individualData;
    }
    
    // Répondre avec les analyses récupérées
    return res.status(200).json({
      success: true,
      status: analysisStatus,
      global: globalAnalyses,
      individual: individualAnalyses
    });
  } catch (error) {
    console.error('Erreur lors du traitement de la requête:', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
} 