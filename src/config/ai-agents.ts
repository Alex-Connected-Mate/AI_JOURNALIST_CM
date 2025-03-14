/**
 * Configuration par défaut pour les agents AI
 * Centralise les valeurs par défaut pour les prompts et images des agents
 */

// Structure d'un agent AI
export interface AIAgent {
  // Configuration de base
  agentName: string;
  prompt: string;
  imageUrl: string;
  model: "gpt-4" | "gpt-3.5-turbo";
  temperature: number;
  
  // Paramètres d'analyse des conversations
  analysisCriteria?: string;
  analysisInstructions?: string;
  responseFormat?: 'bullet' | 'paragraph' | 'structured';
  summarizeConversation?: boolean;
  includeParticipantInfo?: boolean;
}

export const DEFAULT_AGENT_IMAGES = {
  nuggets: "https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent//elias.png",
  lightbulbs: "https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent//sonia.png"
};

// Configuration par défaut pour l'agent AI Nuggets
export const DEFAULT_NUGGETS_AGENT: AIAgent = {
  // Configuration de base
  agentName: "Elias (AI Nuggets)",
  prompt: `Je suis Elias, un agent AI spécialisé dans l'identification et l'extraction des "nuggets" (pépites) d'information pertinentes lors d'une discussion.

Mon rôle est d'identifier les informations importantes, les insights pertinents et les concepts clés qui émergent dans les discussions. 

Je vais:
- Extraire les idées et concepts de haute valeur 
- Résumer les points clés
- Identifier les tendances et patterns
- Mettre en évidence les connexions entre différentes idées
- Présenter l'information de manière claire et concise

Je reste objectif et factuel, en me concentrant sur la substance des discussions plutôt que sur la forme.`,
  imageUrl: DEFAULT_AGENT_IMAGES.nuggets,
  model: "gpt-4",
  temperature: 0.7,
  
  // Paramètres d'analyse par défaut
  analysisCriteria: `Critères d'extraction des "nuggets" d'information:
- Informations ayant un impact stratégique sur le business
- Insights originaux ou non évidents
- Données chiffrées ou statistiques significatives
- Tendances émergentes identifiées
- Connexions entre différents concepts ou idées
- Opportunités ou risques stratégiques mentionnés`,
  
  analysisInstructions: `Instructions pour l'analyse des conversations et l'extraction des nuggets:

1. Considérer le contexte global de la discussion
2. Identifier les assertions importantes, distinctes des opinions personnelles
3. Prioriser les informations nouvelles ou non évidentes
4. Extraire les données chiffrées ou faits concrets
5. Structurer les informations par ordre d'importance
6. Présenter les nuggets de manière objective et factuelle
7. Ajouter un court commentaire explicatif si nécessaire pour chaque nugget`,
  
  responseFormat: 'bullet',
  summarizeConversation: true,
  includeParticipantInfo: false
};

// Configuration par défaut pour l'agent AI Lightbulbs
export const DEFAULT_LIGHTBULBS_AGENT: AIAgent = {
  // Configuration de base
  agentName: "Sonia (AI Lightbulbs)",
  prompt: `Je suis Sonia, un agent AI spécialisé dans le développement d'idées créatives et l'identification d'innovations potentielles.

Mon rôle est d'aider à explorer des perspectives nouvelles, développer des concepts innovants, et identifier des opportunités de développement basées sur les discussions.

Je vais:
- Proposer des développements créatifs aux idées existantes
- Identifier des applications potentielles non explorées
- Suggérer des connexions inattendues entre différents concepts
- Encourager la pensée latérale et l'innovation
- Fournir des perspectives alternatives sur les sujets abordés

Je favorise la créativité et l'innovation tout en restant pertinent par rapport au contexte de la discussion.`,
  imageUrl: DEFAULT_AGENT_IMAGES.lightbulbs,
  model: "gpt-4",
  temperature: 0.8,
  
  // Paramètres d'analyse par défaut
  analysisCriteria: `Critères pour le développement des idées créatives:
- Concepts ayant un potentiel d'innovation disruptive
- Idées pouvant être développées ou transformées
- Opportunités de connexions interdisciplinaires
- Insights pouvant mener à de nouvelles solutions
- Problématiques complexes nécessitant des approches créatives
- Perspectives alternatives ou non explorées`,
  
  analysisInstructions: `Instructions pour l'analyse des conversations et le développement d'idées:

1. Identifier les concepts centraux de la discussion
2. Rechercher des connexions non évidentes entre les idées
3. Élargir les idées existantes avec des perspectives nouvelles
4. Proposer des applications concrètes et réalisables
5. Suggérer des améliorations ou alternatives aux concepts évoqués
6. Inclure des exemples illustratifs ou cas d'usage si pertinent
7. Balancer créativité et faisabilité dans les propositions`,
  
  responseFormat: 'structured',
  summarizeConversation: true,
  includeParticipantInfo: true
};

export interface AnalysisItem {
  id: string;
  type: 'nuggets' | 'lightbulbs' | 'global';
  enabled: boolean;
  title: string;
  description: string;
}

export interface FinalAnalysisConfig {
  items: AnalysisItem[];
}

// Configuration globale par défaut
export const DEFAULT_AI_CONFIGURATION = {
  timerEnabled: true,
  timerDuration: 10,
  finalAnalysis: {
    items: [
      { id: 'nuggets-analysis', type: 'nuggets', enabled: true, title: 'Analyse AI Nuggets', description: 'Analyse des informations extraites par l\'agent AI Nuggets' },
      { id: 'lightbulbs-analysis', type: 'lightbulbs', enabled: true, title: 'Analyse AI Lightbulbs', description: 'Analyse des idées créatives développées par l\'agent AI Lightbulbs' },
      { id: 'global-analysis', type: 'global', enabled: true, title: 'Analyse Globale', description: 'Synthèse combinant les insights des deux agents' }
    ]
  },
  nuggets: DEFAULT_NUGGETS_AGENT,
  lightbulbs: DEFAULT_LIGHTBULBS_AGENT
};

export default DEFAULT_AI_CONFIGURATION;
