-- Simplify users table
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