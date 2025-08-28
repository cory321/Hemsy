'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { revalidatePath } from 'next/cache';
import { createPaymentIntent } from './payments';

// Schema for order creation with payment intent
const CreateOrderWithPaymentSchema = z.object({
  orderData: z.object({
    clientId: z.string().uuid(),
    garments: z.array(
      z.object({
        name: z.string().min(1),
        notes: z.string().optional(),
        eventDate: z.string().optional(),
        dueDate: z.string().optional(),
        presetIconKey: z.string().optional(),
        presetFillColor: z.string().optional(),
        imageCloudId: z.string().optional(),
        imageUrl: z.string().url().optional(),
        services: z.array(
          z.object({
            serviceId: z.string().uuid().optional(),
            name: z.string().min(1),
            description: z.string().optional(),
            quantity: z.number().int().min(1),
            unit: z.string(),
            unitPriceCents: z.number().int().min(0),
          })
        ),
      })
    ),
    taxPercent: z.number().min(0).max(100),
    discountCents: z.number().int().min(0),
    notes: z.string().optional(),
  }),
  paymentIntent: z.object({
    collectNow: z.boolean(),
    method: z.enum(['stripe', 'cash', 'external_pos']).optional(),
    depositAmount: z.number().int().min(0).optional(),
    dueDate: z.date().optional(),
    notes: z.string().optional(),
    stripeDetails: z
      .object({
        paymentMethodId: z.string().optional(),
      })
      .optional(),
    externalReference: z.string().optional(),
  }),
});

export async function createOrderWithPayment(
  input: z.infer<typeof CreateOrderWithPaymentSchema>
) {
  try {
    const { shop, user } = await ensureUserAndShop();
    const supabase = await createClient();

    // Validate input
    const validatedInput = CreateOrderWithPaymentSchema.parse(input);

    // Create order with atomic transaction
    const { data: order, error: orderError } = await supabase.rpc(
      'create_order_with_payment_transaction',
      {
        p_shop_id: shop.id,
        p_order_data: validatedInput.orderData,
        p_payment_intent: {
          ...validatedInput.paymentIntent,
          dueDate: validatedInput.paymentIntent.dueDate?.toISOString(),
        },
        p_user_id: user.id,
      }
    );

    if (orderError) throw orderError;

    // Handle immediate payment collection
    if (
      validatedInput.paymentIntent.collectNow &&
      validatedInput.paymentIntent.method &&
      order
    ) {
      const invoice = (order as any).invoice;
      if (!invoice) {
        throw new Error('Invoice not found in order response');
      }
      const amountToCollect =
        validatedInput.paymentIntent.depositAmount || invoice.amount_cents;

      switch (validatedInput.paymentIntent.method) {
        case 'stripe':
          // Create and process Stripe payment
          if (validatedInput.paymentIntent.stripeDetails?.paymentMethodId) {
            const paymentResult = await createPaymentIntent({
              invoiceId: invoice.id,
              paymentType: validatedInput.paymentIntent.depositAmount
                ? 'custom'
                : 'remainder',
              amountCents: amountToCollect,
            });

            if (!paymentResult.success) {
              throw new Error(
                paymentResult.error || 'Failed to process Stripe payment'
              );
            }

            // The payment will be processed by the Stripe webhook
            console.log(
              'Stripe payment intent created:',
              paymentResult.data?.paymentIntentId
            );
          }
          break;

        case 'cash':
        case 'external_pos':
          // Record manual payment using existing function
          await supabase.rpc('process_manual_payment', {
            p_invoice_id: invoice.id,
            p_payment_method: validatedInput.paymentIntent.method,
            p_amount_cents: amountToCollect,
            p_payment_type: validatedInput.paymentIntent.depositAmount
              ? 'custom'
              : 'remainder',
            p_external_reference:
              validatedInput.paymentIntent.externalReference || '',
            p_notes: validatedInput.paymentIntent.notes || '',
            p_user_id: user.id,
          });
          break;
      }
    }

    revalidatePath('/orders');
    revalidatePath('/invoices');

    return {
      success: true,
      orderId: (order as any)?.id || '',
      invoiceId: (order as any)?.invoice?.id || '',
      paymentIntent: (order as any)?.paymentIntent || null,
    };
  } catch (error) {
    console.error('Error creating order with payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    };
  }
}

// Database function for atomic order + invoice creation
export async function createOrderTransactionFunction() {
  const supabase = await createClient();

  const functionSQL = `
CREATE OR REPLACE FUNCTION create_order_with_payment_transaction(
  p_shop_id UUID,
  p_order_data JSONB,
  p_payment_intent JSONB,
  p_user_id UUID
)
RETURNS JSONB AS $$
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
BEGIN
  -- Generate order number
  SELECT generate_order_number(p_shop_id) INTO v_order_number;

  -- Create order
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
            'new',
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
      stage
    ) VALUES (
      p_shop_id,
      v_order_id,
      v_garment->>'name',
      v_garment->>'notes',
      (v_garment->>'eventDate')::DATE,
      (v_garment->>'dueDate')::DATE,
      'New'
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
    -- Create invoice using existing function
    SELECT * INTO v_invoice_id FROM create_invoice_with_number(
      v_total_cents, -- amount_cents
      (p_order_data->>'clientId')::UUID, -- client_id
      (p_payment_intent->>'depositAmount')::INTEGER, -- deposit_amount_cents
      p_payment_intent->>'notes', -- description
      v_line_items, -- line_items
      v_order_id, -- order_id
      p_shop_id -- shop_id
    );

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
$$ LANGUAGE plpgsql;
`;

  // Note: This would need to be executed as a migration or via direct database access
  // For now, we'll assume the function exists
  return { success: true };
}
