-- Create appointment status enum
CREATE TYPE appointment_status AS ENUM (
  'pending',
  'declined', 
  'scheduled',
  'confirmed',
  'canceled',
  'no_show',
  'completed'
);

-- Update appointments table to use the enum
-- First, add a new column with the enum type
ALTER TABLE appointments ADD COLUMN status_new appointment_status;

-- Migrate existing data, mapping 'cancelled' to 'canceled' for consistency
UPDATE appointments SET status_new = 
  CASE 
    WHEN status = 'cancelled' THEN 'canceled'::appointment_status
    ELSE status::appointment_status
  END;

-- Make the new column NOT NULL with default
ALTER TABLE appointments ALTER COLUMN status_new SET NOT NULL;
ALTER TABLE appointments ALTER COLUMN status_new SET DEFAULT 'scheduled'::appointment_status;

-- Drop the old column and rename the new one
ALTER TABLE appointments DROP COLUMN status;
ALTER TABLE appointments RENAME COLUMN status_new TO status;

-- Update the check_appointment_conflict function to use the new enum values
CREATE OR REPLACE FUNCTION check_appointment_conflict(
  p_shop_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_exists BOOLEAN;
  buffer_minutes INTEGER;
BEGIN
  -- Get buffer time settings
  SELECT COALESCE(cs.buffer_time_minutes, 0) INTO buffer_minutes
  FROM calendar_settings cs
  WHERE cs.shop_id = p_shop_id;

  -- Check for conflicts including buffer time
  -- Updated to exclude 'canceled', 'declined', 'no_show', and 'completed' statuses
  SELECT EXISTS(
    SELECT 1
    FROM appointments a
    WHERE a.shop_id = p_shop_id
      AND a.date = p_date
      AND a.status NOT IN ('canceled', 'declined', 'no_show', 'completed')
      AND (p_appointment_id IS NULL OR a.id != p_appointment_id)
      AND (
        -- Check if new appointment overlaps with existing (including buffer)
        (p_start_time - (buffer_minutes || ' minutes')::INTERVAL, p_end_time + (buffer_minutes || ' minutes')::INTERVAL) 
        OVERLAPS 
        (a.start_time - (buffer_minutes || ' minutes')::INTERVAL, a.end_time + (buffer_minutes || ' minutes')::INTERVAL)
      )
  ) INTO conflict_exists;

  RETURN conflict_exists;
END;
$$ LANGUAGE plpgsql;

-- Add comment to document the enum values
COMMENT ON TYPE appointment_status IS 'Appointment status values: pending (initial), declined (rejected), scheduled (booked), confirmed (verified), canceled (cancelled), no_show (missed), completed (finished)';