-- Migration for AI Prompt Configuration and OpenAI Assistants

-- Create agent_prompts table to store prompt configurations
CREATE TABLE IF NOT EXISTS agent_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('nuggets', 'lightbulbs')),
  agent_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  style_description TEXT NOT NULL,
  rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_context TEXT,
  raw_prompt TEXT,
  generated_prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Ensure only one configuration per workshop and agent type
  UNIQUE (workshop_id, agent_type)
);

-- Enable RLS on agent_prompts table
ALTER TABLE agent_prompts ENABLE ROW LEVEL SECURITY;

-- Create policy for agent_prompts table
CREATE POLICY "Admins and teachers can manage agent prompts" ON agent_prompts
  USING (
    auth.uid() IN (
      SELECT user_id FROM workshop_participants
      WHERE workshop_id = agent_prompts.workshop_id AND role IN ('admin', 'teacher')
    )
  );

-- Create ai_assistants table to store OpenAI assistant information
CREATE TABLE IF NOT EXISTS ai_assistants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('nuggets', 'lightbulbs')),
  assistant_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure only one assistant per workshop and agent type
  UNIQUE (workshop_id, agent_type)
);

-- Enable RLS on ai_assistants table
ALTER TABLE ai_assistants ENABLE ROW LEVEL SECURITY;

-- Create policy for ai_assistants table
CREATE POLICY "Admins and teachers can manage AI assistants" ON ai_assistants
  USING (
    auth.uid() IN (
      SELECT user_id FROM workshop_participants
      WHERE workshop_id = ai_assistants.workshop_id AND role IN ('admin', 'teacher')
    )
  );

-- Create ai_threads table to store OpenAI thread information
CREATE TABLE IF NOT EXISTS ai_threads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id TEXT NOT NULL UNIQUE,
  assistant_id TEXT NOT NULL,
  participant_id UUID NOT NULL REFERENCES workshop_participants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Enable RLS on ai_threads table
ALTER TABLE ai_threads ENABLE ROW LEVEL SECURITY;

-- Create policy for ai_threads table
CREATE POLICY "Participants can view their own threads" ON ai_threads
  USING (
    auth.uid() IN (
      SELECT wp.user_id FROM workshop_participants wp
      WHERE wp.id = ai_threads.participant_id
    )
  );

CREATE POLICY "Admins and teachers can view all threads in their workshops" ON ai_threads
  USING (
    auth.uid() IN (
      SELECT wp_admin.user_id FROM workshop_participants wp_admin
      JOIN workshop_participants wp_participant ON wp_admin.workshop_id = wp_participant.workshop_id
      WHERE wp_participant.id = ai_threads.participant_id
      AND wp_admin.role IN ('admin', 'teacher')
    )
  );

-- Create ai_messages table to store conversation messages
CREATE TABLE IF NOT EXISTS ai_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_id TEXT NOT NULL REFERENCES ai_threads(thread_id) ON DELETE CASCADE,
  message_id TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on ai_messages table
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;

-- Create policy for ai_messages table
CREATE POLICY "Participants can view their own messages" ON ai_messages
  USING (
    ai_messages.thread_id IN (
      SELECT thread_id FROM ai_threads
      WHERE participant_id IN (
        SELECT id FROM workshop_participants
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins and teachers can view all messages in their workshops" ON ai_messages
  USING (
    ai_messages.thread_id IN (
      SELECT at.thread_id FROM ai_threads at
      JOIN workshop_participants wp_participant ON wp_participant.id = at.participant_id
      JOIN workshop_participants wp_admin ON wp_admin.workshop_id = wp_participant.workshop_id
      WHERE wp_admin.user_id = auth.uid() AND wp_admin.role IN ('admin', 'teacher')
    )
  );

-- Create or replace function to handle message timestamps
CREATE OR REPLACE FUNCTION handle_new_ai_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the thread's updated_at timestamp
  UPDATE ai_threads
  SET updated_at = NOW()
  WHERE thread_id = NEW.thread_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ai_messages
CREATE TRIGGER on_ai_message_inserted
  AFTER INSERT ON ai_messages
  FOR EACH ROW
  EXECUTE PROCEDURE handle_new_ai_message(); 