'use server';

import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import {
  calculatePaymentStatus,
  type PaymentInfo,
} from './payment-calculations';
import { getInvoicePaymentHistory } from '@/lib/actions/payments';

export interface OrderBalanceResult {
  success: boolean;
  error?: string;
  orderTotal?: number; // active total (excluding removed services)
  paidAmount?: number; // net paid amount (payments - refunds)
  balanceDue?: number; // amount still owed
  paymentStatus?: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  percentage?: number; // percentage paid
  orderNumber?: string;
  clientName?: string;
  invoiceId?: string | undefined; // optional, for payment collection
  clientEmail?: string | undefined; // optional, for payment collection
}

/**
 * Calculate the complete balance status for an order
 * This is the single source of truth for order balance calculations
 * Used by both the orders page and balance confirmation dialogs
 */
export async function calculateOrderBalance(
  orderId: string
): Promise<OrderBalanceResult> {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get order basic info
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        `
        id,
        order_number,
        shop_id,
        clients(
          first_name,
          last_name,
          email
        )
      `
      )
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return {
        success: false,
        error: 'Order not found',
        orderTotal: 0,
        paidAmount: 0,
        balanceDue: 0,
        paymentStatus: 'unpaid',
        percentage: 0,
        orderNumber: '',
        clientName: '',
      };
    }

    // Verify shop ownership
    if (order.shop_id !== shop.id) {
      return {
        success: false,
        error: 'Access denied',
        orderTotal: 0,
        paidAmount: 0,
        balanceDue: 0,
        paymentStatus: 'unpaid',
        percentage: 0,
        orderNumber: '',
        clientName: '',
      };
    }

    // Get garment services (active total calculation)
    const { data: services, error: servicesError } = await supabase
      .from('garment_services')
      .select(
        `
        id,
        quantity,
        unit_price_cents,
        line_total_cents,
        is_removed,
        garments!inner(
          order_id
        )
      `
      )
      .eq('garments.order_id', orderId)
      .order('created_at', { ascending: true });

    if (servicesError) {
      console.error('Error fetching garment services:', servicesError);
      return {
        success: false,
        error: 'Failed to fetch order services',
        orderTotal: 0,
        paidAmount: 0,
        balanceDue: 0,
        paymentStatus: 'unpaid',
        percentage: 0,
        orderNumber: '',
        clientName: '',
      };
    }

    // Calculate active total (excluding removed services)
    const orderTotal = (services || [])
      .filter((service) => !service.is_removed)
      .reduce((sum, service) => {
        const lineTotal =
          service.line_total_cents ||
          service.quantity * service.unit_price_cents;
        return sum + lineTotal;
      }, 0);

    // Get invoice and payment history
    let paymentHistory: PaymentInfo[] = [];
    let invoiceId: string | undefined;

    const { data: invoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('order_id', orderId)
      .single();

    if (invoice) {
      invoiceId = invoice.id;
      try {
        const rawPaymentHistory = await getInvoicePaymentHistory(invoice.id);
        // Ensure refunded_amount_cents is never null by defaulting to 0
        paymentHistory = rawPaymentHistory.map((payment) => ({
          ...payment,
          refunded_amount_cents: (payment as any).refunded_amount_cents || 0,
        }));
      } catch (error) {
        console.error('Error fetching payment history:', error);
        // Continue with empty payment history if there's an error
      }
    }

    // Calculate payment status using shared utility
    const paymentCalc = calculatePaymentStatus(orderTotal, paymentHistory);

    const clientName = order.clients
      ? `${order.clients.first_name} ${order.clients.last_name}`
      : 'Unknown Client';

    return {
      success: true,
      orderTotal,
      paidAmount: paymentCalc.netPaid,
      balanceDue: paymentCalc.amountDue,
      paymentStatus: paymentCalc.paymentStatus,
      percentage: paymentCalc.percentage,
      orderNumber: order.order_number,
      clientName,
      invoiceId: invoiceId || undefined,
      clientEmail: order.clients?.email || undefined,
    };
  } catch (error) {
    console.error('Error in calculateOrderBalance:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unexpected error occurred',
      orderTotal: 0,
      paidAmount: 0,
      balanceDue: 0,
      paymentStatus: 'unpaid',
      percentage: 0,
      orderNumber: '',
      clientName: '',
    };
  }
}
