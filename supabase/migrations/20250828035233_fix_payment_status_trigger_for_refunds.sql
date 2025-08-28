-- Fix payment status trigger to account for refund amount changes
-- This ensures that order payment status is updated when refunds are processed

-- Drop the existing trigger
DROP TRIGGER IF EXISTS update_order_payment_status_on_payment_change ON payments;

-- Recreate the trigger to also fire when refunded_amount_cents changes
-- This is crucial for manual refunds which update refunded_amount_cents without changing status
CREATE TRIGGER update_order_payment_status_on_payment_change
    AFTER INSERT OR UPDATE OF status, refunded_amount_cents ON payments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_order_payment_status();

-- Recalculate payment status for all existing orders to fix any incorrect values
-- This is a one-time fix for orders that may have incorrect paid_amount_cents due to refunds
DO $$
DECLARE
    order_record RECORD;
BEGIN
    FOR order_record IN SELECT id FROM orders LOOP
        PERFORM update_order_payment_status(order_record.id);
    END LOOP;
END $$;

-- Fix the update_order_payment_status function to correctly handle refunds
-- The original function was double-subtracting refunds, causing negative paid amounts
CREATE OR REPLACE FUNCTION public.update_order_payment_status(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $function$
DECLARE
  v_total_amount INTEGER;
  v_paid_amount INTEGER;
  v_payment_status TEXT;
BEGIN
  -- Calculate total order amount from services (unchanged)
  SELECT SUM(gs.quantity * gs.unit_price_cents) INTO v_total_amount
  FROM garment_services gs
  JOIN garments g ON gs.garment_id = g.id
  WHERE g.order_id = p_order_id
    AND gs.is_removed = false; -- Only count non-removed services

  -- Calculate net paid amount (payments minus refunds) in one step
  -- This fixes the double-subtraction bug in the original function
  SELECT COALESCE(SUM(p.amount_cents - COALESCE(p.refunded_amount_cents, 0)), 0) INTO v_paid_amount
  FROM payments p
  JOIN invoices i ON p.invoice_id = i.id
  WHERE i.order_id = p_order_id
    AND p.status IN ('completed', 'refunded', 'partially_refunded');

  -- Determine payment status
  IF v_paid_amount IS NULL OR v_paid_amount <= 0 THEN
    v_payment_status := 'unpaid';
  ELSIF v_paid_amount > v_total_amount THEN
    v_payment_status := 'overpaid';
  ELSIF v_paid_amount >= v_total_amount THEN
    v_payment_status := 'paid';
  ELSE
    v_payment_status := 'partially_paid';
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
$function$;

-- Add comment to document the fix
COMMENT ON TRIGGER update_order_payment_status_on_payment_change ON payments IS 
'Triggers order payment status recalculation when payment status or refunded amount changes. Essential for accurate payment tracking with refunds.';

COMMENT ON FUNCTION update_order_payment_status(uuid) IS 
'Recalculates order payment status and paid amount. Fixed to properly handle refunds by calculating net payments in one step, avoiding double-subtraction of refunds.';
