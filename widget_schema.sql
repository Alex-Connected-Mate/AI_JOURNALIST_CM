-- ****************************************************************
-- SYSTÈME DE WIDGET - EXTENSION DU SCHÉMA
-- ****************************************************************
-- Ce fichier définit la structure pour le système de widget permettant
-- de déployer des agents IA sur différentes plateformes
-- ****************************************************************

-- Table: configuration des widgets
CREATE TABLE IF NOT EXISTS widgets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  agent_config JSONB NOT NULL, -- Configuration de l'agent IA (nom, personnalité, prompt, etc.)
  widget_type TEXT NOT NULL CHECK (widget_type IN ('web', 'ios', 'url')),
  
  -- Apparence du widget
  primary_color TEXT DEFAULT '#4F46E5',
  secondary_color TEXT DEFAULT '#F9FAFB',
  text_color TEXT DEFAULT '#111827',
  logo_url TEXT,
  header_text TEXT DEFAULT 'Chat with AI',
  placeholder_text TEXT DEFAULT 'Type your message here...',
  
  -- Options du widget
  is_active BOOLEAN DEFAULT true,
  show_timestamps BOOLEAN DEFAULT true,
  auto_open BOOLEAN DEFAULT false,
  collect_user_info BOOLEAN DEFAULT false,
  required_user_fields JSONB DEFAULT '["name"]'::jsonb, -- Champs d'information utilisateur requis
  
  -- Intégration
  allowed_domains JSONB DEFAULT '["*"]'::jsonb, -- '*' signifie tous les domaines
  access_token TEXT DEFAULT uuid_generate_v4(), -- Jeton d'accès unique pour ce widget
  
  -- Métadonnées
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Index pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_widgets_user_id ON widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_widgets_access_token ON widgets(access_token);
-- Index pour exclure les enregistrements supprimés
CREATE INDEX IF NOT EXISTS idx_widgets_deleted_at ON widgets(deleted_at) WHERE deleted_at IS NULL;

-- Table: conversations widget
CREATE TABLE IF NOT EXISTS widget_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  widget_id UUID REFERENCES widgets(id) ON DELETE CASCADE NOT NULL,
  visitor_id TEXT NOT NULL, -- ID unique du visiteur (généré côté client)
  visitor_info JSONB, -- Informations sur le visiteur (nom, email, etc.)
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB, -- Métadonnées supplémentaires (navigateur, localisation, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Index pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_widget_conversations_widget_id ON widget_conversations(widget_id);
CREATE INDEX IF NOT EXISTS idx_widget_conversations_visitor_id ON widget_conversations(visitor_id);
-- Index pour exclure les enregistrements supprimés
CREATE INDEX IF NOT EXISTS idx_widget_conversations_deleted_at ON widget_conversations(deleted_at) WHERE deleted_at IS NULL;

-- Table: messages de conversation widget
CREATE TABLE IF NOT EXISTS widget_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES widget_conversations(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('ai', 'human')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Index pour accélérer les recherches
CREATE INDEX IF NOT EXISTS idx_widget_messages_conversation_id ON widget_messages(conversation_id);
-- Index pour exclure les enregistrements supprimés
CREATE INDEX IF NOT EXISTS idx_widget_messages_deleted_at ON widget_messages(deleted_at) WHERE deleted_at IS NULL;

-- ========== POLITIQUES DE SÉCURITÉ RLS ==========

-- Activer RLS (Row Level Security) sur toutes les tables
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_messages ENABLE ROW LEVEL SECURITY;

-- Politique pour widgets: les utilisateurs ne peuvent voir et modifier que leurs propres widgets
CREATE POLICY widgets_owner_policy ON widgets
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Politique pour widget_conversations: le propriétaire du widget peut voir toutes les conversations
CREATE POLICY widget_conversations_owner_policy ON widget_conversations
  USING (
    EXISTS (
      SELECT 1 FROM widgets
      WHERE widgets.id = widget_conversations.widget_id
      AND widgets.user_id = auth.uid()
      AND widgets.deleted_at IS NULL
    )
    AND widget_conversations.deleted_at IS NULL
  );

-- Politique pour widget_messages: le propriétaire du widget peut voir tous les messages
CREATE POLICY widget_messages_owner_policy ON widget_messages
  USING (
    EXISTS (
      SELECT 1 FROM widget_conversations
      JOIN widgets ON widgets.id = widget_conversations.widget_id
      WHERE widget_conversations.id = widget_messages.conversation_id
      AND widgets.user_id = auth.uid()
      AND widget_conversations.deleted_at IS NULL
      AND widgets.deleted_at IS NULL
    )
    AND widget_messages.deleted_at IS NULL
  );

-- ========== FONCTIONS POUR LA GESTION DE SUPPRESSION DOUCE ==========

-- Fonction pour marquer un widget comme supprimé
CREATE OR REPLACE FUNCTION soft_delete_widget(widget_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Marquer le widget comme supprimé
  UPDATE widgets SET deleted_at = NOW() WHERE id = widget_id AND deleted_at IS NULL;
  
  -- Marquer toutes les conversations liées comme supprimées
  UPDATE widget_conversations SET deleted_at = NOW() WHERE widget_id = widget_id AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql; 