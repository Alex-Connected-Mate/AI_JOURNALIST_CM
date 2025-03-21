-- Add user_id column to agent_prompts table
ALTER TABLE public.agent_prompts
ADD COLUMN user_id uuid REFERENCES auth.users(id);

-- Update existing rows to set user_id from the related agent's created_by
DO $$
BEGIN
    UPDATE public.agent_prompts ap
    SET user_id = a.created_by
    FROM public.agents a
    WHERE ap.agent_id = a.id
    AND ap.user_id IS NULL;
END $$;

-- Make user_id NOT NULL after updating existing rows
ALTER TABLE public.agent_prompts
ALTER COLUMN user_id SET NOT NULL;

-- Drop existing function to recreate with updated schema
DROP FUNCTION IF EXISTS public.create_agent_prompt_secure;

-- Recreate the function with the updated schema
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

    -- Verify agent ownership
    SELECT created_by INTO v_agent_owner
    FROM public.agents
    WHERE id = p_agent_id;

    IF v_agent_owner IS NULL OR v_agent_owner != auth.uid() THEN
        RAISE EXCEPTION 'Agent not found or not owned by user';
    END IF;

    -- Deactivate existing active prompts for this agent
    UPDATE public.agent_prompts
    SET is_active = false
    WHERE agent_id = p_agent_id
    AND is_active = true;

    -- Insert the new prompt
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
    WHEN others THEN
        RAISE EXCEPTION 'Failed to create agent prompt: %', SQLERRM;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_agent_prompt_secure TO authenticated; 