-- Create appointments table
CREATE TABLE appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('consultation', 'fitting', 'pickup', 'delivery', 'walk_in', 'other')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Add index for performance
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Create indexes for common queries
CREATE INDEX idx_appointments_shop_date ON appointments(shop_id, date);
CREATE INDEX idx_appointments_client ON appointments(client_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_date_range ON appointments(shop_id, date, start_time, end_time);

-- Create shop_hours table for working hours
CREATE TABLE shop_hours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  open_time TIME,
  close_time TIME,
  is_closed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, day_of_week),
  CONSTRAINT valid_hours CHECK (
    (is_closed = TRUE AND open_time IS NULL AND close_time IS NULL) OR
    (is_closed = FALSE AND open_time IS NOT NULL AND close_time IS NOT NULL AND open_time < close_time)
  )
);

-- Create calendar_settings table
CREATE TABLE calendar_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE UNIQUE,
  buffer_time_minutes INTEGER DEFAULT 0 CHECK (buffer_time_minutes >= 0),
  default_appointment_duration INTEGER DEFAULT 30 CHECK (default_appointment_duration > 0),
  allow_walk_ins BOOLEAN DEFAULT TRUE,
  send_reminders BOOLEAN DEFAULT TRUE,
  reminder_hours_before INTEGER DEFAULT 24 CHECK (reminder_hours_before >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to check appointment conflicts
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
  SELECT EXISTS(
    SELECT 1
    FROM appointments a
    WHERE a.shop_id = p_shop_id
      AND a.date = p_date
      AND a.status NOT IN ('cancelled', 'no_show')
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

-- Create function to check if appointment is within working hours
CREATE OR REPLACE FUNCTION check_within_working_hours(
  p_shop_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  shop_hours_exist BOOLEAN;
  within_hours BOOLEAN;
  day_num INTEGER;
BEGIN
  -- Get day of week (0 = Sunday)
  day_num := EXTRACT(DOW FROM p_date);

  -- Check if shop hours exist
  SELECT EXISTS(
    SELECT 1 FROM shop_hours WHERE shop_id = p_shop_id
  ) INTO shop_hours_exist;

  -- If no shop hours defined, allow any time
  IF NOT shop_hours_exist THEN
    RETURN TRUE;
  END IF;

  -- Check if within working hours
  SELECT EXISTS(
    SELECT 1
    FROM shop_hours sh
    WHERE sh.shop_id = p_shop_id
      AND sh.day_of_week = day_num
      AND sh.is_closed = FALSE
      AND p_start_time >= sh.open_time
      AND p_end_time <= sh.close_time
  ) INTO within_hours;

  RETURN within_hours;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;

-- Appointments policies
CREATE POLICY "Users can view appointments for their shop"
  ON appointments FOR SELECT
  USING (
    shop_id IN (
      SELECT s.id FROM shops s
      JOIN users u ON s.owner_user_id = u.id
      WHERE u.clerk_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create appointments for their shop"
  ON appointments FOR INSERT
  WITH CHECK (
    shop_id IN (
      SELECT s.id FROM shops s
      JOIN users u ON s.owner_user_id = u.id
      WHERE u.clerk_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update appointments for their shop"
  ON appointments FOR UPDATE
  USING (
    shop_id IN (
      SELECT s.id FROM shops s
      JOIN users u ON s.owner_user_id = u.id
      WHERE u.clerk_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete appointments for their shop"
  ON appointments FOR DELETE
  USING (
    shop_id IN (
      SELECT s.id FROM shops s
      JOIN users u ON s.owner_user_id = u.id
      WHERE u.clerk_user_id = auth.uid()
    )
  );

-- Shop hours policies
CREATE POLICY "Users can view shop hours for their shop"
  ON shop_hours FOR SELECT
  USING (
    shop_id IN (
      SELECT s.id FROM shops s
      JOIN users u ON s.owner_user_id = u.id
      WHERE u.clerk_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage shop hours for their shop"
  ON shop_hours FOR ALL
  USING (
    shop_id IN (
      SELECT s.id FROM shops s
      JOIN users u ON s.owner_user_id = u.id
      WHERE u.clerk_user_id = auth.uid()
    )
  );

-- Calendar settings policies
CREATE POLICY "Users can view calendar settings for their shop"
  ON calendar_settings FOR SELECT
  USING (
    shop_id IN (
      SELECT s.id FROM shops s
      JOIN users u ON s.owner_user_id = u.id
      WHERE u.clerk_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage calendar settings for their shop"
  ON calendar_settings FOR ALL
  USING (
    shop_id IN (
      SELECT s.id FROM shops s
      JOIN users u ON s.owner_user_id = u.id
      WHERE u.clerk_user_id = auth.uid()
    )
  );

-- Add updated_at triggers
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shop_hours_updated_at BEFORE UPDATE ON shop_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_settings_updated_at BEFORE UPDATE ON calendar_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();