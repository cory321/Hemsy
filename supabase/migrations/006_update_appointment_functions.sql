-- Update appointment functions to remove title column references

-- Update create_appointment_atomic function to remove title parameter
CREATE OR REPLACE FUNCTION create_appointment_atomic(
  p_shop_id UUID,
  p_client_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_type TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS appointments
LANGUAGE plpgsql
AS $$
DECLARE
  v_appointment appointments;
  v_conflict_exists BOOLEAN;
  v_buffer_minutes INTEGER;
BEGIN
  -- Get buffer time settings
  SELECT COALESCE(cs.buffer_time_minutes, 0) INTO v_buffer_minutes
  FROM calendar_settings cs
  WHERE cs.shop_id = p_shop_id;

  -- Check for conflicts in a single query with buffer time
  WITH conflict_check AS (
    SELECT EXISTS(
      SELECT 1
      FROM appointments a
      WHERE a.shop_id = p_shop_id
        AND a.date = p_date
        AND a.status NOT IN ('cancelled', 'no_show')
        AND (
          -- Check if new appointment overlaps with existing (including buffer)
          (p_start_time - (v_buffer_minutes || ' minutes')::INTERVAL, 
           p_end_time + (v_buffer_minutes || ' minutes')::INTERVAL) 
          OVERLAPS 
          (a.start_time - (v_buffer_minutes || ' minutes')::INTERVAL, 
           a.end_time + (v_buffer_minutes || ' minutes')::INTERVAL)
        )
    ) AS has_conflict
  )
  SELECT has_conflict INTO v_conflict_exists FROM conflict_check;
  
  IF v_conflict_exists THEN
    RAISE EXCEPTION 'Time slot conflict detected' USING ERRCODE = 'P0001';
  END IF;
  
  -- Check if within working hours
  IF NOT check_within_working_hours(p_shop_id, p_date, p_start_time, p_end_time) THEN
    RAISE EXCEPTION 'Appointment outside working hours' USING ERRCODE = 'P0002';
  END IF;
  
  -- Create appointment (removed title from INSERT)
  INSERT INTO appointments (
    shop_id, client_id, date, 
    start_time, end_time, type, notes, status
  ) VALUES (
    p_shop_id, p_client_id, p_date,
    p_start_time, p_end_time, p_type, p_notes, 'scheduled'
  )
  RETURNING * INTO v_appointment;
  
  RETURN v_appointment;
END;
$$;

-- Update get_appointments_time_range function to remove title column
CREATE OR REPLACE FUNCTION get_appointments_time_range(
  p_shop_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_include_cancelled BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  shop_id UUID,
  client_id UUID,
  order_id UUID,
  date DATE,
  start_time TIME,
  end_time TIME,
  type TEXT,
  status TEXT,
  notes TEXT,
  reminder_sent BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  client_first_name TEXT,
  client_last_name TEXT,
  client_email TEXT,
  client_phone_number TEXT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.shop_id,
    a.client_id,
    a.order_id,
    a.date,
    a.start_time,
    a.end_time,
    a.type,
    a.status,
    a.notes,
    a.reminder_sent,
    a.created_at,
    a.updated_at,
    c.first_name AS client_first_name,
    c.last_name AS client_last_name,
    c.email AS client_email,
    c.phone_number AS client_phone_number
  FROM appointments a
  LEFT JOIN clients c ON a.client_id = c.id
  WHERE a.shop_id = p_shop_id
    AND a.date >= p_start_date
    AND a.date <= p_end_date
    AND (p_include_cancelled OR a.status NOT IN ('cancelled', 'no_show'))
  ORDER BY a.date, a.start_time;
END;
$$;