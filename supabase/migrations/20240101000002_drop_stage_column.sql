-- This migration drops the old 'stage' column from the garments table
-- Run this after verifying that all garments have been migrated to use stage_id

-- Optional: First check if any garments still have stage_id as NULL
-- SELECT COUNT(*) FROM public.garments WHERE stage_id IS NULL;

-- Drop the old stage column
ALTER TABLE public.garments DROP COLUMN IF EXISTS stage;
