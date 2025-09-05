-- Migration to fix overdue garment filtering for pagination
-- This ensures consistent counts between dashboard and garments page
--
-- NOTE: This function is created for future use. Currently, the application
-- uses an over-fetch approach in getGarmentsPaginated to ensure correct counts.
-- A future improvement would be to create a view that uses this function
-- or implement it as an RPC call.

-- Create a function to determine if a garment is truly overdue
-- A garment is NOT overdue if:
-- 1. It has no due date
-- 2. All its active (non-removed) services are completed
-- 3. It's in Done or Ready For Pickup stage
CREATE OR REPLACE FUNCTION is_garment_truly_overdue(
  p_garment_id UUID,
  p_due_date DATE,
  p_stage garment_stage_enum
) RETURNS BOOLEAN AS $$
DECLARE
  v_active_services INTEGER;
  v_completed_services INTEGER;
BEGIN
  -- No due date means not overdue
  IF p_due_date IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Done or Ready For Pickup stages are never overdue
  IF p_stage IN ('Done', 'Ready For Pickup') THEN
    RETURN FALSE;
  END IF;

  -- Due date must be in the past
  IF p_due_date >= CURRENT_DATE THEN
    RETURN FALSE;
  END IF;

  -- Check service completion status
  SELECT 
    COUNT(*) FILTER (WHERE NOT is_removed),
    COUNT(*) FILTER (WHERE is_done AND NOT is_removed)
  INTO v_active_services, v_completed_services
  FROM garment_services
  WHERE garment_id = p_garment_id;

  -- If no active services or all services completed, not overdue
  -- This matches the logic in overdue-logic.ts
  IF v_active_services = 0 OR v_active_services = v_completed_services THEN
    RETURN FALSE;
  END IF;

  -- Otherwise, it's overdue
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

-- Create index to optimize the function
CREATE INDEX IF NOT EXISTS idx_garment_services_garment_id_status 
ON garment_services(garment_id, is_removed, is_done)
WHERE NOT is_removed;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION is_garment_truly_overdue TO authenticated;
