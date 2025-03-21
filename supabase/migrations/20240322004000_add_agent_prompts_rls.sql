-- Verify agent_prompts table structure and add RLS policies
DO $$ 
BEGIN
    -- Create the agent_prompts table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.agent_prompts (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
        style jsonb DEFAULT '{}'::jsonb,
        rules jsonb DEFAULT '[]'::jsonb,
        questions jsonb DEFAULT '[]'::jsonb,
        template_version text,
        base_prompt text,
        created_by uuid REFERENCES auth.users(id),
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now()
    );

    -- Enable RLS
    ALTER TABLE public.agent_prompts ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Agent prompts are viewable by authenticated users" ON public.agent_prompts;
    DROP POLICY IF EXISTS "Users can create agent prompts" ON public.agent_prompts;
    DROP POLICY IF EXISTS "Users can update their own agent prompts" ON public.agent_prompts;

    -- Create RLS policies
    CREATE POLICY "Agent prompts are viewable by authenticated users" ON public.agent_prompts
        FOR SELECT
        TO authenticated
        USING (true);

    CREATE POLICY "Users can create agent prompts" ON public.agent_prompts
        FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = created_by);

    CREATE POLICY "Users can update their own agent prompts" ON public.agent_prompts
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = created_by)
        WITH CHECK (auth.uid() = created_by);
END $$;

-- Create a secure function for creating agent prompts
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
    -- Verify that the user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if the user owns the agent
    SELECT created_by INTO v_agent_owner
    FROM public.agents
    WHERE id = p_agent_id;

    IF v_agent_owner != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized to create prompts for this agent';
    END IF;

    -- Insert the prompt
    INSERT INTO public.agent_prompts (
        agent_id,
        style,
        rules,
        questions,
        template_version,
        base_prompt,
        created_by
    ) VALUES (
        p_agent_id,
        p_style,
        p_rules,
        p_questions,
        p_template_version,
        p_base_prompt,
        auth.uid()
    )
    RETURNING id INTO v_prompt_id;

    RETURN v_prompt_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_agent_prompt_secure TO authenticated; 