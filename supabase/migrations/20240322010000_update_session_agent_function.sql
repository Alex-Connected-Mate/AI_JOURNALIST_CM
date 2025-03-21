-- Drop existing function
DROP FUNCTION IF EXISTS public.create_session_agent;

-- Recreate the function with proper parameter handling
CREATE OR REPLACE FUNCTION public.create_session_agent(
    p_agent_id uuid,
    p_configuration jsonb,
    p_is_primary boolean,
    p_session_id uuid,
    p_settings jsonb DEFAULT '{}'::jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_agent_id uuid;
    v_agent_owner uuid;
    v_session_owner uuid;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify agent ownership
    SELECT created_by INTO v_agent_owner
    FROM public.agents
    WHERE id = p_agent_id;

    IF v_agent_owner IS NULL OR v_agent_owner != auth.uid() THEN
        RAISE EXCEPTION 'Agent not found or not owned by user';
    END IF;

    -- Verify session ownership
    SELECT created_by INTO v_session_owner
    FROM public.sessions
    WHERE id = p_session_id;

    IF v_session_owner IS NULL OR v_session_owner != auth.uid() THEN
        RAISE EXCEPTION 'Session not found or not owned by user';
    END IF;

    -- Create the session agent
    INSERT INTO public.session_agents (
        agent_id,
        session_id,
        configuration,
        is_primary,
        settings,
        created_by
    ) VALUES (
        p_agent_id,
        p_session_id,
        p_configuration,
        p_is_primary,
        p_settings,
        auth.uid()
    )
    RETURNING id INTO v_session_agent_id;

    RETURN v_session_agent_id;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Failed to create session agent: %', SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_session_agent TO authenticated; 