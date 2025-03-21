-- Drop existing constraints if they exist
DO $$ 
BEGIN
    -- Try to drop the constraints if they exist
    BEGIN
        ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_session_code_key;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore any errors
    END;
    
    BEGIN
        ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_access_code_key;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore any errors
    END;
END $$;

-- Add unique constraints to sessions table
ALTER TABLE public.sessions
ADD CONSTRAINT sessions_session_code_key UNIQUE (session_code),
ADD CONSTRAINT sessions_access_code_key UNIQUE (access_code);

-- Update the session creation function to handle conflicts
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
    v_max_attempts INTEGER := 3;
    v_current_attempt INTEGER := 0;
BEGIN
    -- Récupérer l'ID de l'utilisateur courant
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to create a session';
    END IF;

    -- Boucle pour gérer les collisions de codes
    LOOP
        v_current_attempt := v_current_attempt + 1;
        
        -- Générer des codes uniques
        v_session_code := UPPER(SUBSTRING(MD5(random()::text) FROM 1 FOR 6));
        v_access_code := UPPER(SUBSTRING(MD5(random()::text) FROM 1 FOR 6));

        -- Tenter d'insérer la session
        BEGIN
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

            -- Si l'insertion réussit, sortir de la boucle
            EXIT;
        EXCEPTION
            WHEN unique_violation THEN
                -- Si on atteint le nombre maximum de tentatives, lever une exception
                IF v_current_attempt >= v_max_attempts THEN
                    RAISE EXCEPTION 'Failed to generate unique session codes after % attempts', v_max_attempts;
                END IF;
                -- Sinon, continuer la boucle pour réessayer avec de nouveaux codes
                CONTINUE;
        END;
    END LOOP;

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

-- Renouveler les permissions
GRANT EXECUTE ON FUNCTION create_session_secure TO authenticated; 