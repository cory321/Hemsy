'use server';

import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from './users';

export interface PaymentAuditLog {
  payment_id: string;
  action: 'created' | 'confirmed' | 'cancelled' | 'failed' | 'completed';
  details: Record<string, any>;
  user_agent?: string;
  ip_address?: string;
  timestamp: string;
}

/**
 * Log payment actions for audit trail
 */
export async function logPaymentAction(
  paymentId: string,
  action: PaymentAuditLog['action'],
  details: Record<string, any>,
  request?: Request
) {
  try {
    const { user } = await ensureUserAndShop();
    const supabase = await createClient();

    // Extract request metadata if available
    const userAgent = request?.headers.get('user-agent') || undefined;
    const forwardedFor = request?.headers.get('x-forwarded-for');
    const realIp = request?.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || undefined;

    const auditLog: PaymentAuditLog = {
      payment_id: paymentId,
      action,
      details: {
        ...details,
        user_id: user.id,
        timestamp: new Date().toISOString(),
      },
      user_agent: userAgent || '',
      ip_address: ipAddress || '',
      timestamp: new Date().toISOString(),
    };

    // Store in audit log table
    const { error } = await supabase
      .from('payment_audit_logs')
      .insert(auditLog);

    if (error) {
      console.error('Failed to log payment action:', error);
    }
  } catch (error) {
    console.error('Error in payment audit logging:', error);
  }
}

/**
 * Enhanced payment confirmation with audit logging
 */
export async function confirmPaymentWithAudit(
  paymentIntentId: string,
  metadata: Record<string, any> = {},
  request?: Request
) {
  const supabase = await createClient();

  // Find payment record
  const { data: payment } = await supabase
    .from('payments')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (payment) {
    await logPaymentAction(
      payment.id,
      'confirmed',
      {
        payment_intent_id: paymentIntentId,
        ...metadata,
      },
      request
    );
  }
}

/**
 * Get payment audit trail for an invoice
 */
export async function getPaymentAuditTrail(invoiceId: string) {
  const { shop } = await ensureUserAndShop();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('payment_audit_logs')
    .select(
      `
      *,
      payment:payments!inner(
        invoice_id,
        invoice:invoices!inner(shop_id)
      )
    `
    )
    .eq('payment.invoice.shop_id', shop.id)
    .eq('payment.invoice_id', invoiceId)
    .order('timestamp', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch audit trail');
  }

  return data || [];
}
