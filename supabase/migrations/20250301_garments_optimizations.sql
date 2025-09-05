-- Garments optimizations: stage counts, paginated RPC, indexes
-- Safe to re-run: use OR REPLACE and IF NOT EXISTS where possible

-- Stage counts function
CREATE OR REPLACE FUNCTION public.get_garment_stage_counts(p_shop_id uuid)
RETURNS TABLE (stage public.garment_stage_enum, count bigint)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT g.stage, COUNT(*)::bigint
  FROM public.garments g
  WHERE g.shop_id = p_shop_id
  GROUP BY g.stage;
END;
$$;

-- Paginated garments function (returns JSONB for flexibility)
CREATE OR REPLACE FUNCTION public.get_garments_paginated(
  p_shop_id uuid,
  p_stage public.garment_stage_enum DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_sort_field text DEFAULT 'created_at',
  p_sort_order text DEFAULT 'desc',
  p_limit int DEFAULT 20,
  p_cursor jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
BEGIN
  WITH filtered AS (
    SELECT
      g.id,
      g.name,
      g.stage,
      g.order_id,
      g.image_cloud_id,
      g.photo_url,
      g.preset_icon_key,
      g.preset_fill_color,
      g.notes,
      g.due_date,
      g.created_at,
      g.event_date,
      g.is_done,
      o.client_id,
      c.first_name AS client_first_name,
      c.last_name AS client_last_name,
      CONCAT(c.first_name, ' ', c.last_name) AS client_full_name
    FROM public.garments g
    LEFT JOIN public.orders o ON o.id = g.order_id
    LEFT JOIN public.clients c ON c.id = o.client_id
    WHERE g.shop_id = p_shop_id
      AND (p_stage IS NULL OR g.stage = p_stage)
      AND (
        p_search IS NULL
        OR g.name ILIKE '%' || p_search || '%'
        OR COALESCE(g.notes, '') ILIKE '%' || p_search || '%'
        OR COALESCE(c.first_name, '') ILIKE '%' || p_search || '%'
        OR COALESCE(c.last_name, '') ILIKE '%' || p_search || '%'
      )
  ),
  sorted AS (
    SELECT * FROM filtered
    ORDER BY
      CASE WHEN p_sort_field = 'due_date' THEN due_date::timestamp END NULLS LAST,
      CASE WHEN p_sort_field = 'created_at' THEN created_at::timestamp END,
      CASE WHEN p_sort_field = 'name' THEN name END,
      CASE WHEN p_sort_field = 'client_name' THEN client_full_name END,
      id
  ),
  limited AS (
    SELECT * FROM sorted
    LIMIT LEAST(GREATEST(p_limit, 1), 100)
  ),
  total AS (
    SELECT COUNT(*)::int AS total_count FROM filtered
  )
  SELECT jsonb_build_object(
    'garments', COALESCE(jsonb_agg(to_jsonb(limited.*) ORDER BY limited.created_at), '[]'::jsonb),
    'hasMore', (SELECT COUNT(*) > LEAST(GREATEST(p_limit, 1), 100) FROM sorted),
    'totalCount', (SELECT total_count FROM total)
  ) INTO v_result
  FROM limited;

  RETURN v_result;
END;
$$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_garments_shop_stage ON public.garments(shop_id, stage);
CREATE INDEX IF NOT EXISTS idx_garments_created_at ON public.garments(created_at);
CREATE INDEX IF NOT EXISTS idx_garments_due_date ON public.garments(due_date);
CREATE INDEX IF NOT EXISTS idx_clients_name_trgm ON public.clients USING gin ((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_garments_name_notes_trgm ON public.garments USING gin ((name || ' ' || COALESCE(notes, '')) gin_trgm_ops);


