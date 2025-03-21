-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can read own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;

-- Enable RLS on sessions table if not already enabled
ALTER TABLE public.sessions FORCE ROW LEVEL SECURITY;

-- Create more permissive insert policy
CREATE POLICY "Allow authenticated users to create sessions"
ON public.sessions
FOR INSERT
TO authenticated
WITH CHECK (
    -- Allow creation if user_id matches authenticated user
    auth.uid() = user_id OR
    -- Also allow if user is creating their first session
    NOT EXISTS (
        SELECT 1 FROM public.sessions 
        WHERE user_id = auth.uid()
    )
);

-- Policy for reading own sessions
CREATE POLICY "Allow users to read own sessions"
ON public.sessions
FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id AND
    deleted_at IS NULL
);

-- Policy for updating own sessions
CREATE POLICY "Allow users to update own sessions"
ON public.sessions
FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id AND
    deleted_at IS NULL
)
WITH CHECK (
    auth.uid() = user_id
);

-- Policy for soft deleting own sessions
CREATE POLICY "Allow users to delete own sessions"
ON public.sessions
FOR DELETE
TO authenticated
USING (
    auth.uid() = user_id AND
    deleted_at IS NULL
); 