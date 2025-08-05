-- Change default appointment status from 'confirmed' to 'pending'
-- This ensures all new appointments require confirmation

-- Update the default value for new appointments to be "pending"
ALTER TABLE appointments ALTER COLUMN status SET DEFAULT 'pending'::appointment_status;

-- Update the comment to clarify the workflow
COMMENT ON TYPE appointment_status IS 'Appointment status workflow: pending (initial request - awaiting client confirmation) → confirmed (client has confirmed) | declined/canceled (rejected) | no_show (missed). Appointments are considered complete when their end time has passed.';

-- Verify the change
-- SELECT column_default FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'status';