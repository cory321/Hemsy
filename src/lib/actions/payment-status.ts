'use server';

import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

export interface PaymentStatusResult {
  canCreateNewPayment: boolean;
  reason?: string;
  existingPaymentIntent?: string;
  suggestedAction: 'wait' | 'retry' | 'proceed' | 'contact_support';
  message: string;
}

/**
 * Check if a new payment can be created for an invoice
 */
export async function checkPaymentStatus(
  invoiceId: string
): Promise<PaymentStatusResult> {
  const supabase = await createClient();

  // Get invoice with payments
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(
      `
      *,
      payments(*)
    `
    )
    .eq('id', invoiceId)
    .single();

  if (error || !invoice) {
    return {
      canCreateNewPayment: false,
      reason: 'Invoice not found',
      suggestedAction: 'contact_support',
      message: 'Invoice not found. Please contact support.',
    };
  }

  // Check if already paid
  if (invoice.status === 'paid') {
    return {
      canCreateNewPayment: false,
      reason: 'Already paid',
      suggestedAction: 'proceed',
      message: 'This invoice has already been paid.',
    };
  }

  // Check for pending Stripe payments
  const pendingStripePayments = invoice.payments.filter(
    (p: any) => p.payment_method === 'stripe' && p.status === 'pending'
  );

  if (pendingStripePayments.length > 0) {
    const recentPending = pendingStripePayments.find((p: any) => {
      const paymentAge = Date.now() - new Date(p.created_at).getTime();
      return paymentAge < 15 * 60 * 1000; // 15 minutes
    });

    if (recentPending) {
      // Check the actual status on Stripe
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          recentPending.stripe_payment_intent_id!
        );

        switch (paymentIntent.status) {
          case 'succeeded':
            return {
              canCreateNewPayment: false,
              reason: 'Payment succeeded but not yet processed',
              suggestedAction: 'wait',
              message:
                'Your payment was successful and is being processed. Please wait a moment for confirmation.',
              existingPaymentIntent: paymentIntent.id,
            };

          case 'processing':
            return {
              canCreateNewPayment: false,
              reason: 'Payment is processing',
              suggestedAction: 'wait',
              message:
                'Your payment is currently being processed. Please wait a moment.',
              existingPaymentIntent: paymentIntent.id,
            };

          case 'requires_payment_method':
          case 'requires_confirmation':
            return {
              canCreateNewPayment: false,
              reason: 'Payment in progress',
              suggestedAction: 'retry',
              message:
                'A payment is already in progress. Please complete or cancel it before starting a new one.',
              existingPaymentIntent: paymentIntent.id,
            };

          case 'canceled':
          case 'requires_action':
            // These can be considered for retry
            return {
              canCreateNewPayment: true,
              suggestedAction: 'proceed',
              message:
                'Previous payment attempt was not completed. You can try again.',
            };

          default:
            return {
              canCreateNewPayment: false,
              reason: `Payment status: ${paymentIntent.status}`,
              suggestedAction: 'wait',
              message:
                'A payment is currently being processed. Please wait or contact support if this persists.',
              existingPaymentIntent: paymentIntent.id,
            };
        }
      } catch (error) {
        console.error('Error checking payment intent status:', error);
        // If we can't check Stripe, be conservative
        return {
          canCreateNewPayment: false,
          reason: 'Unable to verify payment status',
          suggestedAction: 'wait',
          message:
            'Unable to verify payment status. Please wait a moment and try again.',
        };
      }
    }
  }

  // No pending payments or they're old enough to retry
  return {
    canCreateNewPayment: true,
    suggestedAction: 'proceed',
    message: 'Ready to process payment.',
  };
}

/**
 * Get user-friendly payment status message
 */
export async function getPaymentStatusMessage(payment: any): Promise<string> {
  if (!payment) return 'No payment information available';

  switch (payment.status) {
    case 'pending':
      const age = Date.now() - new Date(payment.created_at).getTime();
      if (age > 60 * 60 * 1000) {
        // 1 hour
        return 'Payment attempt expired. Please try again.';
      } else if (age > 15 * 60 * 1000) {
        // 15 minutes
        return 'Payment is taking longer than expected. Please check your payment method.';
      }
      return 'Payment is being processed...';

    case 'completed':
      return 'Payment completed successfully';

    case 'failed':
      return payment.notes?.includes('Auto-cancelled')
        ? 'Previous payment attempt was cancelled due to a newer attempt'
        : 'Payment failed. Please try again.';

    case 'refunded':
      return 'Payment was refunded';

    default:
      return `Payment status: ${payment.status}`;
  }
}
