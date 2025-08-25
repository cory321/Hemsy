-- Migration: 034_prevent_duplicate_pending_payments.sql
-- Description: Prevent duplicate pending Stripe payments for the same invoice

BEGIN;

-- Create unique partial index to prevent multiple pending Stripe payments per invoice
CREATE UNIQUE INDEX CONCURRENTLY idx_unique_pending_stripe_payment
ON payments (invoice_id, payment_method)
WHERE status = 'pending' AND payment_method = 'stripe';

-- Function to clean up old pending payments before creating new ones
CREATE OR REPLACE FUNCTION cleanup_old_pending_payments()
RETURNS TRIGGER AS $$
BEGIN
  -- If inserting a new pending Stripe payment, cancel any old pending ones for the same invoice
  IF NEW.status = 'pending' AND NEW.payment_method = 'stripe' THEN
    -- Mark old pending payments as failed (older than 15 minutes)
    UPDATE payments 
    SET 
      status = 'failed',
      processed_at = NOW(),
      notes = COALESCE(notes, '') || ' [Auto-cancelled: replaced by newer payment attempt]'
    WHERE 
      invoice_id = NEW.invoice_id 
      AND payment_method = 'stripe' 
      AND status = 'pending'
      AND created_at < (NOW() - INTERVAL '15 minutes')
      AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-cleanup old pending payments
CREATE TRIGGER cleanup_old_pending_payments_trigger
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_old_pending_payments();

-- Function to periodically clean up abandoned pending payments (can be called by cron)
CREATE OR REPLACE FUNCTION cleanup_abandoned_pending_payments()
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  -- Mark pending payments older than 1 hour as failed
  UPDATE payments 
  SET 
    status = 'failed',
    processed_at = NOW(),
    notes = COALESCE(notes, '') || ' [Auto-cancelled: abandoned payment timeout]'
  WHERE 
    status = 'pending' 
    AND payment_method = 'stripe'
    AND created_at < (NOW() - INTERVAL '1 hour');
    
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

COMMIT;
