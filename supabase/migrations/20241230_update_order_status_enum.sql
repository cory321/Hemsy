-- Migration to update order status types
-- New status types: 'new' | 'active' | 'ready' | 'completed' | 'cancelled'

-- Create the new order_status enum type
DO $$
BEGIN
    -- Check if the type doesn't exist, then create it
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('new', 'active', 'ready', 'completed', 'cancelled');
    END IF;
END$$;

-- Update the orders table to use the new enum type
-- First, we need to map existing values to new ones
ALTER TABLE orders ADD COLUMN status_new order_status;

-- Map old values to new values
UPDATE orders 
SET status_new = 
    CASE 
        WHEN status = 'pending' THEN 'new'::order_status
        WHEN status = 'partially_paid' THEN 'active'::order_status
        WHEN status = 'paid' THEN 'completed'::order_status
        WHEN status = 'cancelled' THEN 'cancelled'::order_status
        ELSE 'new'::order_status  -- Default to 'new' for any unknown values
    END;

-- Drop the old status column and rename the new one
ALTER TABLE orders DROP COLUMN status;
ALTER TABLE orders RENAME COLUMN status_new TO status;

-- Set default value for the status column
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'new'::order_status;

-- Make the column NOT NULL
ALTER TABLE orders ALTER COLUMN status SET NOT NULL;

-- Add a comment to document the enum values
COMMENT ON COLUMN orders.status IS 'Order status: new (just created), active (work started/partial payment), ready (ready for pickup), completed (fully paid/delivered), cancelled';

-- Create or update the function to update order status based on payment
CREATE OR REPLACE FUNCTION update_order_status_from_payment()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE orders
    SET status = CASE
        WHEN paid_amount_cents >= total_cents THEN 'completed'::order_status
        WHEN paid_amount_cents > 0 THEN 'active'::order_status
        ELSE 'new'::order_status
    END
    WHERE id = NEW.order_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_order_status_on_payment ON payments;
CREATE TRIGGER update_order_status_on_payment
    AFTER INSERT OR UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_order_status_from_payment();
