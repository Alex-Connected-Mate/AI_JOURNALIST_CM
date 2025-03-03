-- ****************************************************************
-- SYSTÈME DE VOTE ENTRE PARTICIPANTS - EXTENSION DU SCHÉMA
-- ****************************************************************
-- Ce fichier définit la structure pour le système de vote entre 
-- participants pendant une session interactive
-- ****************************************************************

-- Table: votes entre participants
CREATE TABLE IF NOT EXISTS participant_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES session_participants(id) ON DELETE CASCADE NOT NULL,
  voted_for_id UUID REFERENCES session_participants(id) ON DELETE CASCADE NOT NULL,
  reason TEXT, -- Raison optionnelle du vote
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Index pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_participant_votes_session_id ON participant_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_participant_votes_voter_id ON participant_votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_participant_votes_voted_for_id ON participant_votes(voted_for_id);

-- Table: configuration des votes pour une session
CREATE TABLE IF NOT EXISTS vote_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  max_votes_per_participant INTEGER DEFAULT 3, -- Nombre maximum de votes par participant
  require_reason BOOLEAN DEFAULT false, -- Si une raison est requise pour voter
  voting_duration INTEGER DEFAULT 1200, -- Durée en secondes (20 minutes par défaut)
  top_voted_count INTEGER DEFAULT 3, -- Nombre de participants les mieux votés qui parleront avec l'IA
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Table: résultats des votes par session
CREATE TABLE IF NOT EXISTS vote_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES session_participants(id) ON DELETE CASCADE NOT NULL,
  vote_count INTEGER DEFAULT 0, -- Nombre de votes reçus
  rank INTEGER, -- Classement dans la session
  is_top_voted BOOLEAN DEFAULT false, -- Si ce participant fait partie des mieux votés
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(session_id, participant_id)
);

-- Index pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_vote_results_session_id ON vote_results(session_id);
CREATE INDEX IF NOT EXISTS idx_vote_results_participant_id ON vote_results(participant_id);
CREATE INDEX IF NOT EXISTS idx_vote_results_is_top_voted ON vote_results(is_top_voted);

-- ========== FONCTIONS ET DÉCLENCHEURS ==========

-- Fonction pour mettre à jour les résultats de vote à chaque nouveau vote
CREATE OR REPLACE FUNCTION update_participant_vote_results()
RETURNS TRIGGER AS $$
DECLARE
  result_exists BOOLEAN;
  vote_settings_record vote_settings%ROWTYPE;
BEGIN
  -- Vérifier si l'enregistrement de résultat existe déjà
  SELECT EXISTS (
    SELECT 1 FROM vote_results 
    WHERE session_id = NEW.session_id AND participant_id = NEW.voted_for_id
  ) INTO result_exists;
  
  -- Si l'enregistrement n'existe pas, le créer
  IF NOT result_exists THEN
    INSERT INTO vote_results (session_id, participant_id, vote_count)
    VALUES (NEW.session_id, NEW.voted_for_id, 1);
  ELSE
    -- Sinon, incrémenter le compteur
    UPDATE vote_results
    SET vote_count = vote_count + 1,
        updated_at = now()
    WHERE session_id = NEW.session_id AND participant_id = NEW.voted_for_id;
  END IF;
  
  -- Mettre à jour les rangs pour tous les participants de cette session
  UPDATE vote_results vr
  SET rank = ranks.rank
  FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY vote_count DESC) as rank
    FROM vote_results
    WHERE session_id = NEW.session_id
  ) ranks
  WHERE vr.id = ranks.id AND vr.session_id = NEW.session_id;
  
  -- Marquer les participants les mieux votés
  SELECT * FROM vote_settings 
  WHERE session_id = NEW.session_id 
  INTO vote_settings_record;
  
  IF FOUND THEN
    UPDATE vote_results
    SET is_top_voted = (rank <= vote_settings_record.top_voted_count)
    WHERE session_id = NEW.session_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Déclencheur pour mettre à jour les résultats après l'ajout d'un vote
