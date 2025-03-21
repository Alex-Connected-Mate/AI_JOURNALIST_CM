-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.create_session_agent;

-- Recreate the function with proper session_id validation
CREATE OR REPLACE FUNCTION public.create_session_agent(
    p_session_id uuid,
    p_agent_id uuid,
    p_analysis_type text DEFAULT 'default'::text,
    p_parameters jsonb DEFAULT '{}'::jsonb,
    p_enabled boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_session_owner_id uuid;
    v_agent_owner_id uuid;
    v_session_agent_id uuid;
BEGIN
    -- Get the current user's ID
    v_user_id := auth.uid();
    
    -- Verify user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify session_id is not null
    IF p_session_id IS NULL THEN
        RAISE EXCEPTION 'Session ID cannot be null';
    END IF;

    -- Get session owner
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
        p_analysis_type,
        p_parameters,
        p_enabled,
        v_user_id
    )
    RETURNING id INTO v_session_agent_id;

    RETURN v_session_agent_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_session_agent TO authenticated; 