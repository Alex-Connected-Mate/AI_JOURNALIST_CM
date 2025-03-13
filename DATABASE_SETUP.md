# Configuration de la base de données Supabase

Ce document vous guide à travers la configuration nécessaire de la base de données Supabase pour l'application AI Journalist Connected Mate.

## Prérequis

- Un compte Supabase (gratuit pour commencer)
- Un projet Supabase créé
- Droits d'administration sur le projet Supabase

## Création des tables nécessaires

1. Connectez-vous à votre projet Supabase
2. Naviguez vers l'éditeur SQL (SQL Editor) dans le menu de gauche
3. Créez un nouveau script en cliquant sur "New Query"
4. Copiez le script SQL suivant dans l'éditeur:

```sql
-- Création de la table des sessions
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    title TEXT NOT NULL,
    description TEXT,
    code TEXT NOT NULL UNIQUE,
    created_by TEXT,
    max_participants INTEGER DEFAULT 20,
    settings JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'draft',
    vote_options JSONB DEFAULT '[]'::jsonb
);

-- Activation de la sécurité RLS (Row Level Security)
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Politique permettant à tous les utilisateurs de lire toutes les sessions
CREATE POLICY "Sessions are viewable by everyone" 
ON public.sessions FOR SELECT 
USING (true);

-- Politique permettant aux utilisateurs authentifiés de créer des sessions
CREATE POLICY "Users can create sessions" 
ON public.sessions FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Politique permettant aux créateurs de modifier leurs propres sessions
CREATE POLICY "Users can update their own sessions" 
ON public.sessions FOR UPDATE 
USING (auth.uid()::text = created_by);

-- Création de la table des participants
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    anonymous_id TEXT,
    user_id TEXT,
    is_presenter BOOLEAN DEFAULT false,
    vote_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    device_info JSONB DEFAULT '{}'::jsonb,
    UNIQUE(session_id, anonymous_id)
);

-- Activation de la sécurité RLS
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Politique permettant à tous les utilisateurs de lire tous les participants
CREATE POLICY "Participants are viewable by everyone" 
ON public.participants FOR SELECT 
USING (true);

-- Politique permettant à tous les utilisateurs d'insérer des participants
CREATE POLICY "Anyone can insert participants" 
ON public.participants FOR INSERT 
WITH CHECK (true);

-- Politique permettant aux utilisateurs de mettre à jour leurs propres entrées de participant
CREATE POLICY "Users can update their own participant records" 
ON public.participants FOR UPDATE 
USING (
    (auth.uid()::text = user_id) OR 
    (anonymous_id IS NOT NULL AND anonymous_id = current_setting('request.headers')::json->>'anonymous-id', false)
);

-- Fonction pour incrémenter le compteur de votes d'un participant
CREATE OR REPLACE FUNCTION increment_participant_vote(participant_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.participants
    SET vote_count = vote_count + 1
    WHERE id = participant_id;
END;
$$ LANGUAGE plpgsql;
```

5. Exécutez le script en cliquant sur "Run"
6. Vérifiez que les tables ont été créées en allant dans l'onglet "Table Editor"

## Configuration des variables d'environnement

1. Dans votre projet Supabase, allez dans "Settings" > "API"
2. Copiez l'URL du projet ("Project URL") et la clé anonyme ("anon public")
3. Dans votre application, créez ou modifiez le fichier `.env.local` à la racine du projet:

```
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anonyme
```

## Test de la configuration

1. Redémarrez votre application si elle est en cours d'exécution
2. Essayez de créer une nouvelle session via l'interface
3. Vérifiez que vous pouvez rejoindre une session en utilisant le code ou en scannant le QR code

## Résolution des problèmes courants

### Erreur "relation does not exist"

Si vous rencontrez cette erreur, vérifiez que:
- Vous avez bien exécuté le script SQL complet
- Vous êtes connecté au bon projet Supabase
- Les tables apparaissent bien dans l'éditeur de tables

### Problèmes d'authentification

Si vous rencontrez des problèmes d'authentification:
- Vérifiez que vos variables d'environnement sont correctement configurées
- Assurez-vous que les politiques RLS (Row Level Security) sont bien configurées
- Vérifiez que la connexion anonyme est activée dans votre projet Supabase

### Erreurs lors de la création de session

Si vous ne parvenez pas à créer une session:
- Vérifiez les logs côté client et serveur pour identifier l'erreur précise
- Assurez-vous que la table `sessions` a bien été créée avec tous les champs requis
- Vérifiez que vous avez les permissions nécessaires selon les politiques RLS

## Nettoyage ou réinitialisation

Si vous souhaitez réinitialiser complètement vos tables:

```sql
DROP TABLE IF EXISTS public.participants;
DROP TABLE IF EXISTS public.sessions;
```

**Attention**: Cette opération supprimera définitivement toutes vos données existantes. 