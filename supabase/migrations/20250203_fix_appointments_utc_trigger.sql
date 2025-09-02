-- Fix appointments_update_utc_timestamps function that was incorrectly referencing NEW.user_id
-- The appointments table doesn't have a user_id field, so we use the shop's timezone instead

CREATE OR REPLACE FUNCTION appointments_update_utc_timestamps()
RETURNS TRIGGER AS $$
DECLARE
  user_timezone TEXT;
BEGIN
  -- Get shop's timezone (appointments don't have a direct user relationship)
  SELECT COALESCE(s.timezone, 'America/New_York')
  INTO user_timezone
  FROM shops s
  WHERE s.id = NEW.shop_id
  LIMIT 1;
  
  -- Update UTC timestamps
  IF NEW.date IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.start_at = convert_local_to_utc(NEW.date, NEW.start_time, user_timezone);
  END IF;
  
  IF NEW.date IS NOT NULL AND NEW.end_time IS NOT NULL THEN
    NEW.end_at = convert_local_to_utc(NEW.date, NEW.end_time, user_timezone);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
