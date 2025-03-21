-- Drop the existing unique constraint
DO $$ 
BEGIN
    ALTER TABLE public.sessions
    DROP CONSTRAINT IF EXISTS user_id_title_key;
END $$;

-- Add a new function to generate a unique title
CREATE OR REPLACE FUNCTION public.generate_unique_session_title(
    p_base_title text,
    p_user_id uuid
) RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    v_counter integer := 0;
    v_title text;
    v_exists boolean;
BEGIN
    -- Start with the base title
    v_title := p_base_title;
    
    -- Check if this title exists for this user
    LOOP
        SELECT EXISTS (
            SELECT 1 
            FROM public.sessions 
            WHERE user_id = p_user_id AND title = v_title
        ) INTO v_exists;
        
        EXIT WHEN NOT v_exists;
        
        -- Increment counter and append to title
        v_counter := v_counter + 1;
        v_title := p_base_title || ' (' || v_counter || ')';
    END LOOP;
    
    RETURN v_title;
END;
$$;

-- Update the create_session_secure function to use the new title generator
CREATE OR REPLACE FUNCTION public.create_session_secure(
    p_title text,
    p_description text DEFAULT '',
    p_settings jsonb DEFAULT '{}'::jsonb,
    p_max_participants integer DEFAULT 30
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_id uuid;
    v_unique_title text;
BEGIN
    -- Verify that the user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Generate a unique title
    v_unique_title := public.generate_unique_session_title(p_title, auth.uid());

    -- Create the session
    INSERT INTO public.sessions (
        title,
        description,
        settings,
        max_participants,
        user_id,
        status
    ) VALUES (
        v_unique_title,
        p_description,
        p_settings,
        p_max_participants,
        auth.uid(),
        'draft'
    )
    RETURNING id INTO v_session_id;

    RETURN v_session_id;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Failed to create session: %', SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_unique_session_title TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_session_secure TO authenticated; 