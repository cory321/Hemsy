-- ============================================================================
-- Phase 3 Database Query Optimization - RPC Functions
-- ============================================================================
-- 
-- This migration creates optimized RPC functions to consolidate complex
-- multi-query operations into single database calls, reducing round-trips
-- and improving performance.
-- 
-- Functions created:
-- 1. get_business_dashboard_metrics_consolidated - Combines all business health queries
-- 2. get_garment_pipeline_data_consolidated - Combines garment counts and active garments
-- 3. get_client_detail_data_consolidated - Client detail page data in one call
-- ============================================================================

-- ============================================================================
-- 1. BUSINESS DASHBOARD METRICS CONSOLIDATED
-- ============================================================================
-- 
-- Replaces 5+ separate queries with a single RPC call:
-- - Current month revenue
-- - Last month revenue  
-- - Unpaid balance calculation
-- - Rolling 30-day revenue
-- - Previous 30-day revenue
-- ============================================================================

CREATE OR REPLACE FUNCTION get_business_dashboard_metrics_consolidated(
  p_shop_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  current_month_start DATE;
  current_month_end DATE;
  last_month_start DATE;
  last_month_end DATE;
  rolling_30_start TIMESTAMP;
  previous_30_start TIMESTAMP;
  previous_30_end TIMESTAMP;
BEGIN
  -- Calculate date ranges
  current_month_start := date_trunc('month', CURRENT_DATE);
  current_month_end := CURRENT_DATE + INTERVAL '1 day'; -- Exclusive end
  
  last_month_start := date_trunc('month', CURRENT_DATE - INTERVAL '1 month');
  last_month_end := current_month_start; -- Start of current month
  
  rolling_30_start := NOW() - INTERVAL '30 days';
  previous_30_start := NOW() - INTERVAL '60 days';
  previous_30_end := NOW() - INTERVAL '30 days';

  -- Build consolidated result using CTEs for performance
  WITH revenue_data AS (
    SELECT 
      -- Current month revenue
      COALESCE(SUM(
        CASE 
          WHEN p.created_at >= current_month_start 
           AND p.created_at < current_month_end 
           AND p.status IN ('completed', 'partially_refunded')
          THEN p.amount_cents - COALESCE(p.refunded_amount_cents, 0)
          ELSE 0 
        END
      ), 0) AS current_month_revenue_cents,
      
      -- Last month same period revenue
      COALESCE(SUM(
        CASE 
          WHEN p.created_at >= last_month_start 
           AND p.created_at < last_month_end 
           AND p.status IN ('completed', 'partially_refunded')
          THEN p.amount_cents - COALESCE(p.refunded_amount_cents, 0)
          ELSE 0 
        END
      ), 0) AS last_month_revenue_cents,
      
      -- Rolling 30-day revenue
      COALESCE(SUM(
        CASE 
          WHEN p.created_at >= rolling_30_start 
           AND p.status IN ('completed', 'partially_refunded')
          THEN p.amount_cents - COALESCE(p.refunded_amount_cents, 0)
          ELSE 0 
        END
      ), 0) AS rolling_30_revenue_cents,
      
      -- Previous 30-day revenue
      COALESCE(SUM(
        CASE 
          WHEN p.created_at >= previous_30_start 
           AND p.created_at < previous_30_end 
           AND p.status IN ('completed', 'partially_refunded')
          THEN p.amount_cents - COALESCE(p.refunded_amount_cents, 0)
          ELSE 0 
        END
      ), 0) AS previous_30_revenue_cents
    FROM payments p
    INNER JOIN invoices i ON p.invoice_id = i.id
    WHERE i.shop_id = p_shop_id
  ),
  unpaid_data AS (
    SELECT 
      COALESCE(SUM(
        o.total_cents - COALESCE(
          (SELECT SUM(p.amount_cents - COALESCE(p.refunded_amount_cents, 0))
           FROM payments p
           INNER JOIN invoices i ON p.invoice_id = i.id
           WHERE i.order_id = o.id AND p.status IN ('completed', 'partially_refunded')
          ), 0
        )
      ), 0) AS unpaid_balance_cents
    FROM orders o
    WHERE o.shop_id = p_shop_id 
      AND o.status != 'cancelled'
      AND o.total_cents > COALESCE(
        (SELECT SUM(p.amount_cents - COALESCE(p.refunded_amount_cents, 0))
         FROM payments p
         INNER JOIN invoices i ON p.invoice_id = i.id
         WHERE i.order_id = o.id AND p.status IN ('completed', 'partially_refunded')
        ), 0
      )
  )
  SELECT json_build_object(
    'currentMonthRevenueCents', r.current_month_revenue_cents,
    'lastMonthRevenueCents', r.last_month_revenue_cents,
    'unpaidBalanceCents', u.unpaid_balance_cents,
    'rolling30RevenueCents', r.rolling_30_revenue_cents,
    'previous30RevenueCents', r.previous_30_revenue_cents,
    'calculatedAt', NOW()
  ) INTO result
  FROM revenue_data r, unpaid_data u;

  RETURN result;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_business_dashboard_metrics_consolidated(UUID) TO authenticated;

-- ============================================================================
-- 2. GARMENT PIPELINE DATA CONSOLIDATED  
-- ============================================================================
-- 
-- Replaces multiple queries for garment pipeline with single RPC:
-- - Stage counts for all stages
-- - Active garments with progress calculation
-- - Ready for pickup garments
-- ============================================================================

CREATE OR REPLACE FUNCTION get_garment_pipeline_data_consolidated(
  p_shop_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH garment_data AS (
    SELECT 
      g.*,
      o.status as order_status,
      o.order_number,
      c.first_name,
      c.last_name,
      -- Calculate progress based on completed services
      CASE 
        WHEN COALESCE(gs_total.total_services, 0) = 0 THEN 0
        ELSE ROUND((COALESCE(gs_done.done_services, 0)::DECIMAL / gs_total.total_services) * 100)
      END as progress_percentage
    FROM garments g
    INNER JOIN orders o ON g.order_id = o.id
    INNER JOIN clients c ON o.client_id = c.id
    LEFT JOIN (
      SELECT 
        garment_id,
        COUNT(*) FILTER (WHERE NOT is_removed) as total_services
      FROM garment_services 
      GROUP BY garment_id
    ) gs_total ON g.id = gs_total.garment_id
    LEFT JOIN (
      SELECT 
        garment_id,
        COUNT(*) FILTER (WHERE is_done AND NOT is_removed) as done_services
      FROM garment_services 
      GROUP BY garment_id
    ) gs_done ON g.id = gs_done.garment_id
    WHERE g.shop_id = p_shop_id 
      AND o.status != 'cancelled'
  ),
  stage_counts AS (
    SELECT 
      json_build_object(
        'New', COUNT(*) FILTER (WHERE stage = 'New'),
        'In Progress', COUNT(*) FILTER (WHERE stage = 'In Progress'), 
        'Ready For Pickup', COUNT(*) FILTER (WHERE stage = 'Ready For Pickup'),
        'Done', COUNT(*) FILTER (WHERE stage = 'Done')
      ) as counts
    FROM garment_data
  ),
  active_garments AS (
    SELECT json_agg(
      json_build_object(
        'id', id,
        'name', name,
        'stage', stage,
        'orderId', order_id,
        'orderNumber', order_number,
        'clientName', first_name || ' ' || last_name,
        'dueDate', due_date,
        'eventDate', event_date,
        'imageCloudId', image_cloud_id,
        'photoUrl', photo_url,
        'presetIconKey', preset_icon_key,
        'presetFillColor', preset_fill_color,
        'progress', progress_percentage,
        'createdAt', created_at
      ) ORDER BY 
        CASE stage 
          WHEN 'New' THEN 1
          WHEN 'In Progress' THEN 2  
          WHEN 'Ready For Pickup' THEN 3
          ELSE 4
        END,
        due_date ASC NULLS LAST,
        created_at DESC
    ) as active_list
    FROM garment_data
    WHERE stage != 'Done'
  ),
  ready_for_pickup AS (
    SELECT json_agg(
      json_build_object(
        'id', id,
        'name', name,
        'orderId', order_id,
        'orderNumber', order_number,
        'clientName', first_name || ' ' || last_name,
        'dueDate', due_date,
        'eventDate', event_date,
        'imageCloudId', image_cloud_id,
        'photoUrl', photo_url,
        'presetIconKey', preset_icon_key,
        'presetFillColor', preset_fill_color
      ) ORDER BY due_date ASC NULLS LAST, created_at DESC
    ) as ready_list
    FROM garment_data  
    WHERE stage = 'Ready For Pickup'
  )
  SELECT json_build_object(
    'stageCounts', sc.counts,
    'activeGarments', COALESCE(ag.active_list, '[]'::json),
    'readyForPickupGarments', COALESCE(rfp.ready_list, '[]'::json),
    'calculatedAt', NOW()
  ) INTO result
  FROM stage_counts sc, active_garments ag, ready_for_pickup rfp;

  RETURN result;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_garment_pipeline_data_consolidated(UUID) TO authenticated;

-- ============================================================================
-- 3. CLIENT DETAIL DATA CONSOLIDATED
-- ============================================================================
-- 
-- Consolidates client detail page queries into single RPC:
-- - Client information
-- - Client's orders with garments and payments
-- - Client's appointments  
-- - Client's order statistics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_client_detail_data_consolidated(
  p_client_id UUID,
  p_shop_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  WITH client_data AS (
    SELECT *
    FROM clients 
    WHERE id = p_client_id AND shop_id = p_shop_id
  ),
  orders_data AS (
    SELECT json_agg(
      json_build_object(
        'id', o.id,
        'orderNumber', o.order_number,
        'status', o.status,
        'totalCents', o.total_cents,
        'notes', o.notes,
        'createdAt', o.created_at,
        'updatedAt', o.updated_at,
        'garments', (
          SELECT json_agg(
            json_build_object(
              'id', g.id,
              'name', g.name,
              'stage', g.stage,
              'dueDate', g.due_date,
              'eventDate', g.event_date,
              'imageCloudId', g.image_cloud_id,
              'photoUrl', g.photo_url,
              'presetIconKey', g.preset_icon_key,
              'presetFillColor', g.preset_fill_color,
              'notes', g.notes
            )
          )
          FROM garments g 
          WHERE g.order_id = o.id
        ),
        'invoices', (
          SELECT json_agg(
            json_build_object(
              'id', i.id,
              'status', i.status,
              'amountCents', i.amount_cents,
              'payments', (
                SELECT json_agg(
                  json_build_object(
                    'id', p.id,
                    'amountCents', p.amount_cents,
                    'status', p.status,
                    'paymentMethod', p.payment_method,
                    'refundedAmountCents', p.refunded_amount_cents,
                    'createdAt', p.created_at
                  )
                )
                FROM payments p 
                WHERE p.invoice_id = i.id
              )
            )
          )
          FROM invoices i 
          WHERE i.order_id = o.id
        )
      ) ORDER BY o.created_at DESC
    ) as orders_list
    FROM orders o
    WHERE o.client_id = p_client_id AND o.shop_id = p_shop_id
  ),
  appointments_data AS (
    SELECT json_agg(
      json_build_object(
        'id', a.id,
        'date', a.date,
        'startTime', a.start_time,
        'endTime', a.end_time,
        'status', a.status,
        'type', a.type,
        'notes', a.notes,
        'orderId', a.order_id,
        'createdAt', a.created_at
      ) ORDER BY a.date DESC, a.start_time DESC
    ) as appointments_list
    FROM appointments a
    WHERE a.client_id = p_client_id AND a.shop_id = p_shop_id
  ),
  client_stats AS (
    SELECT json_build_object(
      'totalOrders', COUNT(o.id),
      'activeOrders', COUNT(o.id) FILTER (WHERE o.status IN ('new', 'in_progress', 'ready_for_pickup')),
      'completedOrders', COUNT(o.id) FILTER (WHERE o.status = 'completed'),
      'totalSpentCents', COALESCE(SUM(
        CASE WHEN o.status != 'cancelled' THEN o.total_cents ELSE 0 END
      ), 0),
      'totalPaidCents', COALESCE(SUM(
        (SELECT SUM(p.amount_cents - COALESCE(p.refunded_amount_cents, 0))
         FROM payments p
         INNER JOIN invoices i ON p.invoice_id = i.id
         WHERE i.order_id = o.id AND p.status IN ('completed', 'partially_refunded'))
      ), 0),
      'firstOrderDate', MIN(o.created_at),
      'lastOrderDate', MAX(o.created_at)
    ) as stats
    FROM orders o
    WHERE o.client_id = p_client_id AND o.shop_id = p_shop_id
  )
  SELECT json_build_object(
    'client', to_json(cd.*),
    'orders', COALESCE(od.orders_list, '[]'::json),
    'appointments', COALESCE(ad.appointments_list, '[]'::json), 
    'stats', cs.stats,
    'calculatedAt', NOW()
  ) INTO result
  FROM client_data cd, orders_data od, appointments_data ad, client_stats cs;

  RETURN result;
END;
$$;

-- Grant access to authenticated users  
GRANT EXECUTE ON FUNCTION get_client_detail_data_consolidated(UUID, UUID) TO authenticated;

-- ============================================================================
-- 4. DASHBOARD ALERTS CONSOLIDATED
-- ============================================================================
-- 
-- Consolidates alert queries for dashboard:
-- - Overdue garments count and details
-- - Due today garments count and details
-- ============================================================================

CREATE OR REPLACE FUNCTION get_dashboard_alerts_consolidated(
  p_shop_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  today_date DATE;
BEGIN
  today_date := CURRENT_DATE;

  WITH overdue_data AS (
    SELECT 
      COUNT(*) as overdue_count,
      json_agg(
        json_build_object(
          'id', g.id,
          'name', g.name,
          'dueDate', g.due_date,
          'orderNumber', o.order_number,
          'clientName', c.first_name || ' ' || c.last_name,
          'daysOverdue', today_date - g.due_date
        ) ORDER BY g.due_date ASC
      ) FILTER (WHERE g.due_date < today_date) as overdue_details
    FROM garments g
    INNER JOIN orders o ON g.order_id = o.id
    INNER JOIN clients c ON o.client_id = c.id
    WHERE g.shop_id = p_shop_id
      AND g.stage NOT IN ('Done')
      AND o.status != 'cancelled'
      AND g.due_date IS NOT NULL
      AND g.due_date < today_date
  ),
  due_today_data AS (
    SELECT 
      COUNT(*) as due_today_count,
      json_agg(
        json_build_object(
          'id', g.id,
          'name', g.name,
          'dueDate', g.due_date,
          'orderNumber', o.order_number,
          'clientName', c.first_name || ' ' || c.last_name
        ) ORDER BY g.due_date ASC
      ) FILTER (WHERE g.due_date = today_date) as due_today_details
    FROM garments g
    INNER JOIN orders o ON g.order_id = o.id
    INNER JOIN clients c ON o.client_id = c.id
    WHERE g.shop_id = p_shop_id
      AND g.stage NOT IN ('Done')
      AND o.status != 'cancelled'
      AND g.due_date = today_date
  )
  SELECT json_build_object(
    'overdueData', json_build_object(
      'count', COALESCE(od.overdue_count, 0),
      'garments', COALESCE(od.overdue_details, '[]'::json)
    ),
    'dueTodayData', json_build_object(
      'count', COALESCE(dtd.due_today_count, 0), 
      'garments', COALESCE(dtd.due_today_details, '[]'::json)
    ),
    'calculatedAt', NOW()
  ) INTO result
  FROM overdue_data od, due_today_data dtd;

  RETURN result;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_alerts_consolidated(UUID) TO authenticated;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Ensure we have optimal indexes for the RPC functions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_invoice_shop_created_status 
ON payments (invoice_id, created_at, status) 
WHERE status IN ('completed', 'partially_refunded');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_garments_shop_stage_due_date 
ON garments (shop_id, stage, due_date) 
WHERE due_date IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_client_shop_status_created 
ON orders (client_id, shop_id, status, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_client_shop_date 
ON appointments (client_id, shop_id, date DESC, start_time DESC);

-- ============================================================================
-- DOCUMENTATION COMMENT
-- ============================================================================

COMMENT ON FUNCTION get_business_dashboard_metrics_consolidated(UUID) IS 
'Phase 3 optimization: Consolidates 5+ business health queries into single RPC call for dashboard performance';

COMMENT ON FUNCTION get_garment_pipeline_data_consolidated(UUID) IS 
'Phase 3 optimization: Consolidates garment stage counts and active garments into single RPC call';

COMMENT ON FUNCTION get_client_detail_data_consolidated(UUID, UUID) IS 
'Phase 3 optimization: Consolidates client detail page queries into single RPC call';

COMMENT ON FUNCTION get_dashboard_alerts_consolidated(UUID) IS 
'Phase 3 optimization: Consolidates dashboard alert queries into single RPC call';
