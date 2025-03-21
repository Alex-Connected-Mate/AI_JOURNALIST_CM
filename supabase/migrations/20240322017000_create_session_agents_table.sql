-- Create the session_agents table
CREATE TABLE IF NOT EXISTS public.session_agents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
    agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
    analysis_type text NOT NULL DEFAULT 'default',
    parameters jsonb DEFAULT '{}',
    enabled boolean DEFAULT true,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.session_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own session agents"
    ON public.session_agents
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own session agents"
    ON public.session_agents
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own session agents"
    ON public.session_agents
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own session agents"
    ON public.session_agents
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Add indexes for better performance
CREATE INDEX idx_session_agents_session_id ON public.session_agents(session_id);
CREATE INDEX idx_session_agents_agent_id ON public.session_agents(agent_id);
CREATE INDEX idx_session_agents_user_id ON public.session_agents(user_id);

-- Add trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.session_agents
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at(); 