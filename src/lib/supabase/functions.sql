-- Fonction pour créer des notifications liées à une session
-- Cette fonction est définie comme SECURITY DEFINER pour éviter les problèmes de RLS
CREATE OR REPLACE FUNCTION create_session_notification(
  p_session_id UUID,
  p_title TEXT,
  p_message TEXT,
  p_type TEXT DEFAULT 'session'
) RETURNS JSONB 
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSONB;
  v_notification_ids UUID[];
  v_participant RECORD;
  v_user_id UUID;
  v_notification_id UUID;
BEGIN
  -- Vérifier que la session existe
  IF NOT EXISTS (SELECT 1 FROM sessions WHERE id = p_session_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Session not found'
    );
  END IF;
  
  -- Récupérer l'ID du propriétaire de la session
  SELECT user_id INTO v_user_id FROM sessions WHERE id = p_session_id;
  
  -- Créer une notification pour le propriétaire de la session
  INSERT INTO notifications (
    user_id,
    session_id,
    title,
    message,
    type,
    created_at
  ) VALUES (
    v_user_id,
    p_session_id,
    p_title,
    p_message,
    p_type,
    NOW()
  )
  RETURNING id INTO v_notification_id;
  
  v_notification_ids := array_append(v_notification_ids, v_notification_id);
  
  -- Créer des notifications pour tous les participants authentifiés
  FOR v_participant IN 
    SELECT 
      sp.user_id 
    FROM 
      session_participants sp
    WHERE 
      sp.session_id = p_session_id
      AND sp.user_id IS NOT NULL
      AND sp.user_id != v_user_id -- Éviter de créer une notification en double pour le propriétaire
  LOOP
    INSERT INTO notifications (
      user_id,
      session_id,
      title,
      message,
      type,
      created_at
    ) VALUES (
      v_participant.user_id,
      p_session_id,
      p_title,
      p_message,
      p_type,
      NOW()
    )
    RETURNING id INTO v_notification_id;
    
    v_notification_ids := array_append(v_notification_ids, v_notification_id);
  END LOOP;
  
  -- Préparer le résultat
  v_result := jsonb_build_object(
    'success', true,
    'count', array_length(v_notification_ids, 1),
    'notification_ids', v_notification_ids
  );
  
  RETURN v_result;
END;
$$;

-- Donner les droits d'exécution à tous les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION create_session_notification TO authenticated;

-- Fonction pour vérifier si un code de session est valide
-- Cette fonction est SECURITY DEFINER pour contourner les restrictions RLS
CREATE OR REPLACE FUNCTION verify_session_code(
  p_session_code TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_session_id UUID;
  v_session_name TEXT;
  v_session_status TEXT;
BEGIN
  -- Rechercher la session par code
  SELECT id, name, status 
  INTO v_session_id, v_session_name, v_session_status
  FROM sessions
  WHERE session_code = p_session_code;
  
  -- Vérifier si la session existe
  IF v_session_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Session introuvable'
    );
  END IF;
  
  -- Vérifier si la session est active ou en brouillon
  IF v_session_status != 'active' AND v_session_status != 'draft' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cette session n''est plus active'
    );
  END IF;
  
  -- Session valide, retourner les informations
  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'session_name', v_session_name,
    'session_status', v_session_status
  );
END;
$$;

-- Donner les droits d'exécution à tous les utilisateurs, même non authentifiés
GRANT EXECUTE ON FUNCTION verify_session_code TO anon, authenticated; 