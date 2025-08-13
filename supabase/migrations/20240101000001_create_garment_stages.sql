-- Create garment_stages table
CREATE TABLE IF NOT EXISTS public.garment_stages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    color TEXT DEFAULT '#D6C4F2',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for shop_id and position
CREATE INDEX idx_garment_stages_shop_id ON public.garment_stages(shop_id);
CREATE INDEX idx_garment_stages_position ON public.garment_stages(shop_id, position);

-- Add unique constraint for shop_id and position
ALTER TABLE public.garment_stages ADD CONSTRAINT unique_shop_position UNIQUE (shop_id, position);

-- Create or replace function to initialize default stages for a shop
CREATE OR REPLACE FUNCTION initialize_default_garment_stages()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default stages for the new shop
    INSERT INTO public.garment_stages (shop_id, name, position, color)
    VALUES 
        (NEW.id, 'New', 1, '#4CAF50'),
        (NEW.id, 'In Progress', 2, '#2196F3'),
        (NEW.id, 'Done', 3, '#9C27B0'),
        (NEW.id, 'Archived', 4, '#757575');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to initialize default stages when a shop is created
CREATE TRIGGER create_default_stages_on_shop_insert
    AFTER INSERT ON public.shops
    FOR EACH ROW
    EXECUTE FUNCTION initialize_default_garment_stages();

-- Add stage_id column to garments table
ALTER TABLE public.garments ADD COLUMN stage_id UUID;

-- Create foreign key constraint
ALTER TABLE public.garments 
    ADD CONSTRAINT garments_stage_id_fkey 
    FOREIGN KEY (stage_id) 
    REFERENCES public.garment_stages(id) 
    ON DELETE SET NULL;

-- Create index on stage_id
CREATE INDEX idx_garments_stage_id ON public.garments(stage_id);

-- Migrate existing garments to use the new stage_id
-- First, create stages for existing shops if they don't have them
INSERT INTO public.garment_stages (shop_id, name, position, color)
SELECT DISTINCT 
    g.shop_id,
    'New',
    1,
    '#4CAF50'
FROM (
    SELECT DISTINCT shop_id FROM public.garments WHERE shop_id IS NOT NULL
) g
WHERE NOT EXISTS (
    SELECT 1 FROM public.garment_stages gs WHERE gs.shop_id = g.shop_id
);

INSERT INTO public.garment_stages (shop_id, name, position, color)
SELECT DISTINCT 
    g.shop_id,
    'In Progress',
    2,
    '#2196F3'
FROM (
    SELECT DISTINCT shop_id FROM public.garments WHERE shop_id IS NOT NULL
) g
WHERE EXISTS (
    SELECT 1 FROM public.garment_stages gs WHERE gs.shop_id = g.shop_id AND gs.position = 1
)
AND NOT EXISTS (
    SELECT 1 FROM public.garment_stages gs WHERE gs.shop_id = g.shop_id AND gs.position = 2
);

INSERT INTO public.garment_stages (shop_id, name, position, color)
SELECT DISTINCT 
    g.shop_id,
    'Done',
    3,
    '#9C27B0'
FROM (
    SELECT DISTINCT shop_id FROM public.garments WHERE shop_id IS NOT NULL
) g
WHERE EXISTS (
    SELECT 1 FROM public.garment_stages gs WHERE gs.shop_id = g.shop_id AND gs.position = 2
)
AND NOT EXISTS (
    SELECT 1 FROM public.garment_stages gs WHERE gs.shop_id = g.shop_id AND gs.position = 3
);

INSERT INTO public.garment_stages (shop_id, name, position, color)
SELECT DISTINCT 
    g.shop_id,
    'Archived',
    4,
    '#757575'
FROM (
    SELECT DISTINCT shop_id FROM public.garments WHERE shop_id IS NOT NULL
) g
WHERE EXISTS (
    SELECT 1 FROM public.garment_stages gs WHERE gs.shop_id = g.shop_id AND gs.position = 3
)
AND NOT EXISTS (
    SELECT 1 FROM public.garment_stages gs WHERE gs.shop_id = g.shop_id AND gs.position = 4
);

-- Now update garments to use stage_id based on their current stage text
UPDATE public.garments g
SET stage_id = gs.id
FROM public.garment_stages gs
WHERE g.shop_id = gs.shop_id
AND (
    (g.stage = 'New' AND gs.name = 'New' AND gs.position = 1) OR
    (g.stage = 'In Progress' AND gs.name = 'In Progress' AND gs.position = 2) OR
    (g.stage = 'Done' AND gs.name = 'Done' AND gs.position = 3) OR
    (g.stage = 'Archived' AND gs.name = 'Archived' AND gs.position = 4) OR
    (g.stage IS NULL AND gs.name = 'New' AND gs.position = 1) OR
    (g.stage NOT IN ('New', 'In Progress', 'Done', 'Archived') AND gs.name = 'New' AND gs.position = 1)
);

-- For any garments without a shop_id, we'll leave stage_id as NULL

-- Drop the old stage column (commented out for safety - run this separately after verifying migration)
-- ALTER TABLE public.garments DROP COLUMN stage;

-- Add shop_id to garments if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'garments' 
                   AND column_name = 'shop_id') THEN
        ALTER TABLE public.garments ADD COLUMN shop_id UUID;
        ALTER TABLE public.garments 
            ADD CONSTRAINT garments_shop_id_fkey 
            FOREIGN KEY (shop_id) 
            REFERENCES public.shops(id) 
            ON DELETE CASCADE;
        CREATE INDEX idx_garments_shop_id ON public.garments(shop_id);
    END IF;
END $$;

-- Update shop_id for existing garments based on their orders
UPDATE public.garments g
SET shop_id = o.shop_id
FROM public.orders o
WHERE g.order_id = o.id
AND g.shop_id IS NULL;
