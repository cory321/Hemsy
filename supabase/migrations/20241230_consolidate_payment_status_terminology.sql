-- Migration: Consolidate payment status terminology
-- Description: Replace 'deposit_paid' with 'partially_paid' for consistency
-- This aligns order payment status with invoice status terminology

BEGIN;

-- 1. Drop the old check constraint that only allows 'deposit_paid'
ALTER TABLE orders DROP CONSTRAINT orders_payment_status_check;

-- 2. Update existing data: Change 'deposit_paid' to 'partially_paid' in orders table
UPDATE orders 
SET payment_status = 'partially_paid' 
WHERE payment_status = 'deposit_paid';

-- 3. Add new check constraint with 'partially_paid' instead of 'deposit_paid'
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status = ANY (ARRAY['unpaid'::text, 'partially_paid'::text, 'paid'::text, 'overpaid'::text]));

-- 4. Update the update_order_payment_status function to use 'partially_paid'
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

  -- Determine payment status (UPDATED: use 'partially_paid' instead of 'deposit_paid')
  IF v_paid_amount IS NULL OR v_paid_amount = 0 THEN
    v_payment_status := 'unpaid';
  ELSIF v_paid_amount >= v_total_amount THEN
    v_payment_status := 'paid';
  ELSIF v_paid_amount > v_total_amount THEN
    v_payment_status := 'overpaid';
  ELSE
    v_payment_status := 'partially_paid';  -- CHANGED: was 'deposit_paid'
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

-- 5. Add a comment to document the standardized payment status values
COMMENT ON COLUMN orders.payment_status IS 'Order payment status: unpaid, partially_paid, paid, overpaid. Aligned with invoice status terminology.';

-- 6. Verify the migration worked by checking updated counts
DO $$
DECLARE
    deposit_paid_count INTEGER;
    partially_paid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO deposit_paid_count FROM orders WHERE payment_status = 'deposit_paid';
    SELECT COUNT(*) INTO partially_paid_count FROM orders WHERE payment_status = 'partially_paid';
    
    RAISE NOTICE 'Migration complete: % orders with deposit_paid, % orders with partially_paid', 
                 deposit_paid_count, partially_paid_count;
    
    IF deposit_paid_count > 0 THEN
        RAISE WARNING 'Still found % orders with deposit_paid status - migration may need review', deposit_paid_count;
    END IF;
END $$;

COMMIT;
