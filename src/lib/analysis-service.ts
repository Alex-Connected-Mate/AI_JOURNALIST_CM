import { AIAgent } from '@/config/ai-agents';

/**
 * Interfaces pour les résultats d'analyse
 */
export interface AnalysisResult {
  title: string;
  content: string;
  insights: string[];
  tags?: string[];
}

/**
 * Service d'analyse pour générer les insights à partir des conversations
 */
export class AnalysisService {
  /**
   * Analyse les conversations de l'agent AI Nuggets
   */
  static async generateNuggetsAnalysis(
    agentConfig: AIAgent,
    conversations: { participantId: string; messages: any[] }[],
  ): Promise<AnalysisResult> {
    // Ici, dans une implémentation réelle, nous ferions une requête à l'API OpenAI
    // Pour l'instant, nous renverrons des données simulées
    
    return {
      title: "Analyse AI Nuggets",
      content: `Basé sur les conversations avec l'agent ${agentConfig.agentName}, voici les informations clés qui ont été extraites des discussions avec les participants.`,
      insights: [
        "Les participants ont identifié des opportunités d'innovation dans le domaine de la logistique durable.",
        "Plusieurs stratégies de pénétration de marché ont été évoquées, notamment l'utilisation de partenariats stratégiques.",
        "Des défis récurrents liés à l'adoption technologique ont été mentionnés par plusieurs participants.",
        "La personnalisation de l'expérience client est apparue comme un facteur différenciant crucial pour plusieurs business models présentés.",
        "L'analyse des données a été citée comme un levier stratégique sous-exploité par la plupart des participants."
      ],
      tags: ["innovation", "stratégie", "expérience client", "données", "adoption technologique"]
    };
  }

  /**
   * Analyse les conversations de l'agent AI Lightbulbs
   */
  static async generateLightbulbsAnalysis(
    agentConfig: AIAgent,
    conversations: { participantId: string; messages: any[] }[],
  ): Promise<AnalysisResult> {
    // Simulation de données pour l'analyse lightbulbs
    
    return {
      title: "Analyse AI Lightbulbs",
      content: `L'agent ${agentConfig.agentName} a développé plusieurs idées créatives en collaboration avec les participants. Voici les concepts les plus prometteurs.`,
      insights: [
        "Création d'une plateforme communautaire d'échange de compétences basée sur une monnaie alternative.",
        "Développement d'un système de micro-apprentissage intégré dans les moments d'attente quotidiens.",
        "Conception d'un outil de visualisation des impacts environnementaux des choix de consommation.",
        "Élaboration d'un réseau de partage de ressources inutilisées entre entreprises d'un même secteur.",
        "Système de gamification pour encourager les comportements écologiques en entreprise."
      ],
      tags: ["innovation sociale", "micro-apprentissage", "durabilité", "économie circulaire", "gamification"]
    };
  }

  /**
   * Génère une analyse globale combinant les insights des deux agents
   */
  static async generateGlobalAnalysis(
    nuggetsAnalysis: AnalysisResult,
    lightbulbsAnalysis: AnalysisResult
  ): Promise<AnalysisResult> {
    // Dans une implémentation réelle, nous pourrions utiliser LLM pour synthétiser les deux analyses
    // Pour l'instant, nous combinerons manuellement certains éléments
    
    const combinedInsights = [
      "Synthèse des principales tendances identifiées dans les discussions.",
      "Les sujets de durabilité et d'innovation sociale apparaissent comme des préoccupations transversales.",
      "L'exploitation des données et la personnalisation représentent des opportunités stratégiques majeures.",
      "Les modèles d'affaires basés sur l'économie circulaire et le partage de ressources montrent un fort potentiel.",
      "L'intégration de mécanismes d'engagement (gamification, micro-interactions) est une piste prometteuse pour plusieurs secteurs."
    ];
    
    // Combiner les tags des deux analyses et supprimer les doublons
    const allTags = [...(nuggetsAnalysis.tags || []), ...(lightbulbsAnalysis.tags || [])];
    const uniqueTags = Array.from(new Set(allTags));
    
    return {
      title: "Analyse Globale de la Session",
      content: `Cette synthèse combine les informations clés identifiées par AI Nuggets et les idées créatives développées par AI Lightbulbs pour offrir une vision holistique des discussions.`,
      insights: combinedInsights,
      tags: uniqueTags
    };
  }

  /**
   * Génère toutes les analyses nécessaires pour la présentation finale
   */
  static async generateAllAnalyses(
    nuggetsConfig: AIAgent,
    lightbulbsConfig: AIAgent,
    conversations: {
      nuggets: { participantId: string; messages: any[] }[];
      lightbulbs: { participantId: string; messages: any[] }[];
    }
  ): Promise<{
    nuggets: AnalysisResult;
    lightbulbs: AnalysisResult;
    global: AnalysisResult;
  }> {
    // Générer les analyses individuelles
    const nuggetsAnalysis = await this.generateNuggetsAnalysis(
      nuggetsConfig,
      conversations.nuggets
    );
    
    const lightbulbsAnalysis = await this.generateLightbulbsAnalysis(
      lightbulbsConfig,
      conversations.lightbulbs
    );
    
    // Générer l'analyse globale
    const globalAnalysis = await this.generateGlobalAnalysis(
      nuggetsAnalysis,
      lightbulbsAnalysis
    );
    
    return {
      nuggets: nuggetsAnalysis,
      lightbulbs: lightbulbsAnalysis,
      global: globalAnalysis
    };
  }
} 