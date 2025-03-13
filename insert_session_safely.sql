-- ****************************************************************
-- FONCTION D'INSERTION SÉCURISÉE DE SESSION
-- ****************************************************************
-- Cette fonction permet d'insérer une session avec gestion des erreurs
-- sans utiliser de clause ON CONFLICT
-- ****************************************************************

-- Fonction pour insérer une session de manière sécurisée
CREATE OR REPLACE FUNCTION insert_session_safely(
  session_data JSON
) RETURNS JSON AS $$
DECLARE
  session_id UUID;
  session_record RECORD;
BEGIN
  -- Générer un nouvel ID pour la session
  session_id := uuid_generate_v4();
  
  -- Insérer la nouvelle session
  INSERT INTO sessions (
    id,
    user_id,
    name,
    title,
    description,
    status,
    access_code,
    created_at,
    updated_at,
    settings
  ) VALUES (
    session_id,
    (session_data->>'user_id')::UUID,
    session_data->>'title',
    session_data->>'title',
    COALESCE(session_data->>'description', ''),
    COALESCE(session_data->>'status', 'draft'),
    COALESCE(session_data->>'access_code', SUBSTRING(MD5(random()::TEXT) FROM 1 FOR 6)),
    NOW(),
    NOW(),
    COALESCE(session_data->'settings', '{}'::JSONB)
  )
  RETURNING * INTO session_record;
  
  -- Retourner les données de la session créée
  RETURN to_json(session_record);
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur lors de la création de la session: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 