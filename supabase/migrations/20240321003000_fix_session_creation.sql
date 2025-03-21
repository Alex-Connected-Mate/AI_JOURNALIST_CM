-- Drop all existing session policies
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

-- Enable RLS on sessions table
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create a secure function to create sessions
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
    -- Get the current user's ID
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to create a session';
    END IF;

    -- Generate unique codes
    v_session_code := UPPER(SUBSTRING(MD5(random()::text) FROM 1 FOR 6));
    v_access_code := UPPER(SUBSTRING(MD5(random()::text) FROM 1 FOR 6));

    -- Create the session
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

    -- Return the created session data
    SELECT jsonb_build_object(
        'id', id,
        'title', title,
        'description', description,
        'status', status,
        'settings', settings,
        'max_participants', max_participants,
        'session_code', session_code,
        'access_code', access_code,
        'created_at', created_at
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_session_secure TO authenticated;

-- Create basic RLS policies
CREATE POLICY "session_owner_policy" ON public.sessions
FOR ALL
TO authenticated
USING (
    auth.uid() = user_id
)
WITH CHECK (
    auth.uid() = user_id
);

-- Create policy for public access to active sessions
CREATE POLICY "public_active_sessions_policy" ON public.sessions
FOR SELECT
USING (
    status = 'active' 
    AND deleted_at IS NULL
); 