-- Migration: 036_refund_tracking.sql
-- Description: Enhanced refund tracking for seamstress businesses

BEGIN;

-- Add refund-specific columns to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_id TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_amount_cents INTEGER DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refunded_by UUID REFERENCES users(id);

-- Update status enum to include refund statuses
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_status_check 
CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'partially_refunded'));

-- Create refunds table for detailed refund tracking
CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    
    -- Refund details
    stripe_refund_id TEXT UNIQUE,
    amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
    
    -- Metadata
    refund_type TEXT NOT NULL CHECK (refund_type IN ('full', 'partial')),
    initiated_by UUID REFERENCES users(id),
    merchant_notes TEXT,
    
    -- Stripe metadata
    stripe_metadata JSONB,
    
    -- Timestamps
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT stripe_refund_id_required CHECK (
        stripe_refund_id IS NOT NULL
    )
);

-- Create indexes
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_stripe_id ON refunds(stripe_refund_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_created_at ON refunds(created_at DESC);

-- Enable RLS
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- RLS policy for shop owners
CREATE POLICY "Shop owners can manage their refunds" ON refunds
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        JOIN shops s ON i.shop_id = s.id
        WHERE p.id = refunds.payment_id
        AND s.owner_user_id = auth.uid()
    )
);

-- Function to process refund completion
CREATE OR REPLACE FUNCTION process_refund_completion(
    p_refund_id UUID,
    p_stripe_refund_data JSONB
)
RETURNS VOID AS $$
DECLARE
    v_refund RECORD;
    v_payment RECORD;
    v_total_refunded INTEGER;
    v_new_payment_status TEXT;
BEGIN
    -- Get refund details
    SELECT * INTO v_refund FROM refunds WHERE id = p_refund_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Refund not found';
    END IF;
    
    -- Update refund status
    UPDATE refunds 
    SET 
        status = 'succeeded',
        processed_at = NOW(),
        stripe_metadata = p_stripe_refund_data
    WHERE id = p_refund_id;
    
    -- Get payment details
    SELECT * INTO v_payment FROM payments WHERE id = v_refund.payment_id FOR UPDATE;
    
    -- Calculate total refunded amount for this payment
    SELECT COALESCE(SUM(amount_cents), 0) INTO v_total_refunded
    FROM refunds
    WHERE payment_id = v_refund.payment_id
    AND status = 'succeeded';
    
    -- Determine new payment status
    IF v_total_refunded >= v_payment.amount_cents THEN
        v_new_payment_status := 'refunded';
    ELSIF v_total_refunded > 0 THEN
        v_new_payment_status := 'partially_refunded';
    ELSE
        v_new_payment_status := v_payment.status;
    END IF;
    
    -- Update payment record
    UPDATE payments
    SET
        status = v_new_payment_status,
        refunded_amount_cents = v_total_refunded,
        refunded_at = CASE 
            WHEN v_new_payment_status = 'refunded' THEN NOW()
            ELSE refunded_at
        END,
        refunded_by = v_refund.initiated_by,
        refund_reason = v_refund.reason,
        stripe_metadata = COALESCE(stripe_metadata, '{}'::jsonb) || 
                         jsonb_build_object(
                             'refunded_amount_cents', v_total_refunded,
                             'refunded_at', NOW()::text
                         )
    WHERE id = v_refund.payment_id;
    
    -- Update invoice status if needed
    PERFORM update_invoice_payment_status((
        SELECT invoice_id FROM payments WHERE id = v_refund.payment_id
    ));
    
END;
$$ LANGUAGE plpgsql;

-- Function to update invoice status after refund
CREATE OR REPLACE FUNCTION update_invoice_payment_status(p_invoice_id UUID)
RETURNS VOID AS $$
DECLARE
    v_invoice RECORD;
    v_total_paid INTEGER;
    v_total_refunded INTEGER;
    v_net_paid INTEGER;
    v_new_status TEXT;
BEGIN
    -- Get invoice details
    SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id FOR UPDATE;
    
    -- Calculate totals
    SELECT 
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount_cents ELSE 0 END), 0),
        COALESCE(SUM(refunded_amount_cents), 0)
    INTO v_total_paid, v_total_refunded
    FROM payments
    WHERE invoice_id = p_invoice_id;
    
    v_net_paid := v_total_paid - v_total_refunded;
    
    -- Determine new invoice status
    IF v_net_paid <= 0 THEN
        v_new_status := 'pending';
    ELSIF v_net_paid >= v_invoice.amount_cents THEN
        v_new_status := 'paid';
    ELSE
        v_new_status := 'partially_paid';
    END IF;
    
    -- Update invoice if status changed
    IF v_new_status != v_invoice.status THEN
        UPDATE invoices
        SET 
            status = v_new_status,
            updated_at = NOW()
        WHERE id = p_invoice_id;
        
        -- Log status change
        INSERT INTO invoice_status_history (
            invoice_id, previous_status, new_status,
            changed_by, reason
        ) VALUES (
            p_invoice_id, v_invoice.status, v_new_status,
            'system', 'Refund processed - payment status updated'
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMIT;
