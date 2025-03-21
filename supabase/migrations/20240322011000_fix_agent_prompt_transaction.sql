-- Drop existing function
DROP FUNCTION IF EXISTS public.create_agent_prompt_secure;

-- Recreate the function with transaction handling
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

    -- Start transaction
    BEGIN
        -- Lock the agent row to prevent concurrent modifications
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

        -- Commit transaction
        RETURN v_prompt_id;
    EXCEPTION
        WHEN others THEN
            -- Rollback transaction on error
            RAISE EXCEPTION 'Failed to create agent prompt: %', SQLERRM;
    END;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_agent_prompt_secure TO authenticated; 