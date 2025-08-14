-- Add optional preset color columns to garments for parameterized SVG presets
ALTER TABLE public.garments
  ADD COLUMN IF NOT EXISTS preset_fill_color TEXT NULL;

-- No backfill necessary; values are optional


