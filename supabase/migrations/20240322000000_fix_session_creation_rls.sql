-- Supprimer toutes les politiques existantes pour éviter les conflits
DROP POLICY IF EXISTS "Sessions are viewable by everyone" ON public.sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow authenticated users to create sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow users to read own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow users to update own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow users to delete own sessions" ON public.sessions;
DROP POLICY IF EXISTS "sessions_owner_policy" ON public.sessions;
DROP POLICY IF EXISTS "sessions_read_policy" ON public.sessions;
DROP POLICY IF EXISTS "sessions_insert_policy" ON public.sessions;
DROP POLICY IF EXISTS "sessions_update_policy" ON public.sessions;
DROP POLICY IF EXISTS "session_owner_policy" ON public.sessions;
DROP POLICY IF EXISTS "public_active_sessions_policy" ON public.sessions;

-- Activer RLS sur la table sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Créer une politique unifiée pour la gestion des sessions
CREATE POLICY session_management_policy ON public.sessions
FOR ALL
TO authenticated
USING (
    auth.uid() = user_id
)
WITH CHECK (
    auth.uid() = user_id
);

-- Créer une politique pour l'accès public aux sessions actives
CREATE POLICY public_active_sessions_policy ON public.sessions
FOR SELECT
USING (
    status = 'active'
);

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS create_session_secure(text, text, jsonb, integer);

-- Créer une fonction sécurisée pour la création de session
CREATE OR REPLACE FUNCTION create_session_secure(
    p_title TEXT,
    p_description TEXT DEFAULT '',
    p_settings JSONB DEFAULT '{}'::jsonb,
    p_max_participants INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_id UUID;
    v_user_id UUID;
    v_session_code TEXT;
    v_access_code TEXT;
    v_result JSONB;
BEGIN
    -- Récupérer l'ID de l'utilisateur courant
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to create a session';
    END IF;

    -- Générer des codes uniques
    v_session_code := UPPER(SUBSTRING(MD5(random()::text) FROM 1 FOR 6));
    v_access_code := UPPER(SUBSTRING(MD5(random()::text) FROM 1 FOR 6));

    -- Créer la session
    INSERT INTO sessions (
        user_id,
        title,
        name,
        description,
        status,
        settings,
        max_participants,
        session_code,
        access_code,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        p_title,
        p_title,
        p_description,
        'draft',
        p_settings,
        p_max_participants,
        v_session_code,
        v_access_code,
        NOW(),
        NOW()
    )
    RETURNING id INTO v_session_id;

    -- Retourner les données de la session créée
    SELECT jsonb_build_object(
        'id', id,
        'title', title,
        'description', description,
        'status', status,
        'settings', settings,
        'max_participants', max_participants,
        'session_code', session_code,
        'access_code', access_code,
        'created_at', created_at,
        'user_id', user_id
    )
    INTO v_result
    FROM sessions
    WHERE id = v_session_id;

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create session: %', SQLERRM;
END;
$$;

-- Donner les permissions d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION create_session_secure TO authenticated; 