-- ****************************************************************
-- MISE À JOUR DU SCHÉMA POUR LE SYSTÈME D'ANALYSE
-- ****************************************************************
-- Ce fichier ajoute les tables et colonnes nécessaires pour
-- le système d'analyse des discussions.
-- ****************************************************************

-- Ajouter des colonnes pour le suivi de l'analyse dans la table sessions
ALTER TABLE IF EXISTS sessions 
ADD COLUMN IF NOT EXISTS analysis_status TEXT DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS analysis_progress INTEGER DEFAULT 0;

-- Commentaires sur les colonnes
COMMENT ON COLUMN sessions.analysis_status IS 'Statut de l''analyse: not_started, queued, in_progress, completed, failed';
COMMENT ON COLUMN sessions.analysis_progress IS 'Progression de l''analyse en pourcentage (0-100)';

-- Table pour les discussions entre participants et IA
CREATE TABLE IF NOT EXISTS discussions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES session_participants(id) ON DELETE CASCADE NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('nuggets', 'lightbulbs')),
  title TEXT,
  summary TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Index pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_discussions_session_id ON discussions(session_id);
CREATE INDEX IF NOT EXISTS idx_discussions_participant_id ON discussions(participant_id);
CREATE INDEX IF NOT EXISTS idx_discussions_agent_type ON discussions(agent_type);
-- Index pour exclure les enregistrements supprimés
CREATE INDEX IF NOT EXISTS idx_discussions_deleted_at ON discussions(deleted_at) WHERE deleted_at IS NULL;

-- Ajouter une colonne pour lier les messages à une discussion spécifique
ALTER TABLE IF EXISTS chat_messages
ADD COLUMN IF NOT EXISTS discussion_id UUID REFERENCES discussions(id);

-- Index pour accélérer les recherches par discussion
CREATE INDEX IF NOT EXISTS idx_chat_messages_discussion_id ON chat_messages(discussion_id);

-- Table pour les analyses individuelles des discussions
CREATE TABLE IF NOT EXISTS discussion_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE NOT NULL,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('nuggets', 'lightbulbs')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Index pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_discussion_analyses_session_id ON discussion_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_discussion_analyses_discussion_id ON discussion_analyses(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_analyses_analysis_type ON discussion_analyses(analysis_type);
-- Index pour exclure les enregistrements supprimés
CREATE INDEX IF NOT EXISTS idx_discussion_analyses_deleted_at ON discussion_analyses(deleted_at) WHERE deleted_at IS NULL;

-- Table pour les analyses globales (par session)
CREATE TABLE IF NOT EXISTS global_analyses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('nuggets', 'lightbulbs', 'overall')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Index pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_global_analyses_session_id ON global_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_global_analyses_analysis_type ON global_analyses(analysis_type);
-- Index pour exclure les enregistrements supprimés
CREATE INDEX IF NOT EXISTS idx_global_analyses_deleted_at ON global_analyses(deleted_at) WHERE deleted_at IS NULL;

-- ========== POLITIQUES DE SÉCURITÉ RLS ==========

-- Activer RLS sur les nouvelles tables
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_analyses ENABLE ROW LEVEL SECURITY;

-- Politique pour discussions: le propriétaire de la session peut voir toutes les discussions
CREATE POLICY discussions_owner_policy ON discussions
  USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = discussions.session_id 
      AND sessions.user_id = auth.uid()
      AND sessions.deleted_at IS NULL
    )
    AND discussions.deleted_at IS NULL
  );

-- Politique pour discussions: les participants ne peuvent voir que leurs propres discussions
CREATE POLICY discussions_participant_policy ON discussions
  USING (
    discussions.participant_id IN (
      SELECT id FROM session_participants 
      WHERE session_participants.user_id = auth.uid()
      AND session_participants.deleted_at IS NULL
    )
    AND discussions.deleted_at IS NULL
  );

-- Politique pour discussion_analyses: le propriétaire de la session peut voir toutes les analyses
CREATE POLICY discussion_analyses_owner_policy ON discussion_analyses
  USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = discussion_analyses.session_id 
      AND sessions.user_id = auth.uid()
      AND sessions.deleted_at IS NULL
    )
    AND discussion_analyses.deleted_at IS NULL
  );

-- Politique pour discussion_analyses: les participants ne peuvent voir que les analyses des discussions terminées
CREATE POLICY discussion_analyses_participant_policy ON discussion_analyses
  USING (
    EXISTS (
      SELECT 1 FROM discussions
      JOIN session_participants ON discussions.participant_id = session_participants.id
      JOIN sessions ON discussions.session_id = sessions.id
      WHERE discussions.id = discussion_analyses.discussion_id
      AND session_participants.user_id = auth.uid()
      AND sessions.status = 'ended'
      AND discussions.deleted_at IS NULL
      AND session_participants.deleted_at IS NULL
      AND sessions.deleted_at IS NULL
    )
    AND discussion_analyses.deleted_at IS NULL
  );

-- Politique pour global_analyses: le propriétaire de la session peut voir toutes les analyses globales
CREATE POLICY global_analyses_owner_policy ON global_analyses
  USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = global_analyses.session_id 
      AND sessions.user_id = auth.uid()
      AND sessions.deleted_at IS NULL
    )
    AND global_analyses.deleted_at IS NULL
  );

-- Politique pour global_analyses: les participants ne peuvent voir les analyses globales que pour les sessions terminées
CREATE POLICY global_analyses_participant_policy ON global_analyses
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN session_participants ON session_participants.session_id = sessions.id
      WHERE sessions.id = global_analyses.session_id
      AND session_participants.user_id = auth.uid()
      AND sessions.status = 'ended'
      AND sessions.deleted_at IS NULL
      AND session_participants.deleted_at IS NULL
    )
    AND global_analyses.deleted_at IS NULL
  );

-- Fonction pour supprimer en douceur une discussion et ses analyses
CREATE OR REPLACE FUNCTION soft_delete_discussion(discussion_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Marquer la discussion comme supprimée
  UPDATE discussions SET deleted_at = NOW() WHERE id = discussion_id AND deleted_at IS NULL;
  
  -- Marquer toutes les analyses liées comme supprimées
  UPDATE discussion_analyses SET deleted_at = NOW() WHERE discussion_id = discussion_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql; 