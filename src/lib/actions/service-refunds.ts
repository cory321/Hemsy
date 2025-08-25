'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { revalidatePath } from 'next/cache';

// DEPRECATED: Service-level refunds are no longer supported
// Refunds are now handled at the invoice/payment level

// Schema for service refund (kept for backward compatibility)
const RefundServiceSchema = z.object({
  serviceId: z.string().uuid(),
  refundAmount: z.number().int().positive(),
  refundReason: z.string().min(1),
  refundType: z.enum(['full', 'partial', 'credit']),
});

// DEPRECATED: Use invoice-level refund functionality instead
export async function refundServiceByPaymentMethod(
  input: z.infer<typeof RefundServiceSchema>
) {
  return {
    success: false,
    error:
      'Service-level refunds are no longer supported. Please use invoice-level refund functionality.',
    deprecated: true,
    suggestion:
      "Navigate to the order's invoices and process refunds at the invoice level.",
  };
}

// Get refund history for a service (now redirects to invoice-level data)
export async function getServiceRefundHistory(serviceId: string) {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get service and its associated invoices
    const { data: service } = await supabase
      .from('garment_services')
      .select(
        `
				*,
				garments!inner(
					orders!inner(
						shop_id,
						invoices(
							id,
							invoice_number,
							status,
							payments(
								id,
								payment_method,
								amount_cents,
								refunded_amount_cents,
								status,
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

    if (!service) {
      return { success: false, error: 'Service not found' };
    }

    // Get refund information from invoice payments
    const invoices = service.garments.orders.invoices || [];
    const allPayments = invoices.flatMap((invoice) => invoice.payments || []);
    const refundedPayments = allPayments.filter(
      (p) => p.refunded_amount_cents && p.refunded_amount_cents > 0
    );

    return {
      success: true,
      refundHistory: refundedPayments.map((payment) => ({
        id: payment.id,
        amount_cents: payment.refunded_amount_cents,
        payment_method: payment.payment_method,
        created_at: payment.created_at,
        // Note: This is now payment-level, not service-level
        type: 'payment_refund',
      })),
      message: 'Refund history is now tracked at payment/invoice level',
    };
  } catch (error) {
    console.error('Error getting service refund history:', error);
    return { success: false, error: 'Failed to get refund history' };
  }
}

// Get refundable amounts for a service (now based on order/invoice payments)
export async function getServiceRefundableAmounts(serviceId: string) {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get service and order payment information
    const { data: service } = await supabase
      .from('garment_services')
      .select(
        `
				*,
				garments!inner(
					orders!inner(
						shop_id,
						payment_status,
						paid_amount_cents,
						total_cents,
						invoices(
							id,
							status,
							amount_cents,
							payments(
								payment_method,
								amount_cents,
								refunded_amount_cents,
								status
							)
						)
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
    const invoices = order.invoices || [];

    // Calculate refundable amounts from completed payments
    const refundableByMethod = invoices.reduce(
      (acc, invoice) => {
        invoice.payments?.forEach((payment) => {
          if (payment.status === 'completed') {
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
          }
        });
        return acc;
      },
      {} as Record<string, any>
    );

    return {
      success: true,
      refundableAmounts: refundableByMethod,
      orderPaymentStatus: order.payment_status,
      message:
        'Refunds should be processed at invoice level, not service level',
      suggestion:
        'Use invoice refund functionality for better tracking and compliance',
    };
  } catch (error) {
    console.error('Error getting refundable amounts:', error);
    return { success: false, error: 'Failed to get refundable amounts' };
  }
}

// DEPRECATED: Service refund processing
export async function processServiceRefund(input: any) {
  return {
    success: false,
    error: 'Service-level refund processing is deprecated',
    message: 'Please use invoice-level refund functionality instead',
    deprecated: true,
  };
}
