-- Add user_id column to session_agents table
ALTER TABLE public.session_agents
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Add index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_session_agents_user_id ON public.session_agents(user_id);

-- Add RLS policies for session_agents
ALTER TABLE public.session_agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own session agents" ON public.session_agents;
CREATE POLICY "Users can view their own session agents"
ON public.session_agents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own session agents" ON public.session_agents;
CREATE POLICY "Users can create their own session agents"
ON public.session_agents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own session agents" ON public.session_agents;
CREATE POLICY "Users can update their own session agents"
ON public.session_agents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own session agents" ON public.session_agents;
CREATE POLICY "Users can delete their own session agents"
ON public.session_agents
FOR DELETE
TO authenticated
USING (auth.uid() = user_id); 