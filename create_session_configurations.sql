-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create session_configurations table
CREATE TABLE IF NOT EXISTS public.session_configurations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES sessions(id),
    configuration JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.session_configurations;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.session_configurations
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_configurations_session_id ON public.session_configurations(session_id);
CREATE INDEX IF NOT EXISTS idx_session_configurations_updated_at ON public.session_configurations(updated_at);

-- Add RLS policies
ALTER TABLE public.session_configurations ENABLE ROW LEVEL SECURITY;

-- Policy for select
CREATE POLICY "Allow select for authenticated users" ON public.session_configurations
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy for insert
CREATE POLICY "Allow insert for authenticated users" ON public.session_configurations
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy for update
CREATE POLICY "Allow update for authenticated users" ON public.session_configurations
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy for delete
CREATE POLICY "Allow delete for authenticated users" ON public.session_configurations
    FOR DELETE
    TO authenticated
    USING (true);

-- Grant permissions
GRANT ALL ON public.session_configurations TO authenticated;
GRANT ALL ON public.session_configurations TO service_role; 