-- Drop existing function
DROP FUNCTION IF EXISTS public.create_session_agent;

-- Recreate function with optional session_id parameter
CREATE OR REPLACE FUNCTION public.create_session_agent(
    p_agent_id uuid,
    p_configuration jsonb DEFAULT '{}'::jsonb,
    p_is_primary boolean DEFAULT false,
    p_settings jsonb DEFAULT '{}'::jsonb,
    p_session_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agent_id uuid;
    v_agent_owner uuid;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get agent owner and verify ownership
    SELECT created_by INTO v_agent_owner
    FROM public.agents
    WHERE id = p_agent_id
    FOR UPDATE;

    IF v_agent_owner IS NULL OR v_agent_owner != auth.uid() THEN
        RAISE EXCEPTION 'Agent not found or not owned by user';
    END IF;

    -- Insert new session agent
    INSERT INTO public.session_agents (
        agent_id,
        user_id,
        configuration,
        is_primary,
        settings,
        session_id
    ) VALUES (
        p_agent_id,
        auth.uid(),
        p_configuration,
        p_is_primary,
        p_settings,
        p_session_id
    )
    RETURNING agent_id INTO v_agent_id;

    RETURN v_agent_id;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Failed to create session agent: %', SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_session_agent TO authenticated; 