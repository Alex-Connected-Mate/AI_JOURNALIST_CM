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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
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
  institution TEXT,
  professor_name TEXT,
  show_professor_name BOOLEAN DEFAULT true,
  image_url TEXT,
  max_participants INTEGER DEFAULT 100,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended')),
  access_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Index pour accélérer les recherches par utilisateur
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
-- Index pour accélérer les recherches par code d'accès
CREATE INDEX IF NOT EXISTS idx_sessions_access_code ON sessions(access_code);

-- Table: configuration des profils de session
CREATE TABLE IF NOT EXISTS session_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  profile_mode TEXT NOT NULL CHECK (profile_mode IN ('anonymous', 'semi-anonymous', 'non-anonymous')),
  color TEXT,
  emoji TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Index pour accélérer les recherches par session
CREATE INDEX IF NOT EXISTS idx_session_profiles_session_id ON session_profiles(session_id);

-- Table: participants aux sessions
CREATE TABLE IF NOT EXISTS session_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id),
  -- Champs pour mode anonyme
  anonymous_identifier TEXT,
  -- Champs pour mode semi-anonyme
  nickname TEXT,
  selected_emoji TEXT,
  photo_url TEXT,
  -- Champs pour mode non-anonyme
  full_name TEXT,
  phone TEXT,
  email TEXT,
  links JSONB, -- Stockage flexible pour WhatsApp, réseaux sociaux, etc.
  -- Champs communs
  color TEXT,
  emoji TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE
);

-- Index pour accélérer les recherches par session
CREATE INDEX IF NOT EXISTS idx_session_participants_session_id ON session_participants(session_id);
-- Index pour accélérer les recherches par utilisateur
CREATE INDEX IF NOT EXISTS idx_session_participants_user_id ON session_participants(user_id);

-- ========== TABLES POUR FONCTIONNALITÉS FUTURES ==========

-- Table: votes (pour la fonctionnalité de vote en direct)
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES session_participants(id) ON DELETE CASCADE NOT NULL,
  question_id UUID NOT NULL,  -- Référence à une question future
  choice TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Index pour accélérer les requêtes de vote
CREATE INDEX IF NOT EXISTS idx_votes_session_id ON votes(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_participant_id ON votes(participant_id);

-- Table: messages du chat (pour la fonctionnalité de chat AI)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  participant_id UUID REFERENCES session_participants(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_ai BOOLEAN DEFAULT false,
  message_type TEXT DEFAULT 'standard' CHECK (message_type IN ('standard', 'nugget', 'lightbulb')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Index pour accélérer les requêtes de chat
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_participant_id ON chat_messages(participant_id);

-- ========== POLITIQUES DE SÉCURITÉ RLS ==========

-- Activer RLS (Row Level Security) sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Politique pour users: les utilisateurs ne peuvent voir et modifier que leur propre profil
CREATE POLICY users_policy ON users
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Politique pour sessions: les utilisateurs ne peuvent voir et modifier que leurs propres sessions
CREATE POLICY sessions_owner_policy ON sessions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique pour session_profiles: le propriétaire de la session peut voir et modifier
CREATE POLICY session_profiles_owner_policy ON session_profiles
  USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = session_profiles.session_id AND sessions.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = session_profiles.session_id AND sessions.user_id = auth.uid()));

-- Politique pour session_participants: le propriétaire de la session peut voir tous les participants
CREATE POLICY session_participants_owner_policy ON session_participants
  USING (EXISTS (SELECT 1 FROM sessions WHERE sessions.id = session_participants.session_id AND sessions.user_id = auth.uid()));

-- Les participants peuvent voir et modifier leur propre participation
CREATE POLICY session_participants_self_policy ON session_participants
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

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