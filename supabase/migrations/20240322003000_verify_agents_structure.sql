-- Verify agents table structure and add missing constraints if needed
DO $$ 
BEGIN
    -- Check if the agents table exists
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'agents'
    ) THEN
        -- Create the agents table if it doesn't exist
        CREATE TABLE public.agents (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            name text NOT NULL,
            description text,
            agent_type text NOT NULL,
            created_by uuid REFERENCES auth.users(id),
            is_active boolean DEFAULT true,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
        );

        -- Enable RLS
        ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Check if the unique constraint exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'agents_name_agent_type_key'
    ) THEN
        -- Add the unique constraint
        ALTER TABLE public.agents
        ADD CONSTRAINT agents_name_agent_type_key UNIQUE (name, agent_type);
    END IF;

    -- Verify RLS policies
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'agents' 
        AND policyname = 'Agents are viewable by authenticated users'
    ) THEN
        CREATE POLICY "Agents are viewable by authenticated users" ON public.agents
            FOR SELECT
            TO authenticated
            USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'agents' 
        AND policyname = 'Users can create agents'
    ) THEN
        CREATE POLICY "Users can create agents" ON public.agents
            FOR INSERT
            TO authenticated
            WITH CHECK (auth.uid() = created_by);
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE tablename = 'agents' 
        AND policyname = 'Users can update their own agents'
    ) THEN
        CREATE POLICY "Users can update their own agents" ON public.agents
            FOR UPDATE
            TO authenticated
            USING (auth.uid() = created_by)
            WITH CHECK (auth.uid() = created_by);
    END IF;

    -- Create or replace the function to safely create an agent
    CREATE OR REPLACE FUNCTION public.create_agent_secure(
        p_name text,
        p_description text,
        p_agent_type text,
        p_is_active boolean DEFAULT true
    ) RETURNS uuid
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        v_agent_id uuid;
    BEGIN
        -- Verify that the user is authenticated
        IF auth.uid() IS NULL THEN
            RAISE EXCEPTION 'Not authenticated';
        END IF;

        -- Insert the agent with a unique constraint
        INSERT INTO public.agents (
            name,
            description,
            agent_type,
            created_by,
            is_active
        ) VALUES (
            p_name,
            p_description,
            p_agent_type,
            auth.uid(),
            p_is_active
        )
        ON CONFLICT (name, agent_type) 
        DO UPDATE SET
            description = EXCLUDED.description,
            is_active = EXCLUDED.is_active,
            updated_at = now()
        RETURNING id INTO v_agent_id;

        RETURN v_agent_id;
    END;
    $$;

    -- Grant execute permission to authenticated users
    GRANT EXECUTE ON FUNCTION public.create_agent_secure TO authenticated;

END $$; 