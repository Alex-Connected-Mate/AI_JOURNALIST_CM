-- ****************************************************************
-- INTERACTIVE SESSIONS PLATFORM - DATABASE SCHEMA
-- ****************************************************************
-- Ce fichier définit la structure complète de la base de données 
-- pour la plateforme de sessions interactives.
-- ****************************************************************

-- ========== CONFIGURATION ==========
-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========== TABLES PRINCIPALES ==========

-- Table: utilisateurs (extension de la table auth.users de Supabase)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  institution TEXT,
  title TEXT,
  bio TEXT,
  avatar_url TEXT,
  openai_api_key TEXT, -- Clé API OpenAI personnelle de l'utilisateur
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Fonction pour créer automatiquement un enregistrement dans la table users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Déclencheur pour créer l'utilisateur après inscription
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Table: sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  institution TEXT,
  professor_name TEXT,
  show_professor_name BOOLEAN DEFAULT true,
  max_participants INTEGER DEFAULT 100,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'active', 'paused', 'ended')),
  creation_step TEXT DEFAULT 'basic_info' CHECK (creation_step IN (
    'basic_info',
    'connection',
    'discussion',
    'ai_interaction',
    'lightbulb',
    'analysis',
    'ready'
  )),
  access_code TEXT UNIQUE,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  version INTEGER DEFAULT 1 NOT NULL,
  CONSTRAINT valid_settings CHECK (jsonb_typeof(settings) = 'object')
);

-- Table: historique des modifications de session
CREATE TABLE IF NOT EXISTS session_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  action TEXT NOT NULL,
  changes JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Trigger pour enregistrer l'historique des modifications
