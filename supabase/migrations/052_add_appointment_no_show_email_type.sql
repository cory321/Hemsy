-- Add appointment_no_show to the email_type check constraint in email_logs table

-- First, drop the existing constraint
ALTER TABLE email_logs DROP CONSTRAINT email_logs_email_type_check;

-- Then, add the constraint back with the new email type included
ALTER TABLE email_logs ADD CONSTRAINT email_logs_email_type_check 
  CHECK (email_type IN (
    'appointment_scheduled',
    'appointment_rescheduled',
    'appointment_canceled',
    'appointment_no_show',
    'payment_link',
    'appointment_confirmation_request',
    'appointment_confirmed'
  ));

-- Add a comment explaining the new email type
COMMENT ON COLUMN email_logs.email_type IS 'Type of email sent. appointment_no_show is sent when an appointment is marked as no-show after the scheduled time.';
