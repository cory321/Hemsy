-- Migration to remove 'completed' status from appointments
-- First, update any appointments with 'completed' status to 'confirmed'

-- Update existing completed appointments to confirmed
UPDATE appointments 
SET status = 'confirmed'::appointment_status 
WHERE status = 'completed'::appointment_status;

-- Create a new enum type without 'completed'
CREATE TYPE appointment_status_new AS ENUM (
  'pending',
  'declined',
  'confirmed',
  'canceled',
  'no_show'
);

-- Update the appointments table to use the new enum
ALTER TABLE appointments 
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE appointment_status_new 
    USING status::text::appointment_status_new,
  ALTER COLUMN status SET DEFAULT 'confirmed'::appointment_status_new;

-- Drop the old enum type
DROP TYPE appointment_status;

-- Rename the new enum type to the original name
ALTER TYPE appointment_status_new RENAME TO appointment_status;

-- Update the check_appointment_conflict function to remove 'completed' from the exclusion list
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
  -- Exclude canceled, declined, and no_show appointments from conflict checking
  -- Active statuses that should block time slots: pending, confirmed
  SELECT EXISTS(
    SELECT 1
    FROM appointments a
    WHERE a.shop_id = p_shop_id
      AND a.date = p_date
      AND a.status NOT IN ('canceled', 'declined', 'no_show')
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

-- Update the comment to reflect the new status workflow
COMMENT ON TYPE appointment_status IS 'Appointment status workflow: pending (initial request) → confirmed (accepted/scheduled) | declined/canceled (rejected) | no_show (missed). Appointments are considered complete when their end time has passed.';

-- Verify the migration
-- SELECT status, COUNT(*) as count FROM appointments GROUP BY status ORDER BY status;