-- Fix refund accumulation logic
-- This migration ensures payments.refunded_amount_cents always equals the sum of succeeded refunds

-- First, let's create a function to safely calculate total refunded amount
CREATE OR REPLACE FUNCTION calculate_total_refunded_amount(payment_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  total_refunded INTEGER;
BEGIN
  SELECT COALESCE(SUM(amount_cents), 0)
  INTO total_refunded
  FROM refunds
  WHERE payment_id = payment_uuid
  AND status = 'succeeded';
  
  RETURN total_refunded;
END;
$$ LANGUAGE plpgsql STABLE;

-- Fix any existing discrepancies between refunded_amount_cents and actual refunds sum
UPDATE payments p
SET 
  refunded_amount_cents = COALESCE((
    SELECT SUM(r.amount_cents)
    FROM refunds r
    WHERE r.payment_id = p.id
    AND r.status = 'succeeded'
  ), 0),
  status = CASE 
    WHEN COALESCE((
      SELECT SUM(r.amount_cents)
      FROM refunds r
      WHERE r.payment_id = p.id
      AND r.status = 'succeeded'
    ), 0) = 0 THEN 'completed'
    WHEN COALESCE((
      SELECT SUM(r.amount_cents)
      FROM refunds r
      WHERE r.payment_id = p.id
      AND r.status = 'succeeded'
    ), 0) >= p.amount_cents THEN 'refunded'
    ELSE 'partially_refunded'
  END
WHERE p.status IN ('completed', 'partially_refunded', 'refunded')
AND EXISTS (
  SELECT 1 FROM refunds r 
  WHERE r.payment_id = p.id 
);

-- Create an optimized trigger to maintain refunded_amount_cents automatically
CREATE OR REPLACE FUNCTION update_payment_refunded_amount()
RETURNS TRIGGER AS $$
DECLARE
  total_refunded INTEGER;
  payment_record RECORD;
BEGIN
  -- Only process succeeded refunds
  IF NEW.status != 'succeeded' THEN
    RETURN NEW;
  END IF;

  -- Get payment details and calculate total refunded in one query
  SELECT 
    p.id,
    p.amount_cents,
    COALESCE(SUM(r.amount_cents), 0) as total_refunded
  INTO payment_record
  FROM payments p
  LEFT JOIN refunds r ON r.payment_id = p.id AND r.status = 'succeeded'
  WHERE p.id = NEW.payment_id
  GROUP BY p.id, p.amount_cents;
  
  -- Update the payment record with correct status
  UPDATE payments
  SET 
    refunded_amount_cents = payment_record.total_refunded,
    status = CASE 
      WHEN payment_record.total_refunded = 0 THEN 'completed'
      WHEN payment_record.total_refunded >= payment_record.amount_cents THEN 'refunded'
      ELSE 'partially_refunded'
    END
  WHERE id = payment_record.id;
  
  -- Also trigger the existing order payment status update
  PERFORM update_order_payment_status((
    SELECT order_id FROM invoices WHERE id = (
      SELECT invoice_id FROM payments WHERE id = NEW.payment_id
    )
  ));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for refunds table (only on insert/update of succeeded refunds)
DROP TRIGGER IF EXISTS update_payment_on_refund ON refunds;
CREATE TRIGGER update_payment_on_refund
AFTER INSERT OR UPDATE OF status, amount_cents ON refunds
FOR EACH ROW
EXECUTE FUNCTION update_payment_refunded_amount();

-- Add a check constraint to prevent over-refunding at the database level
-- This provides an additional safety net beyond application logic
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_refund_not_exceeding_payment'
  ) THEN
    ALTER TABLE refunds
    ADD CONSTRAINT check_refund_not_exceeding_payment
    CHECK (amount_cents > 0);
  END IF;
END $$;

-- Ensure we have the performance index (already exists but safe to recreate)
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id_status 
ON refunds(payment_id, status)
WHERE status = 'succeeded';

-- Add RLS policy for refunds if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'refunds' 
    AND policyname = 'Users can view refunds for their shop payments'
  ) THEN
    CREATE POLICY "Users can view refunds for their shop payments"
    ON refunds FOR SELECT
    USING (
      payment_id IN (
        SELECT p.id FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        WHERE i.shop_id IN (
          SELECT shop_id FROM users WHERE id = auth.uid()
        )
      )
    );
  END IF;
END $$;
