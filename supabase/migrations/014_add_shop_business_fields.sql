-- Add business information fields to shops table
ALTER TABLE shops
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS mailing_address TEXT,
ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'shop_location' CHECK (location_type IN ('home_based', 'shop_location', 'mobile_service')),
ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS buffer_time_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_preference TEXT DEFAULT 'after_service' CHECK (payment_preference IN ('upfront', 'after_service')),
ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMPTZ;

-- Migrate existing name to business_name if business_name is null
UPDATE shops
SET business_name = name
WHERE business_name IS NULL;

-- Add comment
COMMENT ON COLUMN shops.working_hours IS 'JSON object with day names as keys and {start, end, closed} as values';