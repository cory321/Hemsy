-- Rename 'item' to 'flat_rate' in services and garment_services tables

-- Update existing data in services table
UPDATE services 
SET default_unit = 'flat_rate' 
WHERE default_unit = 'item';

-- Update existing data in garment_services table
UPDATE garment_services 
SET unit = 'flat_rate' 
WHERE unit = 'item';

-- Drop existing check constraints
ALTER TABLE services 
DROP CONSTRAINT IF EXISTS services_default_unit_check;

ALTER TABLE garment_services 
DROP CONSTRAINT IF EXISTS garment_services_unit_check;

-- Add new check constraints with 'flat_rate' instead of 'item'
ALTER TABLE services 
ADD CONSTRAINT services_default_unit_check 
CHECK (default_unit = ANY (ARRAY['flat_rate'::text, 'hour'::text, 'day'::text]));

ALTER TABLE garment_services 
ADD CONSTRAINT garment_services_unit_check 
CHECK (unit = ANY (ARRAY['flat_rate'::text, 'hour'::text, 'day'::text]));

-- Update comments to reflect the change
COMMENT ON COLUMN services.default_unit IS 'Valid units: flat_rate, hour, day';
COMMENT ON COLUMN garment_services.unit IS 'Valid units: flat_rate, hour, day';
