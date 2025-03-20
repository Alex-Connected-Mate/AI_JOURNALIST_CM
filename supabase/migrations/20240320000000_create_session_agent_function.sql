-- Create the function to safely create a session agent
CREATE OR REPLACE FUNCTION public.create_session_agent(
    p_session_id UUID,
    p_agent_id UUID,
    p_is_primary BOOLEAN DEFAULT false,
    p_configuration JSONB DEFAULT '{}'::jsonb,
    p_settings JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Vérifier si l'agent principal existe déjà pour cette session
    IF p_is_primary THEN
        UPDATE session_agents 
        SET is_primary = false 
        WHERE session_id = p_session_id AND is_primary = true;
    END IF;

    -- Insérer le nouvel agent de session
    INSERT INTO session_agents (
        session_id,
        agent_id,
        is_primary,
        configuration,
        settings
    ) VALUES (
        p_session_id,
        p_agent_id,
        p_is_primary,
        p_configuration,
        COALESCE(p_settings, '{
            "visibility": true,
            "interaction_mode": "auto",
            "response_delay": 0,
            "participation_rules": {}
        }'::jsonb)
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$; 