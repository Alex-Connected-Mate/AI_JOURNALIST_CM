-- Drop existing constraints if they exist
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_name_agent_type_key;
    EXCEPTION WHEN OTHERS THEN
        -- Ignore any errors
    END;
END $$;

-- Add unique constraint to agents table
ALTER TABLE public.agents
ADD CONSTRAINT agents_name_agent_type_key UNIQUE (name, agent_type);

-- Update or create the agents table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.agents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    agent_type text NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on agents table
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agents
CREATE POLICY "Agents are viewable by authenticated users" ON public.agents
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create agents" ON public.agents
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own agents" ON public.agents
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by); 