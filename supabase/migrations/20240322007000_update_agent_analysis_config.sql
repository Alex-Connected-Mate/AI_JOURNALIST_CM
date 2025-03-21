-- Add user_id column to agent_analysis_config
ALTER TABLE public.agent_analysis_config
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Update existing rows to set user_id from the related agent
UPDATE public.agent_analysis_config
SET user_id = agents.created_by
FROM public.agents
WHERE agent_analysis_config.agent_id = agents.id;

-- Make user_id NOT NULL after updating existing rows
ALTER TABLE public.agent_analysis_config
ALTER COLUMN user_id SET NOT NULL;

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Users can view their own agent analysis configs" ON public.agent_analysis_config;
DROP POLICY IF EXISTS "Users can insert their own agent analysis configs" ON public.agent_analysis_config;
DROP POLICY IF EXISTS "Users can update their own agent analysis configs" ON public.agent_analysis_config;
DROP POLICY IF EXISTS "Users can delete their own agent analysis configs" ON public.agent_analysis_config;

-- Create new RLS policies
CREATE POLICY "Users can view their own agent analysis configs"
    ON public.agent_analysis_config
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent analysis configs"
    ON public.agent_analysis_config
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

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
    p_analysis_type text,
    p_parameters jsonb DEFAULT '{}'::jsonb,
    p_enabled boolean DEFAULT true
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_config_id uuid;
    v_agent_owner uuid;
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

    -- Insert the config
    INSERT INTO public.agent_analysis_config (
        agent_id,
        user_id,
        analysis_type,
        parameters,
        enabled
    ) VALUES (
        p_agent_id,
        auth.uid(),
        p_analysis_type,
        p_parameters,
        p_enabled
    )
    RETURNING id INTO v_config_id;

    RETURN v_config_id;
EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Failed to create agent analysis config: %', SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_agent_analysis_config_secure TO authenticated; 