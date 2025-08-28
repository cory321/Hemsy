'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { revalidatePath } from 'next/cache';

// Get payment breakdown for a service - now based on invoice payments
export async function getServicePaymentBreakdown(serviceId: string) {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get service and its associated invoices
    const { data: service, error: serviceError } = await supabase
      .from('garment_services')
      .select(
        `
				*,
				garments!inner(
					orders!inner(
						invoices(
							id,
							status,
							amount_cents,
							payments(
								id,
								payment_method,
								status,
								amount_cents,
								refunded_amount_cents,
								stripe_payment_intent_id,
								external_reference,
								created_at
							)
						)
					)
				)
			`
      )
      .eq('id', serviceId)
      .eq('garments.orders.shop_id', shop.id)
      .single();

    if (serviceError) throw serviceError;

    // Calculate payment summary from invoice payments
    const invoices = service.garments.orders.invoices || [];
    const allPayments = invoices.flatMap((invoice) => invoice.payments || []);

    const completedPayments = allPayments.filter(
      (p) => p.status === 'completed'
    );
    const totalPaid = completedPayments.reduce(
      (sum, p) => sum + p.amount_cents,
      0
    );
    const totalRefunded = completedPayments.reduce(
      (sum, p) => sum + (p.refunded_amount_cents || 0),
      0
    );

    // Group by payment method
    const byMethod = completedPayments.reduce(
      (acc, payment) => {
        const method = payment.payment_method;
        if (!acc[method]) {
          acc[method] = {
            paid: 0,
            refunded: 0,
            available: 0,
          };
        }
        acc[method].paid += payment.amount_cents;
        acc[method].refunded += payment.refunded_amount_cents || 0;
        acc[method].available = acc[method].paid - acc[method].refunded;
        return acc;
      },
      {} as Record<string, any>
    );

    return {
      success: true,
      payments: completedPayments,
      summary: {
        totalPaid,
        totalRefunded,
        netPaid: totalPaid - totalRefunded,
        byMethod,
      },
    };
  } catch (error) {
    console.error('Error getting service payment breakdown:', error);
    return { success: false, error: 'Failed to get payment breakdown' };
  }
}

// Check if service can be modified - simplified without service-level locking
export async function checkServiceModificationPermission(serviceId: string) {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    const { data: service } = await supabase
      .from('garment_services')
      .select(
        `
				*,
				garments!inner(
					orders!inner(
						shop_id,
						payment_status,
						invoices(status)
					)
				)
			`
      )
      .eq('id', serviceId)
      .eq('garments.orders.shop_id', shop.id)
      .single();

    if (!service) {
      return { success: false, error: 'Service not found' };
    }

    const order = service.garments.orders;
    const hasPaidInvoices = order.invoices?.some(
      (inv) => inv.status === 'paid' || inv.status === 'partially_paid'
    );

    return {
      success: true,
      canModify: true, // Services can always be modified now
      isLocked: false, // No more service-level locking
      paymentStatus: order.payment_status,
      hasPaidInvoices,
      requiresApproval: hasPaidInvoices, // Only require approval if order has paid invoices
    };
  } catch (error) {
    return { success: false, error: 'Failed to check permissions' };
  }
}

// Update service with override option - simplified
const UpdateServiceWithOverrideSchema = z.object({
  serviceId: z.string().uuid(),
  updates: z.object({
    quantity: z.number().int().min(1).optional(),
    unitPriceCents: z.number().int().min(0).optional(),
    description: z.string().optional(),
  }),
  forceUpdate: z.boolean().default(false),
  updateReason: z.string().optional(),
});

