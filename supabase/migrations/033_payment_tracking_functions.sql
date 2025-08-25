-- Migration: 033_payment_tracking_functions.sql
-- Description: Functions for payment allocation and tracking

BEGIN;

-- Function to allocate payment to services
CREATE OR REPLACE FUNCTION allocate_payment_to_services(
  p_payment_id UUID,
  p_invoice_id UUID,
  p_amount_cents INTEGER,
  p_payment_method TEXT
)
RETURNS VOID AS $$
DECLARE
  v_remaining_amount INTEGER := p_amount_cents;
  v_line_item RECORD;
  v_allocation_amount INTEGER;
  v_unpaid_amount INTEGER;
BEGIN
  -- Get unpaid services from invoice line items
  FOR v_line_item IN
    SELECT
      line_item->>'service_id' as service_id,
      (line_item->>'line_total_cents')::INTEGER as line_total_cents
    FROM invoices,
    jsonb_array_elements(line_items) as line_item
    WHERE id = p_invoice_id
    AND line_item->>'service_id' IS NOT NULL
  LOOP
    IF v_remaining_amount <= 0 THEN
      EXIT;
    END IF;

    -- Get current paid amount for service
    SELECT COALESCE(paid_amount_cents, 0) INTO v_unpaid_amount
    FROM garment_services
    WHERE id = v_line_item.service_id::UUID;

    -- Calculate allocation amount
    v_allocation_amount := LEAST(
      v_remaining_amount,
      v_line_item.line_total_cents - v_unpaid_amount
    );

    IF v_allocation_amount > 0 THEN
      -- Create allocation record
      INSERT INTO service_payment_allocations (
        payment_id,
        garment_service_id,
        invoice_id,
        allocated_amount_cents,
        payment_method
      ) VALUES (
        p_payment_id,
        v_line_item.service_id::UUID,
        p_invoice_id,
        v_allocation_amount,
        p_payment_method
      );

      -- Update service paid amount
      UPDATE garment_services
      SET
        paid_amount_cents = paid_amount_cents + v_allocation_amount,
        is_locked = CASE
          WHEN (paid_amount_cents + v_allocation_amount) >= (quantity * unit_price_cents)
          THEN TRUE
          ELSE is_locked
        END,
        locked_at = CASE
          WHEN (paid_amount_cents + v_allocation_amount) >= (quantity * unit_price_cents)
          AND locked_at IS NULL
          THEN NOW()
          ELSE locked_at
        END
      WHERE id = v_line_item.service_id::UUID;

      v_remaining_amount := v_remaining_amount - v_allocation_amount;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update order payment status
CREATE OR REPLACE FUNCTION update_order_payment_status(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_amount INTEGER;
  v_paid_amount INTEGER;
  v_payment_status TEXT;
BEGIN
  -- Calculate total order amount
  SELECT SUM(gs.quantity * gs.unit_price_cents) INTO v_total_amount
  FROM garment_services gs
  JOIN garments g ON gs.garment_id = g.id
  WHERE g.order_id = p_order_id;

  -- Calculate paid amount
  SELECT SUM(gs.paid_amount_cents - gs.refunded_amount_cents) INTO v_paid_amount
  FROM garment_services gs
  JOIN garments g ON gs.garment_id = g.id
  WHERE g.order_id = p_order_id;

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

-- Trigger to allocate payments automatically
CREATE OR REPLACE FUNCTION trigger_allocate_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM allocate_payment_to_services(
      NEW.id,
      NEW.invoice_id,
      NEW.amount_cents,
      NEW.payment_method
    );

    -- Update order payment status
    PERFORM update_order_payment_status((
      SELECT order_id FROM invoices WHERE id = NEW.invoice_id
    ));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER allocate_payment_on_completion
  AFTER UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_allocate_payment();

COMMIT;
