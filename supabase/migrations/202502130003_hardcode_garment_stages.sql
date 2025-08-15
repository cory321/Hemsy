-- Migration to hardcode garment stages and remove customization
-- This removes the garment_stages table and adds a fixed stage column to garments

-- Step 1: Create a new stage column with enum type
CREATE TYPE garment_stage_enum AS ENUM ('New', 'In Progress', 'Ready For Pickup', 'Done');

-- Step 2: Add the new stage column to garments table
ALTER TABLE public.garments ADD COLUMN stage garment_stage_enum DEFAULT 'New';

-- Step 3: Migrate existing data from stage_id to the new stage column
UPDATE public.garments g
SET stage = CASE 
    WHEN gs.name ILIKE '%new%' THEN 'New'::garment_stage_enum
    WHEN gs.name ILIKE '%progress%' THEN 'In Progress'::garment_stage_enum
    WHEN gs.name ILIKE '%ready%' OR gs.name ILIKE '%pickup%' THEN 'Ready For Pickup'::garment_stage_enum
    WHEN gs.name ILIKE '%done%' OR gs.name ILIKE '%complete%' OR gs.name ILIKE '%archive%' THEN 'Done'::garment_stage_enum
    ELSE 'New'::garment_stage_enum
END
FROM public.garment_stages gs
WHERE g.stage_id = gs.id;

-- Step 4: Drop the foreign key constraint
ALTER TABLE public.garments DROP CONSTRAINT IF EXISTS garments_stage_id_fkey;

-- Step 5: Drop the stage_id column
ALTER TABLE public.garments DROP COLUMN stage_id;

-- Step 6: Remove the trigger that creates default stages
DROP TRIGGER IF EXISTS create_default_stages_on_shop_insert ON public.shops;
DROP FUNCTION IF EXISTS initialize_default_garment_stages();

-- Step 7: Drop the garment_stages table
DROP TABLE IF EXISTS public.garment_stages;

-- Step 8: Add index on the new stage column for performance
CREATE INDEX idx_garments_stage ON public.garments(stage);

-- Step 9: Update RLS policies if needed (garments table already has RLS)
-- No changes needed as existing RLS policies should still work

-- Step 10: Add a comment describing the valid stage values
COMMENT ON COLUMN public.garments.stage IS 'Fixed garment stages: New, In Progress, Ready For Pickup, Done';
