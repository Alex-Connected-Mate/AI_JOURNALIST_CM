-- Find a valid user ID first (replace with your own if you know it)
SELECT id FROM auth.users LIMIT 1;
-- Create test session with proper settings structure
INSERT INTO public.sessions (user_id, name, title, status, code, session_code, settings, max_participants) VALUES ('YOUR_USER_ID_HERE', 'Test Session', 'Test Session', 'active', 'TEST123', 'TEST123', '{"connection": {"anonymityLevel": "semi-anonymous", "approvalRequired": false}, "professorName": "Test Professor", "maxParticipants": 30}'::jsonb, 30) RETURNING id, code, session_code, settings;
