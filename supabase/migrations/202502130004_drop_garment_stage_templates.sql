-- Drop the garment_stage_templates table as it's no longer needed
-- with hard-coded garment stages

-- Drop the table (CASCADE will also drop any dependent objects)
DROP TABLE IF EXISTS public.garment_stage_templates CASCADE;
