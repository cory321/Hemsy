-- Fix create_order_with_payment_transaction function to use 'new' instead of 'pending'

CREATE OR REPLACE FUNCTION create_order_with_payment_transaction(
  p_shop_id UUID,
  p_order_data JSONB,
  p_payment_intent JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_invoice_id UUID;
  v_total_cents INTEGER := 0;
  v_subtotal_cents INTEGER := 0;
  v_tax_cents INTEGER;
  v_garment JSONB;
  v_garment_id UUID;
  v_service JSONB;
  v_line_items JSONB := '[]'::JSONB;
  v_order_number TEXT;
  v_invoice_result invoices;
BEGIN
  -- Generate order number
  SELECT generate_order_number(p_shop_id) INTO v_order_number;

  -- Create order with 'new' status instead of 'pending'
  INSERT INTO orders (
    shop_id, 
    client_id, 
    order_number,
    status,
    subtotal_cents,
    discount_cents,
    tax_cents,
    total_cents
  ) VALUES (
    p_shop_id,
    (p_order_data->>'clientId')::UUID,
    v_order_number,
    'new'::order_status,  -- Changed from 'pending' to 'new'
    0, -- Will update after calculating
    (p_order_data->>'discountCents')::INTEGER,
    0, -- Will update after calculating
    0  -- Will update after calculating
  ) RETURNING id INTO v_order_id;

  -- Create garments and services
  FOR v_garment IN SELECT * FROM jsonb_array_elements(p_order_data->'garments')
  LOOP
    INSERT INTO garments (
      shop_id,
      order_id,
      name,
      notes,
      event_date,
      due_date,
      stage,
      -- Add preset icon fields
      preset_icon_key,
      preset_fill_color,
      -- Add Cloudinary image fields
      image_cloud_id,
      photo_url
    ) VALUES (
      p_shop_id,
      v_order_id,
      v_garment->>'name',
      v_garment->>'notes',
      (v_garment->>'eventDate')::DATE,
      (v_garment->>'dueDate')::DATE,
      'New',
      -- Add preset icon values
      v_garment->>'presetIconKey',
      v_garment->>'presetFillColor',
      -- Add Cloudinary image values
      v_garment->>'imageCloudId',
      v_garment->>'imageUrl'
    ) RETURNING id INTO v_garment_id;

    -- Insert services for this garment
    FOR v_service IN SELECT * FROM jsonb_array_elements(v_garment->'services')
    LOOP
      INSERT INTO garment_services (
        garment_id,
        service_id,
        name,
        description,
        quantity,
        unit,
        unit_price_cents
      ) VALUES (
        v_garment_id,
        (v_service->>'serviceId')::UUID,
        v_service->>'name',
        v_service->>'description',
        (v_service->>'quantity')::INTEGER,
        v_service->>'unit',
        (v_service->>'unitPriceCents')::INTEGER
      );

      -- Add to subtotal
      v_subtotal_cents := v_subtotal_cents + 
        ((v_service->>'quantity')::INTEGER * (v_service->>'unitPriceCents')::INTEGER);

      -- Build line item for invoice
      v_line_items := v_line_items || jsonb_build_object(
        'service_id', (SELECT id FROM garment_services WHERE garment_id = v_garment_id ORDER BY created_at DESC LIMIT 1),
        'name', v_service->>'name',
        'quantity', (v_service->>'quantity')::INTEGER,
        'unit_price_cents', (v_service->>'unitPriceCents')::INTEGER,
        'line_total_cents', ((v_service->>'quantity')::INTEGER * (v_service->>'unitPriceCents')::INTEGER)
      );
    END LOOP;
  END LOOP;

  -- Calculate totals
  v_subtotal_cents := v_subtotal_cents - (p_order_data->>'discountCents')::INTEGER;
  v_tax_cents := (v_subtotal_cents * (p_order_data->>'taxPercent')::NUMERIC / 100)::INTEGER;
  v_total_cents := v_subtotal_cents + v_tax_cents;

  -- Update order with calculated totals
  UPDATE orders
  SET 
    subtotal_cents = v_subtotal_cents,
    tax_cents = v_tax_cents,
    total_cents = v_total_cents
  WHERE id = v_order_id;

  -- Create invoice if payment intent exists
  IF p_payment_intent IS NOT NULL THEN
    -- Create invoice using existing function with CORRECT parameter order
    SELECT * INTO v_invoice_result FROM create_invoice_with_number(
      p_shop_id, -- p_shop_id (1st parameter)
      v_order_id, -- p_order_id (2nd parameter)
      (p_order_data->>'clientId')::UUID, -- p_client_id (3rd parameter)
      v_total_cents, -- p_amount_cents (4th parameter)
      (p_payment_intent->>'depositAmount')::INTEGER, -- p_deposit_amount_cents (5th parameter)
      v_line_items, -- p_line_items (6th parameter)
      p_payment_intent->>'notes' -- p_description (7th parameter)
    );
    v_invoice_id := v_invoice_result.id;

    -- Link services to invoice
    UPDATE garment_services gs
    SET invoice_id = v_invoice_id
    FROM garments g
    WHERE gs.garment_id = g.id
    AND g.order_id = v_order_id;
  END IF;

  -- Return order and invoice data
  RETURN jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'invoice', CASE 
      WHEN v_invoice_id IS NOT NULL THEN (
        SELECT row_to_json(i) FROM invoices i WHERE i.id = v_invoice_id
      )
      ELSE NULL
    END
  );
END;
$$;
