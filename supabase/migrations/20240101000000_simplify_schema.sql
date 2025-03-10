-- Remove all existing policies
DROP POLICY IF EXISTS users_policy ON users;
DROP POLICY IF EXISTS sessions_owner_policy ON sessions;
DROP POLICY IF EXISTS session_profiles_owner_policy ON session_profiles;
DROP POLICY IF EXISTS session_participants_owner_policy ON session_participants;
DROP POLICY IF EXISTS questions_owner_policy ON questions;
DROP POLICY IF EXISTS vote_results_owner_policy ON vote_results;
DROP POLICY IF EXISTS vote_settings_owner_policy ON vote_settings;
DROP POLICY IF EXISTS participant_votes_insert_policy ON participant_votes;
DROP POLICY IF EXISTS participant_votes_owner_view_policy ON participant_votes;
DROP POLICY IF EXISTS participant_vote_results_owner_policy ON participant_vote_results;
DROP POLICY IF EXISTS participant_vote_results_public_policy ON participant_vote_results;

-- Now we can safely modify the tables
ALTER TABLE users
  DROP COLUMN IF EXISTS openai_api_key,
  DROP COLUMN IF EXISTS role,
  DROP COLUMN IF EXISTS subscription_status,
  DROP COLUMN IF EXISTS subscription_end_date,
  DROP COLUMN IF EXISTS stripe_customer_id,
  DROP COLUMN IF EXISTS last_login,
  DROP COLUMN IF EXISTS deleted_at;

-- Drop unused tables
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS subscription_plans;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS user_metrics;
DROP TABLE IF EXISTS session_analytics;

-- Update sessions table
ALTER TABLE sessions
  DROP COLUMN IF EXISTS deleted_at,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  ADD COLUMN IF NOT EXISTS max_participants integer NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{
    "ai_configuration": {
      "model": "gpt-4",
      "temperature": 0.7,
      "max_tokens": 2000,
      "presence_penalty": 0,
      "frequency_penalty": 0,
      "custom_instructions": null
    },
    "participant_settings": {
      "anonymity_level": "semi-anonymous",
      "require_approval": false,
      "allow_chat": true,
      "allow_reactions": true
    }
  }'::jsonb;

-- Create new RLS policies with updated rules
CREATE POLICY users_read_policy ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY users_update_policy ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY sessions_read_policy ON sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY sessions_insert_policy ON sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY sessions_update_policy ON sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY session_profiles_read_policy ON session_profiles
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = session_profiles.session_id
    AND sessions.user_id = auth.uid()
  ));

CREATE POLICY session_participants_read_policy ON session_participants
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = session_participants.session_id
    AND sessions.user_id = auth.uid()
  ));

CREATE POLICY questions_read_policy ON questions
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = questions.session_id
    AND sessions.user_id = auth.uid()
  ));

CREATE POLICY vote_results_read_policy ON vote_results
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM questions
    JOIN sessions ON sessions.id = questions.session_id
    WHERE questions.id = vote_results.question_id
    AND sessions.user_id = auth.uid()
  ));

CREATE POLICY vote_settings_read_policy ON vote_settings
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = vote_settings.session_id
    AND sessions.user_id = auth.uid()
  ));

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE vote_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_vote_results ENABLE ROW LEVEL SECURITY;

-- Create new policies for session access
CREATE POLICY sessions_owner_policy ON sessions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY session_profiles_owner_policy ON session_profiles
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = session_profiles.session_id
    AND sessions.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = session_profiles.session_id
    AND sessions.user_id = auth.uid()
  ));

CREATE POLICY session_participants_owner_policy ON session_participants
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = session_participants.session_id
    AND sessions.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = session_participants.session_id
    AND sessions.user_id = auth.uid()
  ));

CREATE POLICY questions_owner_policy ON questions
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = questions.session_id
    AND sessions.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = questions.session_id
    AND sessions.user_id = auth.uid()
  ));

CREATE POLICY vote_results_owner_policy ON vote_results
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM questions
    JOIN sessions ON sessions.id = questions.session_id
    WHERE questions.id = vote_results.question_id
    AND sessions.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM questions
    JOIN sessions ON sessions.id = questions.session_id
    WHERE questions.id = vote_results.question_id
    AND sessions.user_id = auth.uid()
  ));

CREATE POLICY vote_settings_owner_policy ON vote_settings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = vote_settings.session_id
    AND sessions.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = vote_settings.session_id
    AND sessions.user_id = auth.uid()
  ));

-- Add settings column to sessions if it doesn't exist
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{
    "ai_configuration": {
      "model": "gpt-4",
      "temperature": 0.7,
      "max_tokens": 2000,
      "presence_penalty": 0,
      "frequency_penalty": 0,
      "custom_instructions": null
    },
    "participant_settings": {
      "anonymity_level": "semi-anonymous",
      "require_approval": false,
      "allow_chat": true,
      "allow_reactions": true
    }
  }'::jsonb; 