CREATE OR REPLACE FUNCTION log_session_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO session_history (session_id, user_id, action, changes)
    VALUES (
      NEW.id,
      NEW.user_id,
      'update',
      jsonb_build_object(
        'previous', row_to_json(OLD),
        'current', row_to_json(NEW),
        'changed_fields', (
          SELECT jsonb_object_agg(key, value)
          FROM jsonb_each(row_to_json(NEW)::jsonb)
          WHERE NOT row_to_json(OLD)::jsonb ? key
             OR row_to_json(OLD)::jsonb -> key <> row_to_json(NEW)::jsonb -> key
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_history_trigger
  AFTER UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION log_session_changes();

-- Table: configuration des profils de session
CREATE TABLE IF NOT EXISTS session_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  profile_mode TEXT NOT NULL CHECK (profile_mode IN ('anonymous', 'semi-anonymous', 'non-anonymous')),
  color TEXT,
  emoji TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Table: participants aux sessions
CREATE TABLE IF NOT EXISTS session_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id),
  anonymous_identifier TEXT,
  nickname TEXT,
  selected_emoji TEXT,
  photo_url TEXT,
  full_name TEXT,
  email TEXT,
  links JSONB DEFAULT '[]'::jsonb,
  color TEXT,
  emoji TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT valid_links CHECK (jsonb_typeof(links) = 'array')
);

-- ========== TABLES POUR FONCTIONNALITÉS FUTURES ==========

-- Table: votes (pour la fonctionnalité de vote en direct)
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES session_participants(id) ON DELETE CASCADE NOT NULL,
  question_id UUID NOT NULL,  -- Référence à une question future
  choice TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Index pour accélérer les requêtes de vote
CREATE INDEX IF NOT EXISTS idx_votes_session_id ON votes(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_participant_id ON votes(participant_id);
-- Index pour exclure les enregistrements supprimés
CREATE INDEX IF NOT EXISTS idx_votes_deleted_at ON votes(deleted_at) WHERE deleted_at IS NULL;

-- Table: messages du chat (pour la fonctionnalité de chat AI)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES session_participants(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_ai BOOLEAN DEFAULT false,
  message_type TEXT DEFAULT 'standard' CHECK (message_type IN ('standard', 'nugget', 'lightbulb')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Index pour accélérer les requêtes de chat
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_participant_id ON chat_messages(participant_id);
-- Index pour exclure les enregistrements supprimés
CREATE INDEX IF NOT EXISTS idx_chat_messages_deleted_at ON chat_messages(deleted_at) WHERE deleted_at IS NULL;

-- ========== POLITIQUES DE SÉCURITÉ RLS ==========

-- Activer RLS (Row Level Security) sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_history ENABLE ROW LEVEL SECURITY;

-- Politique pour users: les utilisateurs ne peuvent voir et modifier que leur propre profil
CREATE POLICY users_policy ON users
  USING (auth.uid() = id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = id);

-- Politique pour sessions: les utilisateurs ne peuvent voir et modifier que leurs propres sessions
CREATE POLICY sessions_owner_policy ON sessions
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Politique pour session_profiles: le propriétaire de la session peut voir et modifier
CREATE POLICY session_profiles_owner_policy ON session_profiles
  USING (EXISTS (
    SELECT 1 FROM sessions 
    WHERE sessions.id = session_profiles.session_id 
    AND sessions.user_id = auth.uid()
    AND sessions.deleted_at IS NULL
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions 
    WHERE sessions.id = session_profiles.session_id 
    AND sessions.user_id = auth.uid()
    AND sessions.deleted_at IS NULL
  ));

-- Politique pour session_participants: le propriétaire de la session peut voir tous les participants
CREATE POLICY session_participants_owner_policy ON session_participants
  USING (EXISTS (
    SELECT 1 FROM sessions 
    WHERE sessions.id = session_participants.session_id 
    AND sessions.user_id = auth.uid()
    AND sessions.deleted_at IS NULL
  ));

-- Les participants peuvent voir et modifier leur propre participation
CREATE POLICY session_participants_self_policy ON session_participants
  USING (
    user_id = auth.uid()
    AND deleted_at IS NULL
  )
  WITH CHECK (user_id = auth.uid());

-- Politique pour session_history
CREATE POLICY session_history_owner_policy ON session_history
  USING (EXISTS (
    SELECT 1 FROM sessions 
    WHERE sessions.id = session_history.session_id 
    AND sessions.user_id = auth.uid()
  ));

-- ========== FONCTIONS UTILITAIRES ==========

-- Fonction pour valider une étape de création
CREATE OR REPLACE FUNCTION validate_session_step(
  p_session_id UUID,
  p_step TEXT,
  p_settings JSONB
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_step TEXT;
  v_next_step TEXT;
  v_steps TEXT[] := ARRAY['basic_info', 'connection', 'discussion', 'ai_interaction', 'lightbulb', 'analysis', 'ready'];
BEGIN
  -- Récupérer l'étape actuelle
  SELECT creation_step INTO v_current_step
  FROM sessions WHERE id = p_session_id;
  
  -- Vérifier que l'étape est valide
  IF NOT p_step = ANY(v_steps) THEN
    RAISE EXCEPTION 'Invalid step: %', p_step;
  END IF;
  
  -- Vérifier que les paramètres sont valides pour l'étape
  CASE p_step
    WHEN 'basic_info' THEN
      IF NOT (p_settings ? 'title' AND p_settings->>'title' <> '') THEN
        RETURN FALSE;
      END IF;
    WHEN 'connection' THEN
      IF NOT (p_settings->'connection' ? 'anonymityLevel') THEN
        RETURN FALSE;
      END IF;
    -- Ajouter d'autres validations selon les besoins
  END CASE;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour passer à l'étape suivante
CREATE OR REPLACE FUNCTION advance_session_step(
  p_session_id UUID,
  p_current_step TEXT,
  p_settings JSONB
) RETURNS TEXT AS $$
DECLARE
  v_next_step TEXT;
  v_steps TEXT[] := ARRAY['basic_info', 'connection', 'discussion', 'ai_interaction', 'lightbulb', 'analysis', 'ready'];
  v_current_idx INTEGER;
BEGIN
  -- Valider l'étape actuelle
  IF NOT validate_session_step(p_session_id, p_current_step, p_settings) THEN
    RAISE EXCEPTION 'Invalid step data for step: %', p_current_step;
  END IF;
  
  -- Trouver l'index de l'étape actuelle
  SELECT idx INTO v_current_idx
  FROM unnest(v_steps) WITH ORDINALITY AS t(step, idx)
  WHERE step = p_current_step;
  
  -- Déterminer la prochaine étape
  IF v_current_idx = array_length(v_steps, 1) THEN
    v_next_step := 'ready';
  ELSE
    v_next_step := v_steps[v_current_idx + 1];
  END IF;
  
  -- Mettre à jour la session
  UPDATE sessions SET
    creation_step = v_next_step,
    settings = settings || p_settings,
    updated_at = NOW(),
    version = version + 1
  WHERE id = p_session_id;
  
  RETURN v_next_step;
END;
$$ LANGUAGE plpgsql;

-- ========== INDEXES ==========

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_access_code ON sessions(access_code);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_creation_step ON sessions(creation_step) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user_id ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_session_history_session_id ON session_history(session_id);
CREATE INDEX IF NOT EXISTS idx_session_history_user_id ON session_history(user_id);

-- ========== TRIGGERS DE MAINTENANCE ==========

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_modtime
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_modtime
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_profiles_modtime
  BEFORE UPDATE ON session_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ========== INSTRUCTIONS D'UTILISATION ==========
/*
INSTRUCTIONS POUR DÉPLOYER CE SCHÉMA:

1. Connectez-vous à votre projet Supabase (https://app.supabase.com)
2. Allez dans l'éditeur SQL (Database > SQL Editor)
3. Copiez-collez l'intégralité de ce script
4. Exécutez le script

Note: Assurez-vous que les extensions "uuid-ossp" et "pgcrypto" sont disponibles dans votre projet Supabase.
Si vous rencontrez des erreurs, vous devrez peut-être ajuster certaines parties du script en fonction de votre configuration.
*/ 