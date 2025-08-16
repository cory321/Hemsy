-- Create a view that joins garments with client information for easier searching
CREATE OR REPLACE VIEW public.garments_with_clients AS
SELECT 
  g.id,
  g.order_id,
  g.shop_id,
  g.name,
  g.stage,
  g.photo_url,
  g.image_cloud_id,
  g.preset_icon_key,
  g.preset_fill_color,
  g.notes,
  g.due_date,
  g.event_date,
  g.is_done,
  g.created_at,
  g.updated_at,
  -- Client information
  c.id as client_id,
  c.first_name as client_first_name,
  c.last_name as client_last_name,
  (c.first_name || ' ' || c.last_name) as client_full_name
FROM public.garments g
JOIN public.orders o ON g.order_id = o.id
JOIN public.clients c ON o.client_id = c.id;

-- Grant necessary permissions
GRANT SELECT ON public.garments_with_clients TO authenticated;
GRANT SELECT ON public.garments_with_clients TO service_role;

-- Create RLS policy for the view (inherits from base tables)
ALTER VIEW public.garments_with_clients SET (security_invoker = on);

-- Add comment explaining the view
COMMENT ON VIEW public.garments_with_clients IS 'Flattened view of garments with client information for easier searching and filtering';

-- Create an index on the base tables to improve view performance
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_garments_order_id ON public.garments(order_id);

-- Create a compound index for common search patterns
CREATE INDEX IF NOT EXISTS idx_garments_shop_id_created_at ON public.garments(shop_id, created_at DESC);
