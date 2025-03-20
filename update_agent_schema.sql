-- Mise à jour de la table agent_prompts pour inclure les nouvelles configurations
ALTER TABLE agent_prompts
ADD COLUMN IF NOT EXISTS style jsonb,
ADD COLUMN IF NOT EXISTS rules jsonb,
ADD COLUMN IF NOT EXISTS questions jsonb,
ADD COLUMN IF NOT EXISTS template_version text,
ADD COLUMN IF NOT EXISTS last_modified timestamp with time zone DEFAULT now();

-- Table pour stocker les styles prédéfinis
CREATE TABLE IF NOT EXISTS agent_styles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_type text NOT NULL,
    name text NOT NULL,
    description text,
    style_config jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Table pour stocker l'historique des configurations
CREATE TABLE IF NOT EXISTS agent_config_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id uuid REFERENCES agent_prompts(id),
    style jsonb,
    rules jsonb,
    questions jsonb,
    template_version text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Ajout des styles prédéfinis pour Nuggets (Elias)
INSERT INTO agent_styles (agent_type, name, description, style_config) VALUES
('nuggets', 'Professional', 'Style professionnel et formel pour l''engagement des participants', 
    '{"tone": "professional", "formality": "high", "engagement": "moderate"}'),
('nuggets', 'Friendly and Casual', 'Style amical et décontracté pour une atmosphère détendue', 
    '{"tone": "friendly", "formality": "low", "engagement": "high"}'),
('nuggets', 'Academic', 'Style académique pour une approche structurée et éducative', 
    '{"tone": "academic", "formality": "high", "engagement": "moderate"}'),
('nuggets', 'Motivating Coach', 'Style coach motivant pour encourager la participation', 
    '{"tone": "motivational", "formality": "moderate", "engagement": "high"}');

-- Ajout des styles prédéfinis pour Lightbulbs (Sonia)
INSERT INTO agent_styles (agent_type, name, description, style_config) VALUES
('lightbulbs', 'Creative and Inspiring', 'Style créatif pour stimuler l''innovation', 
    '{"tone": "creative", "formality": "moderate", "engagement": "high"}'),
('lightbulbs', 'Analytical and Structured', 'Style analytique pour une approche méthodique', 
    '{"tone": "analytical", "formality": "high", "engagement": "moderate"}'),
('lightbulbs', 'Collaborative and Encouraging', 'Style collaboratif pour favoriser les échanges', 
    '{"tone": "collaborative", "formality": "moderate", "engagement": "high"}'),
('lightbulbs', 'Visionary', 'Style visionnaire pour inspirer de nouvelles perspectives', 
    '{"tone": "visionary", "formality": "moderate", "engagement": "high"}');

-- Création des politiques de sécurité
ALTER TABLE agent_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_config_history ENABLE ROW LEVEL SECURITY;

-- Politiques pour agent_styles
CREATE POLICY "Enable read access for all users" ON agent_styles
    FOR SELECT USING (true);

-- Politiques pour agent_config_history
CREATE POLICY "Enable insert for authenticated users only" ON agent_config_history
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    
CREATE POLICY "Enable read access for owners" ON agent_config_history
    FOR SELECT USING (auth.uid() = created_by);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_agent_prompts_template_version ON agent_prompts(template_version);
CREATE INDEX IF NOT EXISTS idx_agent_styles_type_name ON agent_styles(agent_type, name);
CREATE INDEX IF NOT EXISTS idx_agent_config_history_agent_id ON agent_config_history(agent_id);

-- Fonction pour sauvegarder l'historique des configurations
CREATE OR REPLACE FUNCTION save_agent_config_history()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO agent_config_history (
        agent_id,
        style,
        rules,
        questions,
        template_version,
        created_by
    ) VALUES (
        NEW.id,
        NEW.style,
        NEW.rules,
        NEW.questions,
        NEW.template_version,
        auth.uid()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour sauvegarder automatiquement l'historique
CREATE TRIGGER agent_config_history_trigger
    AFTER UPDATE OF style, rules, questions, template_version
    ON agent_prompts
    FOR EACH ROW
    EXECUTE FUNCTION save_agent_config_history(); 