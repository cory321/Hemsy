'use server';

import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from './users';

/**
 * Payment discrepancy information
 */
export interface PaymentDiscrepancy {
  payment_id: string;
  invoice_id: string;
  payment_method: string;
  discrepancy_amount: number;
  consistency_status:
    | 'PAYMENT_TABLE_HIGHER'
    | 'REFUNDS_TABLE_HIGHER'
    | 'UNKNOWN';
  details: string;
}

/**
 * Invoice payment summary information
 */
export interface InvoicePaymentSummary {
  invoice_id: string;
  order_id: string;
  invoice_status: string;
  invoice_total: number;
  payment_count: number;
  total_paid: number;
  total_refunded: number;
  net_paid: number;
  amount_due: number;
  last_payment_date: string | null;
  last_refund_date: string | null;
}

/**
 * Check for payment discrepancies in the shop
 * Returns any payments where refunded_amount_cents doesn't match the sum of refunds
 */
export async function checkPaymentDiscrepancies(): Promise<{
  success: boolean;
  data?: PaymentDiscrepancy[];
  error?: string;
}> {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    // Use the database function to check discrepancies
    const { data, error } = await supabase.rpc(
      'check_payment_discrepancies' as any,
      { p_shop_id: shop.id }
    );

    if (error) {
      console.error('Error checking payment discrepancies:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Unexpected error checking payment discrepancies:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to check payment discrepancies',
    };
  }
}

/**
 * Get payment reconciliation data for a specific invoice
 */
export async function getPaymentReconciliation(invoiceId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    // Verify invoice belongs to shop
    const { data: invoice } = await supabase
      .from('invoices')
      .select('shop_id')
      .eq('id', invoiceId)
      .single();

    if (!invoice || invoice.shop_id !== shop.id) {
      return { success: false, error: 'Invoice not found' };
    }

    // Get reconciliation data
    const { data, error } = await supabase
      .from('payment_reconciliation' as any)
      .select('*')
      .eq('invoice_id', invoiceId);

    if (error) {
      console.error('Error fetching payment reconciliation:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error fetching payment reconciliation:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch payment reconciliation',
    };
  }
}

/**
 * Get invoice payment summary using the optimized view
 */
export async function getInvoicePaymentSummary(invoiceId: string): Promise<{
  success: boolean;
  data?: InvoicePaymentSummary;
  error?: string;
}> {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get summary from the view
    const { data, error } = (await supabase
      .from('invoice_payment_summary' as any)
      .select('*')
      .eq('invoice_id', invoiceId)
      .single()) as { data: InvoicePaymentSummary | null; error: any };

    if (error) {
      console.error('Error fetching invoice payment summary:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'Invoice not found' };
    }

    // Verify it belongs to the shop (the view should handle this via RLS)
    const { data: invoice } = await supabase
      .from('invoices')
      .select('shop_id')
      .eq('id', invoiceId)
      .single();

    if (!invoice || invoice.shop_id !== shop.id) {
      return { success: false, error: 'Invoice not found' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Unexpected error fetching invoice payment summary:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch invoice payment summary',
    };
  }
}

/**
 * Get all payment discrepancies for the shop with pagination
 */
export async function getAllPaymentDiscrepancies(
  page = 1,
  pageSize = 20
): Promise<{
  success: boolean;
  data?: {
    discrepancies: PaymentDiscrepancy[];
    totalCount: number;
    page: number;
    pageSize: number;
  };
  error?: string;
}> {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    // Get total count of discrepancies
    const { count: totalCount, error: countError } = await supabase
      .from('payment_reconciliation' as any)
      .select('*', { count: 'exact', head: true })
      .neq('consistency_status', 'OK')
      .eq(
        'invoice_id',
        supabase.from('invoices').select('id').eq('shop_id', shop.id)
      );

    if (countError) {
      console.error('Error counting discrepancies:', countError);
      return { success: false, error: countError.message };
    }

    // Get paginated discrepancies
    const offset = (page - 1) * pageSize;
    const { data, error } = await supabase
      .rpc('check_payment_discrepancies' as any, { p_shop_id: shop.id })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error fetching discrepancies:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        discrepancies: data || [],
        totalCount: totalCount || 0,
        page,
        pageSize,
      },
    };
  } catch (error) {
    console.error('Unexpected error fetching all discrepancies:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch discrepancies',
    };
  }
}

/**
 * Get payment audit logs for a specific payment
 */
export async function getPaymentAuditLogs(paymentId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const { shop } = await ensureUserAndShop();
    const supabase = await createClient();

    // Verify payment belongs to shop
    const { data: payment } = await supabase
      .from('payments')
      .select('invoice:invoices!inner(shop_id)')
      .eq('id', paymentId)
      .single();

    if (!payment || payment.invoice.shop_id !== shop.id) {
      return { success: false, error: 'Payment not found' };
    }

    // Get audit logs with user information
    const { data, error } = await supabase
      .from('payment_audit_logs')
      .select(
        `
        *,
        user:users(id, email, first_name, last_name)
      `
      )
      .eq('payment_id', paymentId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching payment audit logs:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Unexpected error fetching payment audit logs:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to fetch audit logs',
    };
  }
}
