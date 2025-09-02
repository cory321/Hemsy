'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { revalidatePath } from 'next/cache';
import {
  formatDateForDisplay,
  getCurrentDateString,
} from '@/lib/utils/date-time-utils';

// Enhanced schema for adding services with payment awareness
const AddServiceToGarmentEnhancedSchema = z.object({
  garmentId: z.string().uuid(),
  serviceId: z.string().uuid().optional(),
  customService: z
    .object({
      name: z.string().min(1),
      description: z.string().optional(),
      unit: z.string(),
      unitPriceCents: z.number().int().min(0),
      quantity: z.number().int().min(1),
    })
    .optional(),
  autoCreateInvoice: z.boolean().default(false),
  invoiceNotes: z.string().optional(),
});

export async function addServiceToGarmentWithPaymentCheck(
  input: z.infer<typeof AddServiceToGarmentEnhancedSchema>
) {
  try {
    const { shop, user } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get garment with order info
    const { data: garment, error: garmentError } = await supabase
      .from('garments')
      .select(
        `
        *,
        orders!inner(
          id,
          shop_id,
          client_id
        ),
        garment_services(
          id,
          payment_status,
          paid_amount_cents
        )
      `
      )
      .eq('id', input.garmentId)
      .single();

    if (garmentError || !garment || garment.orders.shop_id !== shop.id) {
      throw new Error('Garment not found');
    }

    // Check if garment has any paid services
    const hasPaidServices = garment.garment_services.some(
      (s: any) => s.paid_amount_cents > 0
    );

    // Get service data
    const serviceData = input.serviceId
      ? await getServiceDataFromCatalog(input.serviceId, shop.id)
      : {
          name: input.customService!.name,
          description: input.customService!.description,
          unit: input.customService!.unit,
          unit_price_cents: input.customService!.unitPriceCents,
          quantity: input.customService!.quantity,
        };

    // Insert the new service
    const { data: newService, error: insertError } = await supabase
      .from('garment_services')
      .insert({
        garment_id: input.garmentId,
        service_id: input.serviceId || null,
        name: serviceData.name,
        description: serviceData.description || null,
        unit: serviceData.unit,
        unit_price_cents: serviceData.unit_price_cents,
        quantity: serviceData.quantity,
        is_done: false,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Log to history
    await supabase.from('garment_history').insert({
      garment_id: input.garmentId,
      changed_by: user.id,
      field_name: 'services',
      new_value: {
        name: serviceData.name,
        quantity: serviceData.quantity,
        unit_price_cents: serviceData.unit_price_cents,
      },
      change_type: 'service_added',
      related_service_id: newService.id,
    });

    // Check for invoice creation needs
    let invoiceAction = null;

    if (hasPaidServices) {
      // Check for existing unpaid invoice
      const { data: unpaidInvoice } = await supabase
        .from('invoices')
        .select('id, invoice_number')
        .eq('order_id', garment.order_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (unpaidInvoice) {
        // Update existing unpaid invoice
        await addServiceToExistingInvoice(unpaidInvoice.id, newService);
        invoiceAction = {
          type: 'added_to_existing',
          invoiceId: unpaidInvoice.id,
          invoiceNumber: unpaidInvoice.invoice_number,
        };
      } else if (input.autoCreateInvoice) {
        // Create new supplemental invoice
        const invoiceResult = await createSupplementalInvoice({
          orderId: garment.order_id,
          serviceIds: [newService.id],
          invoiceType: 'additional',
          notes:
            input.invoiceNotes ||
            `Additional services added to ${garment.name} on ${formatDateForDisplay(getCurrentDateString())}`,
        });

        if (invoiceResult.success && invoiceResult.invoice) {
          invoiceAction = {
            type: 'created_new',
            invoiceId: invoiceResult.invoice.id,
            invoiceNumber: invoiceResult.invoice.invoice_number,
          };
        }
      } else {
        // Flag that invoice creation is recommended
        invoiceAction = {
          type: 'recommended',
          message:
            'This garment has paid services. Consider creating an invoice for the new service.',
          serviceId: newService.id,
        };
      }
    }

    // Recalculate garment stage
    await recalculateAndUpdateGarmentStage(input.garmentId);

    revalidatePath(`/garments/${input.garmentId}`);

    return {
      success: true,
      service: newService,
      invoiceAction,
      requiresPayment: hasPaidServices,
    };
  } catch (error) {
    console.error('Error adding service:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add service',
    };
  }
}

// Helper function to get service data from catalog
async function getServiceDataFromCatalog(serviceId: string, shopId: string) {
  const supabase = await createClient();

  const { data: service, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .eq('shop_id', shopId)
    .single();

  if (error || !service) {
    throw new Error('Service not found in catalog');
  }

  return {
    name: service.name,
    description: service.description,
    unit: service.default_unit,
    unit_price_cents: service.default_unit_price_cents,
    quantity: service.default_qty,
  };
}

// Helper function to add service to existing invoice
async function addServiceToExistingInvoice(invoiceId: string, service: any) {
  const supabase = await createClient();

  // Get current invoice
  const { data: invoice } = await supabase
    .from('invoices')
    .select('line_items, amount_cents')
    .eq('id', invoiceId)
    .single();

  if (!invoice) throw new Error('Invoice not found');

  // Add new line item
  const newLineItem = {
    service_id: service.id,
    name: service.name,
    quantity: service.quantity,
    unit_price_cents: service.unit_price_cents,
    line_total_cents: service.quantity * service.unit_price_cents,
  };

  const updatedLineItems = [...(invoice.line_items as any[]), newLineItem];
  const newTotal = invoice.amount_cents + newLineItem.line_total_cents;

  // Update invoice
  await supabase
    .from('invoices')
    .update({
      line_items: updatedLineItems,
      amount_cents: newTotal,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoiceId);

  // Link service to invoice
  await supabase
    .from('garment_services')
    .update({ invoice_id: invoiceId })
    .eq('id', service.id);
}

// Create supplemental invoice
async function createSupplementalInvoice(params: {
  orderId: string;
  serviceIds: string[];
  invoiceType: 'additional' | 'adjustment';
  notes?: string;
  dueDate?: Date;
}) {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get unpaid services
    const { data: services, error: servicesError } = await supabase
      .from('garment_services')
      .select(
        `
        *,
        garments!inner(
          order_id,
          orders!inner(client_id)
        )
      `
      )
      .in('id', params.serviceIds)
      .eq('payment_status', 'unpaid');

    if (servicesError || !services.length) {
      throw new Error('No unpaid services found');
    }

    // Build line items
    const lineItems = services.map((service) => ({
      service_id: service.id,
      name: service.name,
      quantity: service.quantity,
      unit_price_cents: service.unit_price_cents,
      line_total_cents: service.quantity * service.unit_price_cents,
    }));

    const totalAmount = lineItems.reduce(
      (sum, item) => sum + item.line_total_cents,
      0
    );

    // Create invoice using existing function
    const { data: invoice, error: invoiceError } = await supabase.rpc(
      'create_invoice_with_number',
      {
        p_shop_id: shop.id,
        p_order_id: params.orderId,
        p_client_id: services[0]?.garments?.orders?.client_id || '',
        p_amount_cents: totalAmount,
        p_description: params.notes || `Additional services for order`,
        p_line_items: lineItems,
      }
    );

    if (invoiceError) throw invoiceError;

    // Update invoice type
    await supabase
      .from('invoices')
      .update({
        invoice_type: params.invoiceType,
        due_date: params.dueDate?.toISOString() || null,
      })
      .eq('id', invoice.id);

    // Link services to invoice
    await supabase
      .from('garment_services')
      .update({ invoice_id: invoice.id })
      .in('id', params.serviceIds);

    revalidatePath('/invoices');
    revalidatePath(`/orders/${params.orderId}`);

    return { success: true, invoice };
  } catch (error) {
    console.error('Error creating supplemental invoice:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create invoice',
    };
  }
}

// Recalculate garment stage (placeholder - implement based on existing logic)
async function recalculateAndUpdateGarmentStage(garmentId: string) {
  const supabase = await createClient();

  // Get service completion status
  const { data: services } = await supabase
    .from('garment_services')
    .select('is_done')
    .eq('garment_id', garmentId);

  if (!services) return;

  const totalServices = services.length;
  const completedServices = services.filter((s) => s.is_done).length;

  let newStage: 'New' | 'In Progress' | 'Ready For Pickup' | 'Done';
  if (completedServices === 0) {
    newStage = 'New';
  } else if (completedServices === totalServices) {
    newStage = 'Ready For Pickup';
  } else {
    newStage = 'In Progress';
  }

  // Update garment stage
  await supabase
    .from('garments')
    .update({ stage: newStage })
    .eq('id', garmentId);
}
