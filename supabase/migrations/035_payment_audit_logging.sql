-- Migration: 035_payment_audit_logging.sql
-- Description: Add payment audit logging for card-present transactions

BEGIN;

-- Create payment audit logs table
CREATE TABLE IF NOT EXISTS payment_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    
    -- Audit details
    action TEXT NOT NULL CHECK (action IN ('created', 'confirmed', 'cancelled', 'failed', 'completed')),
    details JSONB NOT NULL DEFAULT '{}',
    
    -- Request metadata
    user_agent TEXT,
    ip_address INET,
    
    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_payment_audit_logs_payment_id ON payment_audit_logs(payment_id);
CREATE INDEX idx_payment_audit_logs_action ON payment_audit_logs(action);
CREATE INDEX idx_payment_audit_logs_timestamp ON payment_audit_logs(timestamp DESC);

-- Enable RLS
ALTER TABLE payment_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy for shop owners
CREATE POLICY "Shop owners can view their payment audit logs" ON payment_audit_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        JOIN shops s ON i.shop_id = s.id
        WHERE p.id = payment_audit_logs.payment_id
        AND s.owner_user_id = auth.uid()
    )
);

-- RLS policy for inserting audit logs (system only)
CREATE POLICY "System can insert payment audit logs" ON payment_audit_logs
FOR INSERT WITH CHECK (true);

-- Function to automatically log payment status changes
CREATE OR REPLACE FUNCTION log_payment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log status changes
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        INSERT INTO payment_audit_logs (
            payment_id,
            action,
            details
        ) VALUES (
            NEW.id,
            CASE NEW.status
                WHEN 'completed' THEN 'completed'
                WHEN 'failed' THEN 'failed'
                ELSE 'confirmed'
            END,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'processed_at', NEW.processed_at,
                'payment_method', NEW.payment_method,
                'amount_cents', NEW.amount_cents
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic audit logging
CREATE TRIGGER payment_status_audit_trigger
    AFTER UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION log_payment_status_change();

COMMIT;
