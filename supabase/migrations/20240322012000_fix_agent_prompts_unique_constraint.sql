-- Drop existing unique constraint
ALTER TABLE public.agent_prompts DROP CONSTRAINT IF EXISTS unique_active_prompt_per_agent;

-- Add new unique constraint that includes is_active
ALTER TABLE public.agent_prompts
ADD CONSTRAINT unique_active_prompt_per_agent 
UNIQUE (agent_id) WHERE is_active = true;

-- Drop existing function
DROP FUNCTION IF EXISTS public.create_agent_prompt_secure;

-- Recreate function with better constraint handling
CREATE OR REPLACE FUNCTION public.create_agent_prompt_secure(
    p_agent_id uuid,
    p_style jsonb DEFAULT '{}'::jsonb,
    p_rules jsonb DEFAULT '[]'::jsonb,
    p_questions jsonb DEFAULT '[]'::jsonb,
    p_template_version text DEFAULT '1.0',
    p_base_prompt text DEFAULT ''
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_prompt_id uuid;
    v_agent_owner uuid;
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get agent owner and lock the row
    SELECT created_by INTO v_agent_owner
    FROM public.agents
    WHERE id = p_agent_id
    FOR UPDATE;

    IF v_agent_owner IS NULL OR v_agent_owner != auth.uid() THEN
        RAISE EXCEPTION 'Agent not found or not owned by user';
    END IF;

    -- Deactivate existing active prompts for this agent
    UPDATE public.agent_prompts
    SET is_active = false
    WHERE agent_id = p_agent_id
    AND is_active = true;

    -- Insert new prompt
    INSERT INTO public.agent_prompts (
        agent_id,
        user_id,
        style,
        rules,
        questions,
        template_version,
        base_prompt,
        is_active
    ) VALUES (
        p_agent_id,
        auth.uid(),
        p_style,
        p_rules,
        p_questions,
        p_template_version,
        p_base_prompt,
        true
    )
    RETURNING id INTO v_prompt_id;

    RETURN v_prompt_id;
EXCEPTION
    WHEN unique_violation THEN
        -- Should not happen with new constraint, but handle just in case
        RAISE EXCEPTION 'Failed to create agent prompt: Another active prompt exists';
    WHEN others THEN
        RAISE EXCEPTION 'Failed to create agent prompt: %', SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_agent_prompt_secure TO authenticated; 