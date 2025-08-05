-- Update all existing "scheduled" appointments to "confirmed"
-- This migration changes the default appointment status from "scheduled" to "confirmed"

-- Update existing appointments
UPDATE appointments 
SET status = 'confirmed'::appointment_status 
WHERE status = 'scheduled'::appointment_status;

-- Update the default value for new appointments to be "confirmed" instead of "scheduled"
ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'confirmed'::appointment_status;

-- Update the check_appointment_conflict function to exclude different statuses
-- (This maintains the same logic but updates comments for clarity)
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
  -- Exclude canceled, declined, no_show, and completed appointments from conflict checking
  -- Active statuses that should block time slots: pending, confirmed
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

-- Add a comment documenting the status workflow
COMMENT ON TYPE appointment_status IS 'Appointment status workflow: pending (initial request) → confirmed (accepted/scheduled) → completed (finished) | declined/canceled (rejected) | no_show (missed)';

-- Verify the update
-- SELECT status, COUNT(*) as count FROM appointments GROUP BY status ORDER BY status;