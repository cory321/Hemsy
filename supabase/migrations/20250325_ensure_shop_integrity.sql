-- Ensure shop integrity and automatic setup for new shops

-- Add index on owner_user_id for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_shops_owner_user_id ON shops(owner_user_id);

-- Create a function to automatically set up default shop data
CREATE OR REPLACE FUNCTION setup_shop_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default shop hours (Monday-Friday 9am-5pm)
  INSERT INTO shop_hours (shop_id, day_of_week, open_time, close_time, is_closed)
  VALUES 
    (NEW.id, 0, '09:00:00', '17:00:00', false), -- Sunday
    (NEW.id, 1, '09:00:00', '17:00:00', false), -- Monday
    (NEW.id, 2, '09:00:00', '17:00:00', false), -- Tuesday
    (NEW.id, 3, '09:00:00', '17:00:00', false), -- Wednesday
    (NEW.id, 4, '09:00:00', '17:00:00', false), -- Thursday
    (NEW.id, 5, '09:00:00', '17:00:00', false), -- Friday
    (NEW.id, 6, '09:00:00', '17:00:00', false)  -- Saturday
  ON CONFLICT DO NOTHING;

  -- Create default calendar settings
  INSERT INTO calendar_settings (shop_id, buffer_time_minutes, default_appointment_duration, send_reminders, reminder_hours_before)
  VALUES (NEW.id, 0, 30, true, 24)
  ON CONFLICT (shop_id) DO NOTHING;

  -- Create default shop settings for invoicing
  INSERT INTO shop_settings (shop_id, payment_required_before_service, invoice_prefix, last_invoice_number, stripe_enabled, cash_enabled, external_pos_enabled)
  VALUES (NEW.id, true, 'INV', 999, true, false, false)
  ON CONFLICT (shop_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set up shop defaults after shop creation
DROP TRIGGER IF EXISTS setup_shop_defaults_trigger ON shops;
CREATE TRIGGER setup_shop_defaults_trigger
  AFTER INSERT ON shops
  FOR EACH ROW
  EXECUTE FUNCTION setup_shop_defaults();

-- Create a function to ensure user-shop consistency
CREATE OR REPLACE FUNCTION ensure_user_has_shop()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the user already has a shop
  IF NOT EXISTS (SELECT 1 FROM shops WHERE owner_user_id = NEW.id) THEN
    -- Create a default shop for the user
    INSERT INTO shops (
      owner_user_id,
      name,
      email,
      trial_countdown_enabled,
      onboarding_completed,
      trial_end_date
    ) VALUES (
      NEW.id,
      COALESCE(NEW.first_name || ' ' || NEW.last_name || '''s Shop', NEW.email || '''s Shop', 'My Shop'),
      NEW.email,
      false,
      false,
      NOW() + INTERVAL '14 days'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure every user has a shop
DROP TRIGGER IF EXISTS ensure_user_has_shop_trigger ON users;
CREATE TRIGGER ensure_user_has_shop_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION ensure_user_has_shop();

-- Add a check constraint to ensure owner_user_id is never null
ALTER TABLE shops
ADD CONSTRAINT shops_owner_user_id_not_null CHECK (owner_user_id IS NOT NULL);

-- Comment on the functions for documentation
COMMENT ON FUNCTION setup_shop_defaults() IS 'Automatically creates default shop hours, calendar settings, and shop settings when a new shop is created';
COMMENT ON FUNCTION ensure_user_has_shop() IS 'Ensures every user has exactly one shop by creating a default shop when a user is created';
