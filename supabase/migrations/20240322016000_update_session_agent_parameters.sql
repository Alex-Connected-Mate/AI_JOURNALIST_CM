-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.create_session_agent;

-- Recreate the function with updated parameters
CREATE OR REPLACE FUNCTION public.create_session_agent(
    p_agent_id uuid,
    p_configuration jsonb DEFAULT NULL,
    p_is_primary boolean DEFAULT true,
    p_settings jsonb DEFAULT NULL,
    p_session_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_session_owner_id uuid;
    v_agent_owner_id uuid;
    v_session_agent_id uuid;
    v_analysis_type text;
    v_parameters jsonb;
    v_enabled boolean;
BEGIN
    -- Get the current user's ID
    v_user_id := auth.uid();
    
    -- Verify user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify session_id is provided
    IF p_session_id IS NULL THEN
        RAISE EXCEPTION 'Session ID is required';
    END IF;

    -- Extract parameters from configuration if provided
    IF p_configuration IS NOT NULL THEN
        v_analysis_type := p_configuration->>'type';
        v_parameters := p_configuration->'parameters';
        v_enabled := COALESCE((p_configuration->>'enabled')::boolean, true);
    ELSE
        v_analysis_type := 'default';
        v_parameters := '{}';
        v_enabled := true;
    END IF;

    -- Get agent owner
    SELECT user_id INTO v_agent_owner_id
    FROM public.agents
    WHERE id = p_agent_id;

    -- Verify agent exists and user owns it
    IF v_agent_owner_id IS NULL THEN
        RAISE EXCEPTION 'Agent not found';
    END IF;

    IF v_agent_owner_id != v_user_id THEN
        RAISE EXCEPTION 'Not authorized to use this agent';
    END IF;

    -- Verify session ownership
    SELECT user_id INTO v_session_owner_id
    FROM public.sessions
    WHERE id = p_session_id;

    -- Verify session exists and user owns it
    IF v_session_owner_id IS NULL THEN
        RAISE EXCEPTION 'Session not found';
    END IF;

    IF v_session_owner_id != v_user_id THEN
        RAISE EXCEPTION 'Not authorized to modify this session';
    END IF;

    -- Insert the session agent
    INSERT INTO public.session_agents (
        session_id,
        agent_id,
        analysis_type,
        parameters,
        enabled,
        user_id
    )
    VALUES (
        p_session_id,
        p_agent_id,
        v_analysis_type,
        v_parameters,
        v_enabled,
        v_user_id
    )
    RETURNING id INTO v_session_agent_id;

    RETURN v_session_agent_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_session_agent TO authenticated; 