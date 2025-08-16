-- Remove 'week' from service unit constraints
-- This migration updates the check constraints on both services and garment_services tables
-- to only allow 'item', 'hour', and 'day' as valid units

BEGIN;

-- Update the services table constraint
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_default_unit_check;
ALTER TABLE services ADD CONSTRAINT services_default_unit_check 
  CHECK (default_unit = ANY (ARRAY['item'::text, 'hour'::text, 'day'::text]));

-- Update the garment_services table constraint
ALTER TABLE garment_services DROP CONSTRAINT IF EXISTS garment_services_unit_check;
ALTER TABLE garment_services ADD CONSTRAINT garment_services_unit_check 
  CHECK (unit = ANY (ARRAY['item'::text, 'hour'::text, 'day'::text]));

-- Update any existing 'week' values to 'day' (or you could choose a different default)
-- This prevents constraint violations
UPDATE services SET default_unit = 'day' WHERE default_unit = 'week';
UPDATE garment_services SET unit = 'day' WHERE unit = 'week';

-- Add a comment explaining the valid values
COMMENT ON COLUMN services.default_unit IS 'Valid units: item, hour, day';
COMMENT ON COLUMN garment_services.unit IS 'Valid units: item, hour, day';

COMMIT;
