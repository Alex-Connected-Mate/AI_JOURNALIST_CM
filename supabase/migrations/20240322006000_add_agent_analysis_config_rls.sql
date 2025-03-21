-- Enable RLS
ALTER TABLE public.agent_analysis_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own agent analysis configs"
    ON public.agent_analysis_config
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own agent analysis configs"
    ON public.agent_analysis_config
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent analysis configs"
    ON public.agent_analysis_config
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent analysis configs"
    ON public.agent_analysis_config
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create a secure function for creating agent analysis configs
CREATE OR REPLACE FUNCTION public.create_agent_analysis_config_secure(
    p_agent_id uuid,
    p_config jsonb
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_config_id uuid;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Verify agent ownership
    IF NOT EXISTS (
        SELECT 1 
        FROM public.agents 
        WHERE id = p_agent_id 
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Agent not found or not owned by user';
    END IF;

    -- Insert the config
    INSERT INTO public.agent_analysis_config (
        agent_id,
        user_id,
        config
    ) VALUES (
        p_agent_id,
        auth.uid(),
        p_config
    )
    RETURNING id INTO v_config_id;

    RETURN v_config_id;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Failed to create agent analysis config: %', SQLERRM;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.create_agent_analysis_config_secure TO authenticated; 