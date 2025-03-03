-- ****************************************************************
-- SYSTÈME DE VOTE EN DIRECT - EXTENSION DU SCHÉMA
-- ****************************************************************
-- Ce fichier complète le schéma de base de données existant
-- pour ajouter la fonctionnalité de vote en direct
-- ****************************************************************

-- Table: questions pour le système de vote
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'yes_no', 'rating', 'open')),
  options JSONB, -- Pour les questions à choix multiples: [{"id": "a", "text": "Option A"}, ...]
  is_anonymous BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT false,
  allow_multiple_answers BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Index pour accélérer les recherches par session
CREATE INDEX IF NOT EXISTS idx_questions_session_id ON questions(session_id);
-- Index pour exclure les enregistrements supprimés
CREATE INDEX IF NOT EXISTS idx_questions_deleted_at ON questions(deleted_at) WHERE deleted_at IS NULL;

-- Assurer que les votes référencent bien une question 
-- (La table votes existe déjà dans votre schéma principal)
ALTER TABLE votes ADD CONSTRAINT votes_question_id_fkey 
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;

-- Table: résultats agrégés des votes (pour performances)
CREATE TABLE IF NOT EXISTS vote_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  option_id TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Index pour accélérer les recherches par question
CREATE INDEX IF NOT EXISTS idx_vote_results_question_id ON vote_results(question_id);
-- Index pour exclure les enregistrements supprimés
CREATE INDEX IF NOT EXISTS idx_vote_results_deleted_at ON vote_results(deleted_at) WHERE deleted_at IS NULL;

-- ========== FONCTIONS ET DÉCLENCHEURS ==========

-- Fonction pour mettre à jour les résultats de vote
CREATE OR REPLACE FUNCTION update_vote_results()
RETURNS TRIGGER AS $$
DECLARE
  total_votes INTEGER;
  result_exists BOOLEAN;
BEGIN
  -- Vérifier si l'enregistrement de résultat existe déjà
  SELECT EXISTS (
    SELECT 1 FROM vote_results 
    WHERE question_id = NEW.question_id AND option_id = NEW.choice AND deleted_at IS NULL
  ) INTO result_exists;
  
  -- Si l'enregistrement de résultat n'existe pas, le créer
  IF NOT result_exists THEN
    INSERT INTO vote_results (question_id, option_id, count)
    VALUES (NEW.question_id, NEW.choice, 1);
  ELSE
    -- Sinon, incrémenter le compteur
    UPDATE vote_results
    SET count = count + 1,
        updated_at = now()
    WHERE question_id = NEW.question_id AND option_id = NEW.choice AND deleted_at IS NULL;
  END IF;
  
  -- Calculer le total des votes pour cette question
  SELECT COUNT(*) FROM votes WHERE question_id = NEW.question_id AND deleted_at IS NULL INTO total_votes;
  
  -- Mettre à jour les pourcentages pour tous les résultats de cette question
  UPDATE vote_results
  SET percentage = (count * 100.0 / total_votes),
      updated_at = now()
  WHERE question_id = NEW.question_id AND deleted_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Déclencheur pour mettre à jour les résultats après l'ajout d'un vote
CREATE TRIGGER after_vote_inserted
  AFTER INSERT ON votes
  FOR EACH ROW EXECUTE PROCEDURE update_vote_results();

-- ========== POLITIQUES DE SÉCURITÉ RLS ==========

-- Activer RLS sur les nouvelles tables
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_results ENABLE ROW LEVEL SECURITY;

-- Politique pour questions: le propriétaire de la session peut gérer ses questions
CREATE POLICY questions_owner_policy ON questions
  USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = questions.session_id 
      AND sessions.user_id = auth.uid()
      AND sessions.deleted_at IS NULL
    )
    AND questions.deleted_at IS NULL
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = questions.session_id 
      AND sessions.user_id = auth.uid()
      AND sessions.deleted_at IS NULL
    )
  );

-- Politique pour questions: les participants peuvent voir les questions actives
CREATE POLICY questions_participant_policy ON questions
  FOR SELECT
  USING (
    is_active = true
    AND deleted_at IS NULL
  );

-- Politique pour vote_results: visible par le propriétaire de la session
CREATE POLICY vote_results_owner_policy ON vote_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM questions 
      JOIN sessions ON questions.session_id = sessions.id 
      WHERE questions.id = vote_results.question_id 
      AND sessions.user_id = auth.uid()
      AND questions.deleted_at IS NULL
      AND sessions.deleted_at IS NULL
    )
    AND vote_results.deleted_at IS NULL
  );

-- Politique pour vote_results: visible par les participants si la question est active
CREATE POLICY vote_results_participant_policy ON vote_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM questions 
      WHERE questions.id = vote_results.question_id 
      AND questions.is_active = true
      AND questions.deleted_at IS NULL
    )
    AND vote_results.deleted_at IS NULL
  );

-- Fonction pour marquer une question comme supprimée
CREATE OR REPLACE FUNCTION soft_delete_question(question_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Marquer la question comme supprimée
  UPDATE questions SET deleted_at = NOW() WHERE id = question_id AND deleted_at IS NULL;
  
  -- Marquer tous les résultats de vote liés comme supprimés
  UPDATE vote_results SET deleted_at = NOW() WHERE question_id = question_id AND deleted_at IS NULL;
  
  -- Marquer tous les votes liés comme supprimés (la table votes est dans le schéma principal)
  UPDATE votes SET deleted_at = NOW() WHERE question_id = question_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- ========== INSTRUCTIONS D'UTILISATION ==========
/*
INSTRUCTIONS POUR DÉPLOYER CETTE EXTENSION DE SCHÉMA:

1. Assurez-vous que votre schéma principal est déjà déployé
2. Connectez-vous à votre projet Supabase (https://app.supabase.com)
3. Allez dans l'éditeur SQL (Database > SQL Editor)
4. Copiez-collez l'intégralité de ce script
5. Exécutez le script

Note: Si vous avez déjà défini des contraintes sur la table votes,
vous devrez peut-être les supprimer avant d'ajouter la nouvelle contrainte.
*/ 