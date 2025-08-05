-- Optimize appointment indexes for time-range queries at scale

-- Drop existing suboptimal indexes
DROP INDEX IF EXISTS idx_appointments_shop_date;
DROP INDEX IF EXISTS idx_appointments_date_range;

-- Create optimized composite index for time-range queries
-- This is the primary index for calendar views
CREATE INDEX idx_appointments_shop_date_time 
ON appointments(shop_id, date, start_time, end_time) 
WHERE status NOT IN ('cancelled', 'no_show');

-- Index for month view queries (covers the most common use case)
CREATE INDEX idx_appointments_shop_month 
ON appointments(shop_id, date) 
WHERE status NOT IN ('cancelled', 'no_show');

-- Index for client-specific appointment queries
CREATE INDEX idx_appointments_shop_client_date 
ON appointments(shop_id, client_id, date) 
WHERE status NOT IN ('cancelled', 'no_show')
AND client_id IS NOT NULL;

-- Partial index for active appointments only (scheduled/confirmed)
CREATE INDEX idx_appointments_active 
ON appointments(shop_id, date, start_time) 
WHERE status IN ('scheduled', 'confirmed');

-- BRIN index for very large datasets (efficient for date ranges)
-- BRIN indexes are extremely space-efficient for sorted data
CREATE INDEX idx_appointments_date_brin 
ON appointments USING BRIN(date)
WITH (pages_per_range = 128);

-- Index for quick status checks
CREATE INDEX idx_appointments_status_date
ON appointments(status, shop_id, date)
WHERE status IN ('scheduled', 'confirmed');

-- Analyze the table to update statistics
ANALYZE appointments;

-- Create atomic appointment creation function with built-in conflict detection
CREATE OR REPLACE FUNCTION create_appointment_atomic(
  p_shop_id UUID,
  p_client_id UUID,
  p_title TEXT,
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
  
  -- Create appointment
  INSERT INTO appointments (
    shop_id, client_id, title, date, 
    start_time, end_time, type, notes, status
  ) VALUES (
    p_shop_id, p_client_id, p_title, p_date,
    p_start_time, p_end_time, p_type, p_notes, 'scheduled'
  )
  RETURNING * INTO v_appointment;
  
  RETURN v_appointment;
END;
$$;

-- Create function for efficient time-range queries
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
  title TEXT,
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
    a.title,
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

-- Create function to get appointment counts by date (for month view optimization)
CREATE OR REPLACE FUNCTION get_appointment_counts_by_date(
  p_shop_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  date DATE,
  total_count INTEGER,
  scheduled_count INTEGER,
  confirmed_count INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.date,
    COUNT(*)::INTEGER AS total_count,
    COUNT(*) FILTER (WHERE a.status = 'scheduled')::INTEGER AS scheduled_count,
    COUNT(*) FILTER (WHERE a.status = 'confirmed')::INTEGER AS confirmed_count
  FROM appointments a
  WHERE a.shop_id = p_shop_id
    AND a.date >= p_start_date
    AND a.date <= p_end_date
    AND a.status IN ('scheduled', 'confirmed')
  GROUP BY a.date
  ORDER BY a.date;
END;
$$;

-- Add comment explaining index strategy
COMMENT ON INDEX idx_appointments_shop_date_time IS 
'Primary index for time-range queries in calendar views. Excludes cancelled/no-show for better performance.';

COMMENT ON INDEX idx_appointments_date_brin IS 
'BRIN index for efficient scanning of large date ranges. Ideal for shops with 100k+ appointments.';