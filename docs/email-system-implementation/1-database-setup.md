# Phase 1.1: Database Setup

## Overview

Set up all database tables, migrations, and RLS policies for the email system.

## Prerequisites

- [ ] Supabase project access
- [ ] Supabase CLI installed
- [ ] Database connection configured

## Steps

### 1. Create Migration File

Create a new migration file:

```bash
npx supabase migration new add_email_system
```

### 2. Add Email Templates Table

```sql
-- Email templates table
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type TEXT NOT NULL UNIQUE CHECK (email_type IN (
    'appointment_scheduled',
    'appointment_rescheduled',
    'appointment_canceled',
    'payment_link',
    'appointment_confirmation_request',
    'appointment_confirmed'
  )),
  subject TEXT NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 200),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Index for quick lookups
CREATE INDEX idx_email_templates_type ON email_templates(email_type);

-- RLS Policies
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read email templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own templates"
  ON email_templates FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can create templates"
  ON email_templates FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());
```

### 3. Add Email Logs Table

```sql
-- Email logs table
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type TEXT NOT NULL CHECK (email_type IN (
    'appointment_scheduled',
    'appointment_rescheduled',
    'appointment_canceled',
    'payment_link',
    'appointment_confirmation_request',
    'appointment_confirmed'
  )),
  recipient_email TEXT NOT NULL CHECK (recipient_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  recipient_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced', 'complained')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0 AND attempts <= 5),
  last_error TEXT,
  resend_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX idx_email_logs_metadata_appointment ON email_logs((metadata->>'appointment_id'))
  WHERE metadata->>'appointment_id' IS NOT NULL;

-- RLS Policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can create email logs"
  ON email_logs FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own email logs"
  ON email_logs FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
```

### 4. Add Confirmation Tokens Table

```sql
-- Confirmation tokens table
CREATE TABLE confirmation_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_confirmation_tokens_token ON confirmation_tokens(token);
CREATE INDEX idx_confirmation_tokens_appointment ON confirmation_tokens(appointment_id);
CREATE INDEX idx_confirmation_tokens_expires ON confirmation_tokens(expires_at)
  WHERE used_at IS NULL;

-- RLS Policies
ALTER TABLE confirmation_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read tokens by token value"
  ON confirmation_tokens FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can create confirmation tokens"
  ON confirmation_tokens FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own tokens"
  ON confirmation_tokens FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());
```

### 5. Add User Email Settings

```sql
-- User email settings
CREATE TABLE user_email_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  receive_appointment_notifications BOOLEAN NOT NULL DEFAULT true,
  email_signature TEXT CHECK (char_length(email_signature) <= 500),
  reply_to_email TEXT CHECK (reply_to_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$' OR reply_to_email IS NULL),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies
ALTER TABLE user_email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own email settings"
  ON user_email_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own email settings"
  ON user_email_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own email settings"
  ON user_email_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### 6. Add Helper Functions

```sql
-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_email_settings_updated_at
  BEFORE UPDATE ON user_email_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Default templates function
CREATE OR REPLACE FUNCTION get_default_email_templates()
RETURNS TABLE (
  email_type TEXT,
  subject TEXT,
  body TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.email_type::TEXT, t.subject::TEXT, t.body::TEXT
  FROM (VALUES
    ('appointment_scheduled',
     'Your appointment is scheduled with {shop_name}',
     E'Hi {client_name},\n\nYour appointment with {shop_name} is confirmed for {appointment_time}.\n\nIf you have any questions or need to reschedule, please contact us.\n\nThank you,\n{shop_name}'),
    ('appointment_rescheduled',
     'Your appointment has been rescheduled',
     E'Hi {client_name},\n\nYour appointment with {shop_name} has been rescheduled.\n\nPrevious time: {previous_time}\nNew time: {appointment_time}\n\nIf you have any questions, please contact us.\n\nThank you,\n{shop_name}'),
    ('appointment_canceled',
     'Your appointment has been canceled',
     E'Hi {client_name},\n\nYour appointment with {shop_name} scheduled for {previous_time} has been canceled.\n\nIf you have any questions, please contact us.\n\nThank you,\n{shop_name}'),
    ('payment_link',
     'Your payment link from {shop_name}',
     E'Hi {client_name},\n\nYou can pay for your order using the link below:\n\n{payment_link}\n\nIf you have any questions, please contact us.\n\nThank you,\n{shop_name}'),
    ('appointment_confirmation_request',
     'Please confirm your appointment with {shop_name}',
     E'Hi {client_name},\n\nPlease confirm your appointment scheduled for {appointment_time} by clicking the link below:\n\n{confirmation_link}\n\nIf you have any questions, please contact us.\n\nThank you,\n{shop_name}'),
    ('appointment_confirmed',
     '{client_name} confirmed their appointment',
     E'Hi {seamstress_name},\n\n{client_name} has confirmed their appointment scheduled for {appointment_time}.\n\nYou can view all your appointments in Hemsy.\n\nThank you,\nHemsy')
  ) AS t(email_type, subject, body);
END;
$$ LANGUAGE plpgsql;
```

### 7. Seed Default Data

```sql
-- Insert default templates
INSERT INTO email_templates (email_type, subject, body, is_default, created_by)
SELECT
  email_type,
  subject,
  body,
  true,
  auth.uid()
FROM get_default_email_templates()
ON CONFLICT (email_type) DO NOTHING;

-- Create user settings for existing users
INSERT INTO user_email_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
```

### 8. Run Migration

```bash
# Apply migration to local database
npx supabase db push

# Or apply to remote
npx supabase db push --db-url $DATABASE_URL
```

## Verification

Run these queries to verify setup:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('email_templates', 'email_logs', 'confirmation_tokens', 'user_email_settings');

-- Check default templates
SELECT * FROM email_templates WHERE is_default = true;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'email_%';
```

## Troubleshooting

- **Migration fails**: Check for existing tables with same names
- **RLS errors**: Ensure auth.uid() function exists
- **Foreign key errors**: Ensure referenced tables exist (appointments, auth.users)

## Next Steps

Proceed to [Environment Configuration](./2-environment-configuration.md)
