-- Migration to rename order status from 'active' to 'in_progress'
-- This updates the enum value and all related functions/triggers

-- Step 0: Drop dependent views and functions
DROP VIEW IF EXISTS garments_with_clients;
DROP FUNCTION IF EXISTS calculate_order_status(uuid);

-- Step 1: Create a new temporary enum type with the updated values
CREATE TYPE order_status_new AS ENUM ('new', 'in_progress', 'ready_for_pickup', 'completed', 'cancelled');

-- Step 2: Add a temporary column to store the new enum values
ALTER TABLE orders ADD COLUMN status_temp order_status_new;

-- Step 3: Update the temporary column with mapped values
UPDATE orders 
SET status_temp = 
    CASE 
        WHEN status = 'active' THEN 'in_progress'::order_status_new
        ELSE status::text::order_status_new
    END;

-- Step 4: Drop the old column and rename the new one
ALTER TABLE orders DROP COLUMN status;
ALTER TABLE orders RENAME COLUMN status_temp TO status;

-- Step 5: Set the default and NOT NULL constraint
ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'new'::order_status_new;
ALTER TABLE orders ALTER COLUMN status SET NOT NULL;

-- Step 6: Drop the old enum type and rename the new one
DROP TYPE order_status;
ALTER TYPE order_status_new RENAME TO order_status;

-- Step 7: Update the column comment
COMMENT ON COLUMN orders.status IS 'Order status derived from garment stages:
- new: Just created, no work started
- in_progress: Work in progress on garments (was previously "active")
- ready_for_pickup: All garments ready for pickup
- completed: All garments picked up/delivered
- cancelled: Order cancelled (manual)';

-- Step 8: Recreate the calculate_order_status function with 'in_progress' instead of 'active'
CREATE OR REPLACE FUNCTION calculate_order_status(p_order_id uuid)
RETURNS order_status
LANGUAGE plpgsql
AS $$
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
        -- All garments are either ready or done (but not all done) → ready_for_pickup
        v_result := 'ready_for_pickup'::order_status;
    ELSE
        -- Mixed states (some new, some in progress, some ready, etc.) → in_progress
        -- This includes:
        -- - Any garments in progress
        -- - Some new + some ready
        -- - Some new + some done
        -- - Any other mixed combination
        v_result := 'in_progress'::order_status;  -- Changed from 'active'
    END IF;

    RETURN v_result;
END;
$$;

-- Step 9: Update the update_order_status_from_garments function to use 'in_progress' instead of 'active'
CREATE OR REPLACE FUNCTION update_order_status_from_garments()
RETURNS TRIGGER AS $$
DECLARE
    new_order_status order_status;
    cancelled_status order_status;
BEGIN
    -- Check if order is cancelled first
    SELECT status INTO cancelled_status
    FROM orders
    WHERE id = COALESCE(NEW.order_id, OLD.order_id);

    -- If order is cancelled, don't update status
    IF cancelled_status = 'cancelled' THEN
        RETURN NEW;
    END IF;

    -- Calculate new status based on garment stages
    WITH order_garment_stats AS (
        SELECT 
            COUNT(*) AS total_garments,
            COUNT(CASE WHEN stage = 'New' THEN 1 END) AS new_count,
            COUNT(CASE WHEN stage = 'Done' THEN 1 END) AS done_count,
            COUNT(CASE WHEN stage IN ('Ready For Pickup', 'Done') THEN 1 END) AS ready_or_done_count
        FROM garments
        WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
    )
    SELECT 
        CASE
            -- All garments are Done
            WHEN total_garments = done_count THEN 'completed'::order_status
            -- All garments are either Ready For Pickup or Done (but not all Done)
            WHEN total_garments = ready_or_done_count AND done_count < total_garments THEN 'ready_for_pickup'::order_status
            -- All garments are New
            WHEN total_garments = new_count THEN 'new'::order_status
            -- Mixed stages (work is in progress)
            ELSE 'in_progress'::order_status  -- Changed from 'active'
        END INTO new_order_status
    FROM order_garment_stats;

    -- Update the order status
    UPDATE orders
    SET status = new_order_status,
        updated_at = now()
    WHERE id = COALESCE(NEW.order_id, OLD.order_id)
    AND status IS DISTINCT FROM new_order_status;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Update any other functions that might reference 'active' status
