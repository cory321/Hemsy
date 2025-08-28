-- Migration: Payment System Improvements
-- Description: Add user context to audit logs, performance indexes, and reconciliation view
-- Date: 2025-01-17

BEGIN;

-- 1. Add user_id column to payment_audit_logs if it doesn't exist
ALTER TABLE payment_audit_logs 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- 2. Update the payment status change trigger to capture user context
CREATE OR REPLACE FUNCTION log_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log status changes
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO payment_audit_logs (
            payment_id,
            action,
            details,
            user_id -- Capture who made the change
        ) VALUES (
            NEW.id,
            NEW.status,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'old_amount', OLD.amount_cents,
                'new_amount', NEW.amount_cents,
                'refunded_amount_cents', NEW.refunded_amount_cents,
                'payment_method', NEW.payment_method,
                'trigger_op', TG_OP
            ),
            auth.uid() -- Capture current user (will be NULL for system/webhook operations)
        );
    END IF;
    
    -- Also log refund amount changes
    IF TG_OP = 'UPDATE' AND OLD.refunded_amount_cents IS DISTINCT FROM NEW.refunded_amount_cents THEN
        INSERT INTO payment_audit_logs (
            payment_id,
            action,
            details,
            user_id
        ) VALUES (
            NEW.id,
            'refund_updated',
            jsonb_build_object(
                'old_refunded_amount', OLD.refunded_amount_cents,
                'new_refunded_amount', NEW.refunded_amount_cents,
                'status', NEW.status,
                'trigger_op', TG_OP
            ),
            auth.uid()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Add performance indexes for payment queries
-- Index for filtering payments by status and refund amount
CREATE INDEX IF NOT EXISTS idx_payments_status_refunded 
  ON payments(status, refunded_amount_cents) 
  WHERE status IN ('partially_refunded', 'refunded');

-- Index for finding payments by invoice and status
CREATE INDEX IF NOT EXISTS idx_payments_invoice_status 
  ON payments(invoice_id, status, created_at DESC);

-- Index for refunds table performance
CREATE INDEX IF NOT EXISTS idx_refunds_payment_created 
  ON refunds(payment_id, created_at DESC);

-- Index for quick invoice lookups by order
CREATE INDEX IF NOT EXISTS idx_invoices_order 
  ON invoices(order_id);

-- Index for payment audit logs by user
CREATE INDEX IF NOT EXISTS idx_payment_audit_logs_user_id 
  ON payment_audit_logs(user_id) 
  WHERE user_id IS NOT NULL;

-- 4. Create payment reconciliation view
CREATE OR REPLACE VIEW payment_reconciliation AS
SELECT 
  p.id as payment_id,
  p.invoice_id,
  p.payment_method,
  p.status,
  p.amount_cents,
  p.refunded_amount_cents as payment_table_refunds,
  COALESCE(SUM(r.amount_cents), 0) as refunds_table_total,
  p.refunded_amount_cents - COALESCE(SUM(r.amount_cents), 0) as discrepancy_amount,
  CASE 
    WHEN p.refunded_amount_cents = COALESCE(SUM(r.amount_cents), 0) 
    THEN 'OK' 
    WHEN p.refunded_amount_cents > COALESCE(SUM(r.amount_cents), 0)
    THEN 'PAYMENT_TABLE_HIGHER'
    WHEN p.refunded_amount_cents < COALESCE(SUM(r.amount_cents), 0)
    THEN 'REFUNDS_TABLE_HIGHER'
    ELSE 'UNKNOWN'
  END as consistency_status,
  COUNT(r.id) as refund_count,
  p.created_at as payment_created_at,
  MAX(r.created_at) as last_refund_at
FROM payments p
LEFT JOIN refunds r ON r.payment_id = p.id
GROUP BY p.id, p.invoice_id, p.payment_method, p.status, 
         p.amount_cents, p.refunded_amount_cents, p.created_at;

-- 5. Create a summary view for quick payment status checks
CREATE OR REPLACE VIEW invoice_payment_summary AS
SELECT 
  i.id as invoice_id,
  i.order_id,
  i.status as invoice_status,
  i.amount_cents as invoice_total,
  COUNT(DISTINCT p.id) as payment_count,
  SUM(CASE WHEN p.status IN ('completed', 'partially_refunded', 'refunded') 
       THEN p.amount_cents ELSE 0 END) as total_paid,
  SUM(COALESCE(p.refunded_amount_cents, 0)) as total_refunded,
  SUM(CASE WHEN p.status IN ('completed', 'partially_refunded', 'refunded') 
       THEN p.amount_cents - COALESCE(p.refunded_amount_cents, 0) ELSE 0 END) as net_paid,
  i.amount_cents - SUM(CASE WHEN p.status IN ('completed', 'partially_refunded', 'refunded') 
       THEN p.amount_cents - COALESCE(p.refunded_amount_cents, 0) ELSE 0 END) as amount_due,
  MAX(p.created_at) as last_payment_date,
  MAX(CASE WHEN p.refunded_amount_cents > 0 THEN p.refunded_at END) as last_refund_date
FROM invoices i
LEFT JOIN payments p ON p.invoice_id = i.id
GROUP BY i.id, i.order_id, i.status, i.amount_cents;

-- 6. Add RLS policies for the new views
-- Payment reconciliation view - shop owners can see their own data
CREATE POLICY "Shop owners can view payment reconciliation"
  ON payment_reconciliation FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE shop_id IN (
        SELECT id FROM shops WHERE owner_user_id = auth.uid()
      )
    )
  );

