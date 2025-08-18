'use server';

import { z } from 'zod';
import Stripe from 'stripe';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from './users';
import { revalidatePath } from 'next/cache';
import {
  sendInvoiceReceiptEmail,
  sendDepositReceiptEmail,
} from './emails/invoice-emails';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

// Types
export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  amountCents: number;
  currency: string;
}

// Validation schemas
const CreatePaymentIntentSchema = z.object({
  invoiceId: z.string().uuid(),
  paymentType: z.enum(['deposit', 'remainder', 'full']),
  amountCents: z.number().int().positive().optional(), // Optional, will calculate from invoice if not provided
  returnUrl: z.string().url().optional(),
});

const ConfirmPaymentSchema = z.object({
  paymentIntentId: z.string(),
  paymentMethodId: z.string(),
});

/**
 * Create a Stripe PaymentIntent for an invoice payment
 */
export async function createPaymentIntent(
  params: z.infer<typeof CreatePaymentIntentSchema>
): Promise<{
  success: boolean;
  data?: PaymentIntentResult;
  error?: string;
}> {
  try {
    const { shop } = await ensureUserAndShop();
    const validated = CreatePaymentIntentSchema.parse(params);
    const supabase = await createSupabaseClient();

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(
        `
        *,
        client:clients(*),
        payments(*)
      `
      )
      .eq('id', validated.invoiceId)
      .eq('shop_id', shop.id)
      .single();

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === 'paid') {
      throw new Error('Invoice is already paid');
    }

    if (invoice.status === 'cancelled') {
      throw new Error('Cannot process payment for cancelled invoice');
    }

    // Calculate amount to charge
    let amountToCharge = 0;
    const totalPaid = invoice.payments
      .filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + p.amount_cents, 0);

    if (validated.amountCents) {
      // Use provided amount (for custom partial payments)
      amountToCharge = validated.amountCents;
    } else {
      // Calculate based on payment type
      switch (validated.paymentType) {
        case 'deposit':
          if (!invoice.deposit_amount_cents) {
            throw new Error('No deposit amount set for this invoice');
          }
          amountToCharge = invoice.deposit_amount_cents;
          break;
        case 'remainder':
          amountToCharge = invoice.amount_cents - totalPaid;
          break;
        case 'full':
          amountToCharge = invoice.amount_cents;
          break;
      }
    }

    if (amountToCharge <= 0) {
      throw new Error('Invalid payment amount');
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountToCharge,
      currency: 'usd',
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        shop_id: shop.id,
        payment_type: validated.paymentType,
        client_name: `${invoice.client.first_name} ${invoice.client.last_name}`,
        client_email: invoice.client.email,
      },
      description: `Payment for invoice ${invoice.invoice_number}`,
      automatic_payment_methods: {
        enabled: true,
      },
      receipt_email: invoice.client.email,
    });

    // Create pending payment record
    const { error: paymentError } = await supabase.from('payments').insert({
      invoice_id: invoice.id,
      payment_type: validated.paymentType,
      payment_method: 'stripe',
      amount_cents: amountToCharge,
      status: 'pending',
      stripe_payment_intent_id: paymentIntent.id,
      stripe_metadata: {
        client_secret: paymentIntent.client_secret,
        created_at: new Date().toISOString(),
      },
    });

    if (paymentError) {
      // Cancel the PaymentIntent if we can't record it
      await stripe.paymentIntents.cancel(paymentIntent.id);
      throw new Error('Failed to record payment intent');
    }

    return {
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
        amountCents: amountToCharge,
        currency: paymentIntent.currency,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(', '),
      };
    }
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to create payment intent',
    };
  }
}

/**
 * Handle successful payment from webhook
 */
export async function handleSuccessfulPayment(
  paymentIntentId: string,
  metadata?: Record<string, any>
) {
  const supabase = await createSupabaseClient();

  // Find the payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .select('*, invoice:invoices(*)')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .single();

  if (paymentError || !payment) {
    console.error('Payment record not found for intent:', paymentIntentId);
    throw new Error('Payment record not found');
  }

  // Update payment status
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'completed',
      processed_at: new Date().toISOString(),
      stripe_metadata: {
        ...((payment.stripe_metadata as object) || {}),
        completed_at: new Date().toISOString(),
        ...metadata,
      },
    })
    .eq('id', payment.id);

  if (updateError) {
    console.error('Error updating payment status:', updateError);
    throw new Error('Failed to update payment status');
  }

  // Calculate total paid for invoice
  const { data: allPayments } = await supabase
    .from('payments')
    .select('amount_cents')
    .eq('invoice_id', payment.invoice_id)
    .eq('status', 'completed');

  const totalPaid =
    allPayments?.reduce((sum, p) => sum + p.amount_cents, 0) || 0;

  // Update invoice status
  let newStatus = payment.invoice.status;
  if (totalPaid >= payment.invoice.amount_cents) {
    newStatus = 'paid';
  } else if (totalPaid > 0) {
    newStatus = 'partially_paid';
  }

  if (newStatus !== payment.invoice.status) {
    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.invoice_id);

    if (invoiceError) {
      console.error('Error updating invoice status:', invoiceError);
    }

    // Log status change
    await supabase.from('invoice_status_history').insert({
      invoice_id: payment.invoice_id,
      previous_status: payment.invoice.status,
      new_status: newStatus,
      changed_by: 'system',
      reason: `Payment of $${(payment.amount_cents / 100).toFixed(2)} processed via Stripe`,
      metadata: { payment_intent_id: paymentIntentId },
    });
  }

  // Update order if fully paid
  if (newStatus === 'paid' && payment.invoice.order_id) {
    await supabase
      .from('orders')
      .update({
        is_paid: true,
        paid_at: new Date().toISOString(),
        status: 'active', // Move from draft to active
      })
      .eq('id', payment.invoice.order_id);
  }

  // Send receipt email
  try {
    if (payment.payment_type === 'deposit' && newStatus !== 'paid') {
      // Send deposit receipt
      await sendDepositReceiptEmail(payment.invoice_id);
    } else if (newStatus === 'paid') {
      // Send full invoice receipt
      await sendInvoiceReceiptEmail(payment.invoice_id);
    }
  } catch (emailError) {
    console.error('Failed to send receipt email:', emailError);
    // Don't throw - payment was successful even if email failed
  }

  revalidatePath('/invoices');
  revalidatePath(`/invoices/${payment.invoice_id}`);
}

