-- Create garment_service_time_entries table to track time per service line
-- This table links to garment_services and stores minutes and timestamp

BEGIN;

CREATE TABLE IF NOT EXISTS public.garment_service_time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.garment_services(id) ON DELETE CASCADE,
  minutes integer NOT NULL CHECK (minutes > 0),
  logged_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS garment_service_time_entries_service_id_idx
  ON public.garment_service_time_entries(service_id);

CREATE INDEX IF NOT EXISTS garment_service_time_entries_logged_at_idx
  ON public.garment_service_time_entries(logged_at);

COMMIT;


