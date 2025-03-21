-- Drop all existing session policies to avoid conflicts
DROP POLICY IF EXISTS "Sessions are viewable by everyone" ON public.sessions;
DROP POLICY IF EXISTS "Users can create sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow authenticated users to create sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow users to read own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow users to update own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Allow users to delete own sessions" ON public.sessions;
DROP POLICY IF EXISTS "sessions_owner_policy" ON public.sessions;
DROP POLICY IF EXISTS "sessions_read_policy" ON public.sessions;
DROP POLICY IF EXISTS "sessions_insert_policy" ON public.sessions;
DROP POLICY IF EXISTS "sessions_update_policy" ON public.sessions;

-- Enable RLS on sessions table
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Create a single comprehensive policy for session owners
CREATE POLICY "session_owner_policy" ON public.sessions
FOR ALL
TO authenticated
USING (
    auth.uid() = user_id
)
WITH CHECK (
    auth.uid() = user_id
);

-- Create a policy for public access to active sessions
CREATE POLICY "public_active_sessions_policy" ON public.sessions
FOR SELECT
USING (
    status = 'active' 
    AND deleted_at IS NULL
); 