-- Invoice payment summary view - shop owners can see their own data
CREATE POLICY "Shop owners can view invoice payment summary"
  ON invoice_payment_summary FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE shop_id IN (
        SELECT id FROM shops WHERE owner_user_id = auth.uid()
      )
    )
  );

-- 7. Add helpful comments
COMMENT ON COLUMN payment_audit_logs.user_id IS 
'User who triggered the change. NULL for system/webhook operations';

COMMENT ON VIEW payment_reconciliation IS 
'Reconciliation view to detect discrepancies between payments and refunds tables';

COMMENT ON VIEW invoice_payment_summary IS 
'Summary view for quick payment calculations without complex joins';

-- 8. Create a function to check for payment discrepancies
CREATE OR REPLACE FUNCTION check_payment_discrepancies(p_shop_id UUID DEFAULT NULL)
RETURNS TABLE (
  payment_id UUID,
  invoice_id UUID,
  payment_method TEXT,
  discrepancy_amount INTEGER,
  consistency_status TEXT,
  details TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pr.payment_id,
    pr.invoice_id,
    pr.payment_method,
    pr.discrepancy_amount,
    pr.consistency_status,
    CASE 
      WHEN pr.consistency_status = 'PAYMENT_TABLE_HIGHER' THEN
        format('Payment table shows %s refunded but only %s in refunds table',
               (pr.payment_table_refunds / 100.0)::money,
               (pr.refunds_table_total / 100.0)::money)
      WHEN pr.consistency_status = 'REFUNDS_TABLE_HIGHER' THEN
        format('Refunds table shows %s but payment table only shows %s refunded',
               (pr.refunds_table_total / 100.0)::money,
               (pr.payment_table_refunds / 100.0)::money)
      ELSE ''
    END as details
  FROM payment_reconciliation pr
  JOIN invoices i ON i.id = pr.invoice_id
  WHERE pr.consistency_status != 'OK'
  AND (p_shop_id IS NULL OR i.shop_id = p_shop_id)
  ORDER BY ABS(pr.discrepancy_amount) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_payment_discrepancies IS 
'Check for discrepancies between payments and refunds tables. Pass shop_id to filter by shop.';

COMMIT;
