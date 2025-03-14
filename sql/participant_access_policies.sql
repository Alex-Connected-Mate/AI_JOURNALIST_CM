-- Allow anonymous inserts into session_participants
CREATE POLICY anonymous_insert_participants
ON public.session_participants
FOR INSERT
WITH CHECK (
  -- Only allow creating participants for active sessions
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = session_participants.session_id
    AND sessions.status = 'active'
    AND sessions.deleted_at IS NULL
  )
);

-- Allow participants to update their own entry based on record ID
CREATE POLICY participant_update_own_entry
ON public.session_participants
FOR UPDATE
USING (
  -- Check if this participant ID is stored in the client
  -- This works for participants identified by their record ID stored in localStorage
  id::text = current_setting('request.jwt.claims', true)::json->>'participant_id'
)
WITH CHECK (
  id::text = current_setting('request.jwt.claims', true)::json->>'participant_id'
);

-- Allow participants to read their own information
CREATE POLICY participant_read_own
ON public.session_participants
FOR SELECT
USING (
  id::text = current_setting('request.jwt.claims', true)::json->>'participant_id'
);

-- Allow public read access to active sessions
CREATE POLICY public_read_active_sessions
ON public.sessions
FOR SELECT
USING (
  status = 'active' AND deleted_at IS NULL
);

-- Allow reading session participants for active sessions
CREATE POLICY read_session_participants
ON public.session_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sessions
    WHERE sessions.id = session_participants.session_id
    AND sessions.status = 'active'
    AND sessions.deleted_at IS NULL
  )
);

-- Allow participants to create chat messages
CREATE POLICY participant_create_chat_messages
ON public.chat_messages
FOR INSERT
WITH CHECK (
  participant_id::text = current_setting('request.jwt.claims', true)::json->>'participant_id'
);

-- Allow reading chat messages for participants in the same session
CREATE POLICY read_chat_messages
ON public.chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM session_participants
    WHERE session_participants.session_id = chat_messages.session_id
    AND session_participants.id::text = current_setting('request.jwt.claims', true)::json->>'participant_id'
  )
); 