CREATE TRIGGER after_participant_vote_inserted
  AFTER INSERT ON participant_votes
  FOR EACH ROW EXECUTE PROCEDURE update_participant_vote_results();

-- Fonction pour vérifier le nombre maximum de votes par participant
CREATE OR REPLACE FUNCTION check_max_votes_per_participant()
RETURNS TRIGGER AS $$
DECLARE
  vote_count INTEGER;
  max_votes INTEGER;
BEGIN
  -- Obtenir le nombre maximum de votes autorisés pour cette session
  SELECT max_votes_per_participant INTO max_votes
  FROM vote_settings
  WHERE session_id = NEW.session_id;
  
  IF max_votes IS NULL THEN
    max_votes := 3; -- Valeur par défaut si aucun paramètre n'est défini
  END IF;
  
  -- Compter les votes déjà émis par ce participant
  SELECT COUNT(*) INTO vote_count
  FROM participant_votes
  WHERE session_id = NEW.session_id AND voter_id = NEW.voter_id;
  
  -- Si le participant a déjà atteint son maximum de votes, refuser l'insertion
  IF vote_count >= max_votes THEN
    RAISE EXCEPTION 'Nombre maximum de votes atteint pour ce participant (max: %)', max_votes;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Déclencheur pour vérifier le nombre max de votes avant insertion
CREATE TRIGGER check_votes_before_insert
  BEFORE INSERT ON participant_votes
  FOR EACH ROW EXECUTE PROCEDURE check_max_votes_per_participant();

-- ========== POLITIQUES DE SÉCURITÉ RLS ==========

-- Activer RLS sur les nouvelles tables
ALTER TABLE participant_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_results ENABLE ROW LEVEL SECURITY;

-- Politique pour vote_settings: seul le propriétaire de la session peut gérer
CREATE POLICY vote_settings_owner_policy ON vote_settings
  USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = vote_settings.session_id AND sessions.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = vote_settings.session_id AND sessions.user_id = auth.uid()));

-- Politique pour participant_votes: les participants peuvent voter pendant la session active
CREATE POLICY participant_votes_insert_policy ON participant_votes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM session_participants sp
      JOIN sessions s ON sp.session_id = s.id
      WHERE sp.id = participant_votes.voter_id 
      AND sp.user_id = auth.uid()
      AND s.status = 'active'
    )
  );

-- Politique pour participant_votes: le propriétaire de la session peut voir tous les votes
CREATE POLICY participant_votes_owner_view_policy ON participant_votes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = participant_votes.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

-- Politique pour participant_votes: les participants peuvent voir leurs propres votes
CREATE POLICY participant_votes_participant_view_policy ON participant_votes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_participants
      WHERE session_participants.id = participant_votes.voter_id 
      AND session_participants.user_id = auth.uid()
    )
  );

-- Politique pour vote_results: le propriétaire de la session peut voir tous les résultats
CREATE POLICY vote_results_owner_policy ON vote_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = vote_results.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

-- Politique pour vote_results: les participants peuvent voir les résultats publics
CREATE POLICY vote_results_public_policy ON vote_results
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN session_participants ON session_participants.session_id = sessions.id
      WHERE sessions.id = vote_results.session_id
      AND session_participants.user_id = auth.uid()
      AND sessions.status != 'draft'
    )
  );

-- ========== INSTRUCTIONS D'UTILISATION ==========
/*
INSTRUCTIONS POUR DÉPLOYER CETTE EXTENSION DE SCHÉMA:

1. Assurez-vous que votre schéma principal est déjà déployé
2. Connectez-vous à votre projet Supabase (https://app.supabase.com)
3. Allez dans l'éditeur SQL (Database > SQL Editor)
4. Copiez-collez l'intégralité de ce script
5. Exécutez le script
*/ 