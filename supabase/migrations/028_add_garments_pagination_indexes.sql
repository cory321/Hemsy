-- Add indexes for efficient pagination on garments table

-- Composite index for shop_id and created_at (for cursor-based pagination)
CREATE INDEX IF NOT EXISTS idx_garments_shop_created 
ON garments (shop_id, created_at DESC);

-- Index for due_date sorting
CREATE INDEX IF NOT EXISTS idx_garments_shop_due_date 
ON garments (shop_id, due_date) 
WHERE due_date IS NOT NULL;

-- Index for event_date sorting
CREATE INDEX IF NOT EXISTS idx_garments_shop_event_date 
ON garments (shop_id, event_date) 
WHERE event_date IS NOT NULL;

-- Index for garment name search (using GIN for pattern matching)
CREATE INDEX IF NOT EXISTS idx_garments_name_gin 
ON garments USING gin (name gin_trgm_ops);

-- Index for notes search (using GIN for pattern matching)
CREATE INDEX IF NOT EXISTS idx_garments_notes_gin 
ON garments USING gin (notes gin_trgm_ops) 
WHERE notes IS NOT NULL;

-- Enable trigram extension for pattern matching if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add comment explaining the indexes
COMMENT ON INDEX idx_garments_shop_created IS 'Composite index for efficient cursor-based pagination by shop and creation date';
COMMENT ON INDEX idx_garments_shop_due_date IS 'Index for sorting garments by due date within a shop';
COMMENT ON INDEX idx_garments_shop_event_date IS 'Index for sorting garments by event date within a shop';
COMMENT ON INDEX idx_garments_name_gin IS 'GIN index for full-text search on garment names';
COMMENT ON INDEX idx_garments_notes_gin IS 'GIN index for full-text search on garment notes';
