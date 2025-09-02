-- Add timezone support to users and shops tables
-- This is the first step in migrating to proper UTC storage

-- Add timezone to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS timezone_offset INTEGER; -- Minutes from UTC (e.g., -480 for PST)

COMMENT ON COLUMN users.timezone IS 'IANA timezone identifier (e.g., America/Los_Angeles)';
COMMENT ON COLUMN users.timezone_offset IS 'Current offset from UTC in minutes. Negative for west of UTC.';

-- Add timezone to shops table
ALTER TABLE shops 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York',
ADD COLUMN IF NOT EXISTS timezone_offset INTEGER; -- Minutes from UTC

COMMENT ON COLUMN shops.timezone IS 'Shop timezone for business hours and appointments';
COMMENT ON COLUMN shops.timezone_offset IS 'Current offset from UTC in minutes. Updated when DST changes.';

-- Create indexes for timezone queries
CREATE INDEX IF NOT EXISTS idx_users_timezone ON users(timezone);
CREATE INDEX IF NOT EXISTS idx_shops_timezone ON shops(timezone);

-- Add UTC datetime columns to appointments (dual-write strategy)
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS start_at timestamptz,
ADD COLUMN IF NOT EXISTS end_at timestamptz;

COMMENT ON COLUMN appointments.start_at IS 'UTC timestamp for appointment start (replaces date + start_time)';
COMMENT ON COLUMN appointments.end_at IS 'UTC timestamp for appointment end (replaces date + end_time)';

-- Add UTC datetime columns to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS due_at timestamptz;

COMMENT ON COLUMN orders.due_at IS 'UTC timestamp for order due date (replaces order_due_date)';

-- Add UTC datetime columns to garments
ALTER TABLE garments
ADD COLUMN IF NOT EXISTS event_at timestamptz,
ADD COLUMN IF NOT EXISTS due_at timestamptz;

COMMENT ON COLUMN garments.event_at IS 'UTC timestamp for garment event (replaces event_date)';
COMMENT ON COLUMN garments.due_at IS 'UTC timestamp for garment due (replaces due_date)';

-- Create a function to convert existing dates to UTC (for migration)
CREATE OR REPLACE FUNCTION convert_date_time_to_utc(
  p_date date,
  p_time time,
  p_timezone text
) RETURNS timestamptz AS $$
BEGIN
  IF p_date IS NULL OR p_time IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Combine date and time, then convert to UTC using the provided timezone
  RETURN (p_date + p_time)::timestamp AT TIME ZONE p_timezone;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a function to convert just dates to UTC (assumes noon in local timezone)
CREATE OR REPLACE FUNCTION convert_date_to_utc(
  p_date date,
  p_timezone text
) RETURNS timestamptz AS $$
BEGIN
  IF p_date IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Convert date at noon local time to UTC
  RETURN (p_date + TIME '12:00:00')::timestamp AT TIME ZONE p_timezone;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Backfill existing data (commented out for safety - run manually after verifying)
-- This assumes all existing data is in America/New_York timezone
-- Adjust the timezone as needed for your production data

/*
-- Update appointments with UTC times
UPDATE appointments a
SET 
  start_at = convert_date_time_to_utc(a.date, a.start_time, COALESCE(s.timezone, 'America/New_York')),
  end_at = convert_date_time_to_utc(a.date, a.end_time, COALESCE(s.timezone, 'America/New_York'))
FROM shops s
WHERE a.shop_id = s.id;

-- Update orders with UTC due dates
UPDATE orders o
SET due_at = convert_date_to_utc(o.order_due_date, COALESCE(s.timezone, 'America/New_York'))
FROM shops s
WHERE o.shop_id = s.id 
  AND o.order_due_date IS NOT NULL;

-- Update garments with UTC dates
UPDATE garments g
SET 
  event_at = convert_date_to_utc(g.event_date, COALESCE(s.timezone, 'America/New_York')),
  due_at = convert_date_to_utc(g.due_date, COALESCE(s.timezone, 'America/New_York'))
FROM shops s
WHERE g.shop_id = s.id;
*/