/**
 * Handle failed payment from webhook
 */
export async function handleFailedPayment(
  paymentIntentId: string,
  failureReason?: string,
  metadata?: Record<string, any>
) {
  const supabase = await createSupabaseClient();

  // Find and update the payment record
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'failed',
      stripe_metadata: {
        failed_at: new Date().toISOString(),
        failure_reason: failureReason,
        ...metadata,
      },
    })
    .eq('stripe_payment_intent_id', paymentIntentId);

  if (error) {
    console.error('Error updating failed payment:', error);
    throw new Error('Failed to update payment status');
  }

  revalidatePath('/invoices');
}

/**
 * Get payment history for an invoice
 */
export async function getInvoicePayments(invoiceId: string) {
  const { shop } = await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching payments:', error);
    throw new Error('Failed to fetch payment history');
  }

  // Verify the invoice belongs to the shop
  const { data: invoice } = await supabase
    .from('invoices')
    .select('shop_id')
    .eq('id', invoiceId)
    .single();

  if (!invoice || invoice.shop_id !== shop.id) {
    throw new Error('Invoice not found');
  }

  return data;
}

/**
 * Refund a payment
 */
export async function refundPayment(
  paymentId: string,
  amountCents?: number,
  reason?: string
) {
  try {
    const { shop, user } = await ensureUserAndShop();
    const supabase = await createSupabaseClient();

    // Get payment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*, invoice:invoices!inner(shop_id)')
      .eq('id', paymentId)
      .eq('invoice.shop_id', shop.id)
      .single();

    if (paymentError || !payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'completed') {
      throw new Error('Can only refund completed payments');
    }

    if (payment.payment_method !== 'stripe') {
      throw new Error('Can only refund Stripe payments through this interface');
    }

    if (!payment.stripe_payment_intent_id) {
      throw new Error('No Stripe payment intent found');
    }

    // Calculate refund amount
    const refundAmount = amountCents || payment.amount_cents;
    if (refundAmount > payment.amount_cents) {
      throw new Error('Refund amount cannot exceed payment amount');
    }

    // Create Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripe_payment_intent_id,
      amount: refundAmount,
      reason: 'requested_by_customer',
      metadata: {
        payment_id: payment.id,
        invoice_id: payment.invoice_id,
        refunded_by: user.id,
        reason: reason || 'Customer requested refund',
      },
    });

    // Update payment record
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status:
          refundAmount === payment.amount_cents
            ? 'refunded'
            : 'partially_refunded',
        stripe_metadata: {
          ...((payment.stripe_metadata as object) || {}),
          refund_id: refund.id,
          refunded_amount_cents: refundAmount,
          refunded_at: new Date().toISOString(),
          refund_reason: reason,
        },
      })
      .eq('id', paymentId);

    if (updateError) {
      throw new Error('Failed to update payment record');
    }

    // Update invoice status if needed
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, payments(*)')
      .eq('id', payment.invoice_id)
      .single();

    if (invoice) {
      const totalPaid =
        invoice.payments
          .filter((p: any) => p.status === 'completed' && p.id !== paymentId)
          .reduce((sum: number, p: any) => sum + p.amount_cents, 0) +
        (refundAmount === payment.amount_cents
          ? 0
          : payment.amount_cents - refundAmount);

      let newStatus = invoice.status;
      if (totalPaid === 0) {
        newStatus = 'pending';
      } else if (totalPaid < invoice.amount_cents) {
        newStatus = 'partially_paid';
      }

      if (newStatus !== invoice.status) {
        await supabase
          .from('invoices')
          .update({ status: newStatus })
          .eq('id', invoice.id);

        await supabase.from('invoice_status_history').insert({
          invoice_id: invoice.id,
          previous_status: invoice.status,
          new_status: newStatus,
          changed_by: user.id,
          reason: `Refund of $${(refundAmount / 100).toFixed(2)} processed`,
        });
      }
    }

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${payment.invoice_id}`);

    return { success: true, data: { refundId: refund.id } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to process refund',
    };
  }
}