export async function updateServiceWithOverride(
  input: z.infer<typeof UpdateServiceWithOverrideSchema>
) {
  try {
    const { shop, user } = await ensureUserAndShop();
    const supabase = await createClient();

    // Check permissions
    const permissionCheck = await checkServiceModificationPermission(
      input.serviceId
    );
    if (!permissionCheck.success) {
      return permissionCheck;
    }

    if (permissionCheck.hasPaidInvoices && !input.forceUpdate) {
      return {
        success: false,
        requiresConfirmation: true,
        message:
          'This order has paid invoices. Modifying services may require creating an adjustment invoice.',
        currentState: {
          paymentStatus: permissionCheck.paymentStatus,
        },
      };
    }

    // Get current service state
    const { data: currentService } = await supabase
      .from('garment_services')
      .select('*')
      .eq('id', input.serviceId)
      .single();

    if (!currentService) {
      return { success: false, error: 'Service not found' };
    }

    // Calculate if adjustment is needed
    const newTotalCents =
      (input.updates.quantity || currentService.quantity) *
      (input.updates.unitPriceCents || currentService.unit_price_cents);
    const oldTotalCents =
      currentService.quantity * currentService.unit_price_cents;
    const adjustmentNeeded =
      newTotalCents !== oldTotalCents && permissionCheck.hasPaidInvoices;

    // Update service
    const { error: updateError } = await supabase
      .from('garment_services')
      .update({
        quantity: input.updates.quantity || currentService.quantity,
        unit_price_cents:
          input.updates.unitPriceCents || currentService.unit_price_cents,
        description:
          input.updates.description !== undefined
            ? input.updates.description
            : currentService.description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.serviceId);

    if (updateError) throw updateError;

    // Log modification if it was forced on a paid order
    if (input.forceUpdate && permissionCheck.hasPaidInvoices) {
      await supabase.from('garment_history').insert({
        garment_id: currentService.garment_id,
        changed_by: user.id,
        field_name: 'service_modified_after_payment',
        old_value: {
          quantity: currentService.quantity,
          unit_price_cents: currentService.unit_price_cents,
          total: oldTotalCents,
        },
        new_value: {
          quantity: input.updates.quantity || currentService.quantity,
          unit_price_cents:
            input.updates.unitPriceCents || currentService.unit_price_cents,
          total: newTotalCents,
        },
        change_type: 'paid_order_service_modified',
        change_reason: input.updateReason || 'Manual override',
      });
    }

    // Create adjustment invoice if needed
    if (adjustmentNeeded && newTotalCents > oldTotalCents) {
      const { data: garment } = await supabase
        .from('garments')
        .select('order_id')
        .eq('id', currentService.garment_id)
        .single();

      if (garment) {
        return {
          success: true,
          adjustmentNeeded: true,
          adjustmentAmount: newTotalCents - oldTotalCents,
          orderId: garment.order_id,
          serviceId: input.serviceId,
        };
      }
    }

    revalidatePath(`/garments/${currentService.garment_id}`);

    return { success: true, adjustmentNeeded: false };
  } catch (error) {
    console.error('Error updating service:', error);
    return { success: false, error: 'Failed to update service' };
  }
}

// Get services with payment info for a garment - simplified to use order/invoice status
export async function getGarmentServicesWithPaymentInfo(garmentId: string) {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    const { data: services, error } = await supabase
      .from('garment_services')
      .select(
        `
				*,
				garments!inner(
					orders!inner(
						payment_status,
						paid_amount_cents,
						total_cents,
						invoices(
							id,
							status,
							amount_cents
						)
					)
				)
			`
      )
      .eq('garment_id', garmentId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Transform data to include payment summary based on order status
    const servicesWithPaymentInfo = services?.map((service) => {
      const order = service.garments.orders;
      const hasPaidInvoices = order.invoices?.some(
        (inv) => inv.status === 'paid' || inv.status === 'partially_paid'
      );

      return {
        ...service,
        // Remove service-level payment fields
        is_locked: false,
        paid_amount_cents: 0,
        refunded_amount_cents: 0,
        paymentSummary: {
          // Payment info now comes from order level
          orderPaid: order.paid_amount_cents || 0,
          orderTotal: order.total_cents || 0,
          orderPaymentStatus: order.payment_status,
          hasPaidInvoices,
          isPaid: order.payment_status === 'paid',
          isPartiallyPaid: order.payment_status === 'partially_paid',
          paymentMethods: [], // Would need to query payments if needed
        },
      };
    });

    return { success: true, services: servicesWithPaymentInfo || [] };
  } catch (error) {
    console.error('Error getting garment services:', error);
    return { success: false, error: 'Failed to get services' };
  }
}
