-- Remove walk-in appointment functionality
-- Every appointment must have a client associated with it

-- First, update any existing walk_in appointments to 'other' type
UPDATE appointments
SET type = 'other'
WHERE type = 'walk_in';

-- Update the appointments type check constraint to remove 'walk_in'
ALTER TABLE appointments 
DROP CONSTRAINT appointments_type_check;

ALTER TABLE appointments 
ADD CONSTRAINT appointments_type_check 
CHECK (type IN ('consultation', 'fitting', 'pickup', 'delivery', 'other'));

-- Remove allow_walk_ins column from calendar_settings
ALTER TABLE calendar_settings
DROP COLUMN IF EXISTS allow_walk_ins;

-- Make client_id NOT NULL (required for all appointments)
-- First, delete any appointments without a client_id (if any exist)
DELETE FROM appointments WHERE client_id IS NULL;

-- Then alter the column to be NOT NULL
ALTER TABLE appointments
ALTER COLUMN client_id SET NOT NULL;

-- Update the column comment to reflect the requirement
COMMENT ON COLUMN appointments.client_id IS 'Required reference to the client for this appointment';