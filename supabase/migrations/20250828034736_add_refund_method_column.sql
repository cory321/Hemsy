-- Add refund_method column to refunds table to support manual refunds
-- This column tracks how the refund was processed (cash, external_pos, stripe, etc.)

ALTER TABLE refunds 
ADD COLUMN refund_method TEXT CHECK (refund_method IN ('stripe', 'cash', 'external_pos', 'other'));

-- Add comment to explain the column
COMMENT ON COLUMN refunds.refund_method IS 'Method used to process the refund: stripe (automatic), cash, external_pos, or other (manual methods)';

-- Set default value for existing records (they should all be Stripe refunds)
UPDATE refunds 
SET refund_method = 'stripe' 
WHERE refund_method IS NULL AND stripe_refund_id IS NOT NULL;

-- For any records without stripe_refund_id, set to 'other' (shouldn't exist but safety)
UPDATE refunds 
SET refund_method = 'other' 
WHERE refund_method IS NULL;

-- Make the column NOT NULL after setting defaults
ALTER TABLE refunds 
ALTER COLUMN refund_method SET NOT NULL;

-- Set default for new records
ALTER TABLE refunds 
ALTER COLUMN refund_method SET DEFAULT 'stripe';