-- Update the calculate_order_status function if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'calculate_order_status'
        AND pronargs != 1
    ) THEN
        CREATE OR REPLACE FUNCTION calculate_order_status(
            total_garments integer,
            new_count integer,
            done_count integer,
            ready_or_done_count integer
        ) RETURNS order_status AS $func$
        BEGIN
            RETURN CASE
                -- All garments are Done
                WHEN total_garments = done_count THEN 'completed'::order_status
                -- All garments are either Ready For Pickup or Done (but not all Done)
                WHEN total_garments = ready_or_done_count AND done_count < total_garments THEN 'ready_for_pickup'::order_status
                -- All garments are New
                WHEN total_garments = new_count THEN 'new'::order_status
                -- Mixed stages (work is in progress)
                ELSE 'in_progress'::order_status  -- Changed from 'active'
            END;
        END;
        $func$ LANGUAGE plpgsql IMMUTABLE;
    END IF;
END $$;

-- Step 11: Update the order creation function to handle payment status mapping
CREATE OR REPLACE FUNCTION create_order_from_cart(
    input_client_id UUID,
    input_garments JSONB,
    input_due_date DATE DEFAULT NULL,
    input_notes TEXT DEFAULT NULL,
    input_discount_cents INTEGER DEFAULT 0,
    input_deposit_amount_cents INTEGER DEFAULT 0
) RETURNS JSONB AS $$
DECLARE
    user_record RECORD;
    new_order RECORD;
    new_garment RECORD;
    new_invoice RECORD;
    garment_obj JSONB;
    service_obj JSONB;
    invoice_line_items JSONB := '[]'::JSONB;
    next_invoice_number INTEGER;
    invoice_prefix TEXT;
    order_subtotal INTEGER := 0;
    order_tax INTEGER := 0;
    order_total INTEGER := 0;
    shop_tax_rate NUMERIC;
