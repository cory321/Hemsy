-- Drop preset_outline_color if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'garments'
      AND column_name = 'preset_outline_color'
  ) THEN
    ALTER TABLE public.garments
      DROP COLUMN preset_outline_color;
  END IF;
END $$;


