-- Fix RLS policies for sessions table
-- First, drop existing conflicting policies
DROP POLICY IF EXISTS sessions_owner_policy ON sessions;
DROP POLICY IF EXISTS sessions_read_policy ON sessions;
DROP POLICY IF EXISTS sessions_insert_policy ON sessions;
DROP POLICY IF EXISTS sessions_update_policy ON sessions;

-- Create new comprehensive policies

-- Allow authenticated users to create sessions
CREATE POLICY "Users can create sessions"
ON public.sessions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- Allow users to read their own sessions
CREATE POLICY "Users can read own sessions"
ON public.sessions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  AND deleted_at IS NULL
);

-- Allow users to update their own sessions
CREATE POLICY "Users can update own sessions"
ON public.sessions
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND deleted_at IS NULL
)
WITH CHECK (
  auth.uid() = user_id
);

-- Allow users to delete their own sessions (soft delete)
CREATE POLICY "Users can delete own sessions"
ON public.sessions
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  AND deleted_at IS NULL
); 