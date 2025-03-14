-- fix_session_codes.sql
-- This script updates any sessions that have null code or session_code values

-- Function to generate a random alphanumeric code of length 6
CREATE OR REPLACE FUNCTION generate_random_code() RETURNS text AS $$
DECLARE
  chars text[] := '{0,1,2,3,4,5,6,7,8,9,A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z}';
  result text := '';
  i integer := 0;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || chars[1+random()*(array_length(chars, 1)-1)];
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update sessions with NULL code
UPDATE sessions
SET 
    code = generate_random_code()
WHERE 
    code IS NULL;

-- Update sessions with NULL session_code
UPDATE sessions
SET 
    session_code = generate_random_code()
WHERE 
    session_code IS NULL;

-- Optional: Create a trigger to ensure codes are never NULL for new sessions
CREATE OR REPLACE FUNCTION ensure_session_codes()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if code is NULL and set it if needed
  IF NEW.code IS NULL THEN
    NEW.code := generate_random_code();
  END IF;
  
  -- Check if session_code is NULL and set it if needed
  IF NEW.session_code IS NULL THEN
    NEW.session_code := generate_random_code();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS ensure_session_codes_trigger ON sessions;
CREATE TRIGGER ensure_session_codes_trigger
BEFORE INSERT OR UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION ensure_session_codes();

-- Display results
SELECT id, name, title, code, session_code
FROM sessions
ORDER BY created_at DESC
LIMIT 10; 