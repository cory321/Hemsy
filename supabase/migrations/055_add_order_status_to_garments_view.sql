-- Add order status to the garments_with_clients view to enable filtering out canceled orders

-- Drop the existing view
DROP VIEW IF EXISTS public.garments_with_clients;

-- Recreate the view with order status included
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
  -- Order information
  o.status as order_status,
  -- Client information (nullable for garments without orders/clients)
  c.id as client_id,
  c.first_name as client_first_name,
  c.last_name as client_last_name,
  CASE 
    WHEN c.id IS NOT NULL THEN (c.first_name || ' ' || c.last_name)
    ELSE NULL
  END as client_full_name
FROM public.garments g
LEFT JOIN public.orders o ON g.order_id = o.id
LEFT JOIN public.clients c ON o.client_id = c.id;

-- Grant necessary permissions
GRANT SELECT ON public.garments_with_clients TO authenticated;
GRANT SELECT ON public.garments_with_clients TO service_role;

-- Create RLS policy for the view (inherits from base tables)
ALTER VIEW public.garments_with_clients SET (security_invoker = on);

-- Add comment explaining the view
COMMENT ON VIEW public.garments_with_clients IS 'Flattened view of garments with client and order information for easier searching and filtering. Includes order status to enable filtering out canceled orders. Uses LEFT JOINs to include all garments, even those without orders or clients.';
