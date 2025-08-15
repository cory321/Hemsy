-- Make accept_email and accept_sms non-nullable with default values
-- First, update any existing NULL values to false
UPDATE clients SET accept_email = false WHERE accept_email IS NULL;
UPDATE clients SET accept_sms = false WHERE accept_sms IS NULL;

-- Then alter the columns to be non-nullable with defaults
ALTER TABLE clients 
  ALTER COLUMN accept_email SET NOT NULL,
  ALTER COLUMN accept_email SET DEFAULT false,
  ALTER COLUMN accept_sms SET NOT NULL,
  ALTER COLUMN accept_sms SET DEFAULT false;
