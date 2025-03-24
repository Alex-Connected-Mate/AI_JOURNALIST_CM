/**
 * API endpoint pour lancer l'analyse d'une session
 * 
 * Cette API permet au professeur de lancer l'analyse d'une session
 * Les analyses sont générées pour chaque discussion, puis une analyse globale est créée
 */

const { supabase } = require('@/lib/supabase');
const { runSessionAnalysis } = require('@/lib/analysisService');

module.exports = async function handler(req, res) {
  // Cette API n'accepte que les méthodes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Récupérer la session Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    // Vérifier que l'utilisateur est authentifié
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Authentification requise' });
    }
    
    // Récupérer les données de la requête
    const { sessionId, analysisType, config } = req.body;
    
    // Vérifier que les paramètres requis sont présents
    if (!sessionId) {
      return res.status(400).json({ error: 'ID de session requis' });
    }
    
    if (!analysisType || !['nuggets', 'lightbulbs'].includes(analysisType)) {
      return res.status(400).json({ error: 'Type d\'analyse invalide' });
    }
    
    // Vérifier que l'utilisateur est le propriétaire de la session
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('user_id')
      .eq('id', sessionId)
      .single();
    
    if (sessionError) {
      console.error('Erreur lors de la récupération de la session:', sessionError);
      return res.status(500).json({ error: 'Erreur lors de la récupération de la session' });
    }
    
    if (!sessionData || sessionData.user_id !== session.user.id) {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à analyser cette session' });
    }
    
    // Mettre à jour le statut de la session
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        analysis_status: 'queued',
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    if (updateError) {
      console.error('Erreur lors de la mise à jour du statut de la session:', updateError);
      return res.status(500).json({ error: 'Erreur lors de la mise à jour du statut de la session' });
    }
    
    // Lancer l'analyse de manière asynchrone
    // Note: Cela permettra à l'API de répondre immédiatement et l'analyse se poursuivra en arrière-plan
    runSessionAnalysis(sessionId, analysisType, config || {})
      .then(result => {
        console.log(`Analyse de session ${sessionId} terminée:`, result);
        
        // Envoyer une notification au professeur (dans une implémentation complète)
        // ...
      })
      .catch(error => {
        console.error(`Erreur lors de l'analyse de la session ${sessionId}:`, error);
        
        // Mettre à jour le statut de la session en cas d'erreur
        supabase
          .from('sessions')
          .update({
            analysis_status: 'failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId)
          .then(() => console.log('Statut mis à jour: échec'))
          .catch(e => console.error('Erreur lors de la mise à jour du statut:', e));
      });
    
    // Répondre immédiatement que l'analyse a été mise en file d'attente
    return res.status(202).json({
      success: true,
      message: 'Analyse mise en file d\'attente',
      sessionId,
      analysisType
    });
  } catch (error) {
    console.error('Erreur lors du traitement de la requête:', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
} 