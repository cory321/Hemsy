-- Enforce single email signature per shop
-- This migration ensures each shop can only have one email signature

-- First, clean up any duplicate signatures (keep the most recent one)
WITH ranked_signatures AS (
  SELECT 
    id,
    shop_id,
    ROW_NUMBER() OVER (PARTITION BY shop_id ORDER BY updated_at DESC, created_at DESC) as rn
  FROM email_signatures
)
DELETE FROM email_signatures
WHERE id IN (
  SELECT id FROM ranked_signatures WHERE rn > 1
);

-- Add unique constraint on shop_id to enforce single signature per shop
ALTER TABLE email_signatures 
ADD CONSTRAINT email_signatures_shop_id_unique UNIQUE (shop_id);

-- Drop the is_default column as it's no longer needed (only one signature per shop)
ALTER TABLE email_signatures 
DROP COLUMN IF EXISTS is_default;

-- Update the name column to be nullable since we don't need to distinguish between signatures
ALTER TABLE email_signatures 
ALTER COLUMN name DROP NOT NULL;

-- Add a comment to clarify the single signature design
COMMENT ON TABLE email_signatures IS 'Stores a single email signature per shop that is automatically appended to outgoing emails';