BEGIN
    -- Get user and shop info
    SELECT u.id, u.clerk_user_id, s.id as shop_id, s.name as shop_name, s.tax_percent
    INTO user_record
    FROM users u
    JOIN shops s ON s.owner_user_id = u.id
    WHERE u.clerk_user_id = auth.uid()
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'User or shop not found';
    END IF;

    shop_tax_rate := COALESCE(user_record.tax_percent, 0);

    -- Get next order number
    INSERT INTO orders (
        shop_id,
        client_id,
        order_number,
        order_due_date,
        notes,
        status,
        subtotal_cents,
        discount_cents,
        tax_cents,
        total_cents,
        deposit_amount_cents
    ) VALUES (
        user_record.shop_id,
        input_client_id,
        '',  -- Will be updated with trigger
        input_due_date,
        input_notes,
        'new'::order_status,  -- Always start as 'new'
        0,  -- Will be calculated
        COALESCE(input_discount_cents, 0),
        0,  -- Will be calculated
        0,  -- Will be calculated
        COALESCE(input_deposit_amount_cents, 0)
    )
    RETURNING * INTO new_order;

    -- Create garments and services
    FOR garment_obj IN SELECT * FROM jsonb_array_elements(input_garments)
    LOOP
        -- Create garment
        INSERT INTO garments (
            order_id,
            shop_id,
            name,
            notes,
            due_date,
            event_date,
            preset_icon_key,
            preset_fill_color
        ) VALUES (
            new_order.id,
            user_record.shop_id,
            garment_obj->>'name',
            garment_obj->>'notes',
            CASE 
                WHEN garment_obj->>'due_date' IS NOT NULL 
                THEN (garment_obj->>'due_date')::DATE 
                ELSE NULL 
            END,
            CASE 
                WHEN garment_obj->>'event_date' IS NOT NULL 
                THEN (garment_obj->>'event_date')::DATE 
                ELSE NULL 
            END,
            garment_obj->>'preset_icon_key',
            garment_obj->>'preset_fill_color'
        )
        RETURNING * INTO new_garment;

        -- Create services for this garment
        IF garment_obj->'services' IS NOT NULL AND jsonb_array_length(garment_obj->'services') > 0 THEN
            FOR service_obj IN SELECT * FROM jsonb_array_elements(garment_obj->'services')
            LOOP
                INSERT INTO garment_services (
                    garment_id,
                    service_id,
                    name,
                    quantity,
                    unit,
                    unit_price_cents
                )
                SELECT 
                    new_garment.id,
                    CASE 
                        WHEN (service_obj->>'service_id')::UUID IS NOT NULL 
                        THEN (service_obj->>'service_id')::UUID 
                        ELSE NULL 
                    END,
                    service_obj->>'name',
                    COALESCE((service_obj->>'quantity')::INTEGER, 1),
                    COALESCE(service_obj->>'unit', 'flat_rate'),
                    COALESCE((service_obj->>'unit_price_cents')::INTEGER, 0);

                -- Add to subtotal
                order_subtotal := order_subtotal + (
                    COALESCE((service_obj->>'quantity')::INTEGER, 1) * 
                    COALESCE((service_obj->>'unit_price_cents')::INTEGER, 0)
                );
            END LOOP;
        END IF;
    END LOOP;

    -- Calculate tax and total
    order_tax := ROUND((order_subtotal - COALESCE(input_discount_cents, 0)) * shop_tax_rate / 100);
    order_total := order_subtotal - COALESCE(input_discount_cents, 0) + order_tax;

    -- Update order with calculated totals
    UPDATE orders
    SET 
        subtotal_cents = order_subtotal,
        tax_cents = order_tax,
        total_cents = order_total,
        updated_at = NOW()
    WHERE id = new_order.id
    RETURNING * INTO new_order;

    -- Get invoice number
    SELECT 
        COALESCE(invoice_prefix, 'INV'),
        COALESCE(last_invoice_number, 999) + 1
    INTO invoice_prefix, next_invoice_number
    FROM shop_settings
    WHERE shop_id = user_record.shop_id
    FOR UPDATE;

    -- Update the last invoice number
    UPDATE shop_settings
    SET last_invoice_number = next_invoice_number
    WHERE shop_id = user_record.shop_id;

    -- Build invoice line items
    SELECT jsonb_agg(
        jsonb_build_object(
            'garment_id', gs.garment_id,
            'service_id', gs.id,
            'description', g.name || ' - ' || gs.name,
            'quantity', gs.quantity,
            'unit_price_cents', gs.unit_price_cents,
            'total_cents', gs.line_total_cents
        )
    )
    INTO invoice_line_items
    FROM garment_services gs
    JOIN garments g ON g.id = gs.garment_id
    WHERE g.order_id = new_order.id;

    -- Create initial invoice if deposit is requested
    IF COALESCE(input_deposit_amount_cents, 0) > 0 THEN
        -- Create deposit invoice
        INSERT INTO invoices (
            shop_id,
            order_id,
            client_id,
            invoice_number,
            amount_cents,
            deposit_amount_cents,
            status,
            description,
            line_items,
            invoice_type,
            due_date
        ) VALUES (
            user_record.shop_id,
            new_order.id,
            input_client_id,
            invoice_prefix || '-' || LPAD(next_invoice_number::TEXT, 4, '0'),
            COALESCE(input_deposit_amount_cents, 0),  -- Deposit invoice is only for deposit amount
            COALESCE(input_deposit_amount_cents, 0),
            'pending',
            'Deposit for Order ' || new_order.order_number,
            invoice_line_items,
            'deposit',
            NOW() + INTERVAL '7 days'
        )
        RETURNING * INTO new_invoice;

        -- Link all garment services to this invoice
        UPDATE garment_services gs
        SET invoice_id = new_invoice.id
        FROM garments g
        WHERE gs.garment_id = g.id
        AND g.order_id = new_order.id;
    END IF;

    -- Return order details with relations
    RETURN jsonb_build_object(
        'order', row_to_json(new_order),
        'invoice', CASE 
            WHEN new_invoice.id IS NOT NULL THEN row_to_json(new_invoice)
            ELSE NULL
        END,
        'subtotal_cents', order_subtotal,
        'discount_cents', COALESCE(input_discount_cents, 0),
        'tax_cents', order_tax,
        'total_cents', order_total
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for performance on the new status value
CREATE INDEX IF NOT EXISTS idx_orders_status_in_progress ON orders(status) WHERE status = 'in_progress';

-- Step 12: Recreate the garments_with_clients view
CREATE VIEW garments_with_clients AS
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
    o.status AS order_status,
    c.id AS client_id,
    c.first_name AS client_first_name,
    c.last_name AS client_last_name,
    CASE
        WHEN (c.id IS NOT NULL) THEN ((c.first_name || ' '::text) || c.last_name)
        ELSE NULL::text
    END AS client_full_name
FROM garments g
LEFT JOIN orders o ON g.order_id = o.id
LEFT JOIN clients c ON o.client_id = c.id;