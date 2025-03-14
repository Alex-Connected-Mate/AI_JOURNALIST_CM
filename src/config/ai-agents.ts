/**
 * Configuration par défaut pour les agents AI
 * Centralise les valeurs par défaut pour les prompts et images des agents
 */

// Structure d'un agent AI
export interface AIAgent {
  agentName: string;
  prompt: string;
  imageUrl: string;
  model: "gpt-4" | "gpt-3.5-turbo";
  temperature: number;
}

export const DEFAULT_AGENT_IMAGES = {
  nuggets: "https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent//elias.png",
  lightbulbs: "https://ukmxqoazpujsvqmkzkpz.supabase.co/storage/v1/object/public/ai-agent//sonia.png"
};

// Configuration par défaut pour l'agent AI Nuggets
export const DEFAULT_NUGGETS_AGENT: AIAgent = {
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
  temperature: 0.7
};

// Configuration par défaut pour l'agent AI Lightbulbs
export const DEFAULT_LIGHTBULBS_AGENT: AIAgent = {
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
  temperature: 0.8
};

// Configuration globale par défaut
export const DEFAULT_AI_CONFIGURATION = {
  timerEnabled: true,
  timerDuration: 5, // minutes
  nuggets: DEFAULT_NUGGETS_AGENT,
  lightbulbs: DEFAULT_LIGHTBULBS_AGENT
};

export default DEFAULT_AI_CONFIGURATION;
