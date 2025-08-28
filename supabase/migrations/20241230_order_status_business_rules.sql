-- Migration to implement order status business rules based on garment stages
-- Order status is now derived from garment stages, not payment status

-- Function to determine order status based on garment stages
CREATE OR REPLACE FUNCTION calculate_order_status(p_order_id UUID)
RETURNS order_status AS $$
DECLARE
    v_total_garments INT;
    v_new_garments INT;
    v_in_progress_garments INT;
    v_ready_garments INT;
    v_done_garments INT;
    v_result order_status;
BEGIN
    -- Count garments by stage
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE stage = 'New'),
        COUNT(*) FILTER (WHERE stage = 'In Progress'),
        COUNT(*) FILTER (WHERE stage = 'Ready For Pickup'),
        COUNT(*) FILTER (WHERE stage = 'Done')
    INTO 
        v_total_garments,
        v_new_garments,
        v_in_progress_garments,
        v_ready_garments,
        v_done_garments
    FROM garments
    WHERE order_id = p_order_id;

    -- Apply business rules for order status
    IF v_total_garments = 0 THEN
        -- No garments, order is new
        v_result := 'new'::order_status;
    ELSIF v_new_garments = v_total_garments THEN
        -- All garments are new → new
        v_result := 'new'::order_status;
    ELSIF v_done_garments = v_total_garments THEN
        -- All garments are done → completed
        v_result := 'completed'::order_status;
    ELSIF (v_ready_garments + v_done_garments) = v_total_garments THEN
        -- All garments are either ready or done (but not all done) → ready
        v_result := 'ready'::order_status;
    ELSE
        -- Mixed states (some new, some in progress, some ready, etc.) → active
        -- This includes:
        -- - Any garments in progress
        -- - Some new + some ready
        -- - Some new + some done
        -- - Any other mixed combination
        v_result := 'active'::order_status;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to update garment stage based on services
CREATE OR REPLACE FUNCTION update_garment_stage_from_services()
RETURNS TRIGGER AS $$
DECLARE
    v_total_services INT;
    v_completed_services INT;
    v_new_stage garment_stage_enum;
    v_old_order_status order_status;
    v_new_order_status order_status;
BEGIN
    -- Count services for the garment
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE completed = true)
    INTO 
        v_total_services,
        v_completed_services
    FROM garment_services
    WHERE garment_id = NEW.garment_id;

    -- Determine new garment stage based on service completion
    IF v_completed_services = 0 THEN
        -- No services completed, garment stays as New
        v_new_stage := 'New'::garment_stage_enum;
    ELSIF v_completed_services = v_total_services AND v_total_services = 1 THEN
        -- Single service completed, garment is ready
        v_new_stage := 'Ready For Pickup'::garment_stage_enum;
    ELSIF v_completed_services = v_total_services AND v_total_services > 1 THEN
        -- All services completed (multiple services), garment is ready
        v_new_stage := 'Ready For Pickup'::garment_stage_enum;
    ELSIF v_completed_services > 0 THEN
        -- Some but not all services completed
        v_new_stage := 'In Progress'::garment_stage_enum;
    ELSE
        v_new_stage := 'New'::garment_stage_enum;
    END IF;

    -- Update garment stage
    UPDATE garments 
    SET stage = v_new_stage
    WHERE id = NEW.garment_id;

    -- Get the order ID and update order status
    UPDATE orders
    SET status = calculate_order_status(
        (SELECT order_id FROM garments WHERE id = NEW.garment_id)
    )
    WHERE id = (SELECT order_id FROM garments WHERE id = NEW.garment_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update order status when garment stage changes
CREATE OR REPLACE FUNCTION update_order_status_from_garments()
RETURNS TRIGGER AS $$
BEGIN
    -- Update order status based on all garments
    UPDATE orders
    SET status = calculate_order_status(NEW.order_id)
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle garment pickup (moves to Done stage)
CREATE OR REPLACE FUNCTION mark_garment_picked_up(p_garment_id UUID)
RETURNS void AS $$
BEGIN
    -- Update garment to Done stage
    UPDATE garments 
    SET stage = 'Done'::garment_stage_enum
    WHERE id = p_garment_id;
    
    -- Order status will be automatically updated by trigger
END;
$$ LANGUAGE plpgsql;

-- Remove old payment-based order status trigger
DROP TRIGGER IF EXISTS update_order_status_on_payment ON payments;
DROP FUNCTION IF EXISTS update_order_status_from_payment();

-- Create trigger for service completion affecting garment stage
DROP TRIGGER IF EXISTS update_garment_on_service_change ON garment_services;
CREATE TRIGGER update_garment_on_service_change
    AFTER INSERT OR UPDATE OF completed ON garment_services
    FOR EACH ROW
    EXECUTE FUNCTION update_garment_stage_from_services();

-- Create trigger for garment stage changes affecting order status
DROP TRIGGER IF EXISTS update_order_on_garment_change ON garments;
CREATE TRIGGER update_order_on_garment_change
    AFTER INSERT OR UPDATE OF stage ON garments
    FOR EACH ROW
    EXECUTE FUNCTION update_order_status_from_garments();

-- Update existing orders to use the new status calculation
UPDATE orders
SET status = calculate_order_status(id);

-- Set default value for new orders
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'new'::order_status;

-- Add comments explaining the business rules
COMMENT ON FUNCTION calculate_order_status IS 'Calculates order status based on garment stages:
- new: All garments are New (no work started on any garment)
- active: Mixed garment stages (work in progress on order) - includes any combination where not all garments are at the same stage
- ready: All garments are Ready For Pickup or Done (but not all Done)
- completed: All garments are Done (all picked up)
- cancelled: Order is cancelled (set manually)';

COMMENT ON FUNCTION update_garment_stage_from_services IS 'Updates garment stage based on service completion:
- New: No services completed
- In Progress: Some services completed (when multiple services)
- Ready For Pickup: All services completed or single service completed
- Done: Garment has been picked up (set via mark_garment_picked_up)';

COMMENT ON COLUMN orders.status IS 'Order status derived from garment stages:
- new: Just created, no work started
- active: Work in progress on garments
- ready: All garments ready for pickup
- completed: All garments picked up/delivered
- cancelled: Order cancelled (manual)';
