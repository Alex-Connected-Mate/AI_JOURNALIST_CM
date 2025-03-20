-- Structure principale de l'agent
CREATE TABLE IF NOT EXISTS agents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    image_url text,
    agent_type text NOT NULL, -- 'nuggets' ou 'lightbulbs'
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    is_active boolean DEFAULT true
);

-- Configuration du prompt de l'agent
CREATE TABLE IF NOT EXISTS agent_prompts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
    style jsonb, -- Style sélectionné
    rules jsonb, -- Liste des règles
    questions jsonb, -- Liste des questions
    template_version text,
    base_prompt text, -- Prompt de base
    last_modified timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Configuration de l'analyse
CREATE TABLE IF NOT EXISTS agent_analysis_config (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
    analysis_type text NOT NULL, -- Type d'analyse (sentiment, keywords, etc.)
    parameters jsonb, -- Paramètres spécifiques à l'analyse
    enabled boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Configuration du book
CREATE TABLE IF NOT EXISTS agent_books (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    content jsonb, -- Contenu structuré du book
    settings jsonb, -- Réglages spécifiques au book
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    version integer DEFAULT 1
);

-- Historique des modifications du book
CREATE TABLE IF NOT EXISTS agent_book_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id uuid REFERENCES agent_books(id) ON DELETE CASCADE,
    content jsonb,
    settings jsonb,
    modified_at timestamp with time zone DEFAULT now(),
    modified_by uuid REFERENCES auth.users(id),
    version integer
);

-- Table pour les composants individuels du book
CREATE TABLE IF NOT EXISTS book_components (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    book_id uuid REFERENCES agent_books(id) ON DELETE CASCADE,
    component_type text NOT NULL, -- 'chapter', 'section', 'exercise', etc.
    title text,
    content jsonb,
    order_index integer,
    settings jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Politiques de sécurité
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_analysis_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_book_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_components ENABLE ROW LEVEL SECURITY;

-- Politiques d'accès
CREATE POLICY "Enable read access for all authenticated users" ON agents
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable modification for creators" ON agents
    FOR ALL USING (auth.uid() = created_by);

-- Répéter les politiques similaires pour les autres tables...

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(agent_type);
CREATE INDEX IF NOT EXISTS idx_agent_prompts_agent_id ON agent_prompts(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_analysis_agent_id ON agent_analysis_config(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_books_agent_id ON agent_books(agent_id);
CREATE INDEX IF NOT EXISTS idx_book_components_book_id ON book_components(book_id);

-- Fonction pour mettre à jour le timestamp de modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour la mise à jour automatique des timestamps
CREATE TRIGGER update_agents_modtime
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_books_modtime
    BEFORE UPDATE ON agent_books
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Exemple de structure JSON pour les différents types de données
COMMENT ON COLUMN agent_prompts.style IS 
$comment$
Example structure:
{
    "tone": "professional",
    "formality": "high",
    "engagement": "moderate",
    "custom_settings": {}
}
$comment$;

COMMENT ON COLUMN agent_prompts.rules IS 
$comment$
Example structure:
{
    "rules": [
        {
            "id": "uuid",
            "content": "règle 1",
            "required": true,
            "order": 1
        }
    ]
}
$comment$;

COMMENT ON COLUMN agent_prompts.questions IS 
$comment$
Example structure:
{
    "questions": [
        {
            "id": "uuid",
            "content": "question 1",
            "required": true,
            "order": 1,
            "type": "open"
        }
    ]
}
$comment$;

COMMENT ON COLUMN agent_books.content IS 
$comment$
Example structure:
{
    "chapters": [
        {
            "id": "uuid",
            "title": "Chapitre 1",
            "content": "contenu",
            "exercises": []
        }
    ],
    "metadata": {}
}
$comment$;

COMMENT ON COLUMN agent_analysis_config.parameters IS 
$comment$
Example structure:
{
    "sentiment_analysis": true,
    "keyword_extraction": true,
    "custom_metrics": [],
    "thresholds": {}
}
$comment$; 