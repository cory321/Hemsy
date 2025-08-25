-- Migration: 037_remove_service_payment_allocation.sql
-- Description: Remove service-level payment allocation and locking system
-- Transition to invoice-only payment tracking

BEGIN;

-- 1. Drop the payment allocation trigger first
DROP TRIGGER IF EXISTS allocate_payment_on_completion ON payments;

-- 2. Drop the allocation function
DROP FUNCTION IF EXISTS allocate_payment_to_services(UUID, UUID, INTEGER, TEXT);

-- 3. Drop the trigger function
DROP FUNCTION IF EXISTS trigger_allocate_payment();

-- 4. Remove service payment tracking columns from garment_services
-- Note: We'll keep these columns for now but stop using them
-- ALTER TABLE garment_services DROP COLUMN IF EXISTS paid_amount_cents;
-- ALTER TABLE garment_services DROP COLUMN IF EXISTS refunded_amount_cents;
-- ALTER TABLE garment_services DROP COLUMN IF EXISTS is_locked;
-- ALTER TABLE garment_services DROP COLUMN IF EXISTS locked_at;

-- Instead, let's just reset all services to unlocked and zero paid amounts
-- This preserves data but removes the locking behavior
UPDATE garment_services 
SET 
  paid_amount_cents = 0,
  refunded_amount_cents = 0,
  is_locked = FALSE,
  locked_at = NULL
WHERE is_locked = TRUE OR paid_amount_cents > 0 OR refunded_amount_cents > 0;

-- 5. Update the order payment status function to work from invoice totals instead of service allocations
CREATE OR REPLACE FUNCTION update_order_payment_status(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_amount INTEGER;
  v_paid_amount INTEGER;
  v_payment_status TEXT;
BEGIN
  -- Calculate total order amount from services (unchanged)
  SELECT SUM(gs.quantity * gs.unit_price_cents) INTO v_total_amount
  FROM garment_services gs
  JOIN garments g ON gs.garment_id = g.id
  WHERE g.order_id = p_order_id;

  -- Calculate paid amount from completed payments on invoices for this order
  SELECT COALESCE(SUM(p.amount_cents), 0) INTO v_paid_amount
  FROM payments p
  JOIN invoices i ON p.invoice_id = i.id
  WHERE i.order_id = p_order_id
    AND p.status = 'completed';

  -- Subtract refunded amounts
  SELECT v_paid_amount - COALESCE(SUM(p.refunded_amount_cents), 0) INTO v_paid_amount
  FROM payments p
  JOIN invoices i ON p.invoice_id = i.id
  WHERE i.order_id = p_order_id
    AND p.status IN ('completed', 'refunded', 'partially_refunded');

  -- Determine payment status
  IF v_paid_amount IS NULL OR v_paid_amount = 0 THEN
    v_payment_status := 'unpaid';
  ELSIF v_paid_amount >= v_total_amount THEN
    v_payment_status := 'paid';
  ELSIF v_paid_amount > v_total_amount THEN
    v_payment_status := 'overpaid';
  ELSE
    v_payment_status := 'deposit_paid';
  END IF;

  -- Update order
  UPDATE orders
  SET
    payment_status = v_payment_status,
    paid_amount_cents = COALESCE(v_paid_amount, 0),
    total_cents = COALESCE(v_total_amount, 0),
    is_paid = CASE WHEN v_payment_status = 'paid' THEN TRUE ELSE is_paid END,
    paid_at = CASE 
      WHEN v_payment_status = 'paid' AND is_paid = FALSE 
      THEN NOW() 
      ELSE paid_at 
    END
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- 6. Create a simple trigger to update order status when payments change
-- This replaces the complex allocation system with a simpler approach
CREATE OR REPLACE FUNCTION trigger_update_order_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update order payment status when payment status changes
  IF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) OR TG_OP = 'INSERT' THEN
    PERFORM update_order_payment_status((
      SELECT order_id FROM invoices WHERE id = NEW.invoice_id
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_payment_status_on_payment_change
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_order_payment_status();

-- 7. Add comment to service_payment_allocations table indicating it's deprecated
COMMENT ON TABLE service_payment_allocations IS 'DEPRECATED: This table is no longer used. Payment tracking is now done at invoice level only.';

-- 8. Optionally disable RLS on deprecated table (but keep the table for data integrity)
-- We'll keep the table and data for audit purposes but stop using it

COMMIT;
