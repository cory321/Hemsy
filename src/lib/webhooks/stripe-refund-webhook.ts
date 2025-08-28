/**
 * Stripe Refund Webhook Handler
 *
 * This webhook ensures our database stays in sync with Stripe's refund records.
 * It handles edge cases where refunds might be created outside our platform.
 */

import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const webhookSecret = process.env.STRIPE_REFUND_WEBHOOK_SECRET!;

export async function handleRefundWebhook(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Webhook Error', { status: 400 });
  }

  const supabase = await createClient();

  switch (event.type) {
    case 'refund.created':
    case 'refund.updated': {
      const refund = event.data.object as Stripe.Refund;

      // Check if this refund already exists in our database
      const { data: existingRefund } = await supabase
        .from('refunds')
        .select('id')
        .eq('stripe_refund_id', refund.id)
        .single();

      if (!existingRefund) {
        // This refund was created outside our platform
        // Log it for investigation
        console.warn('Refund created outside platform:', {
          refundId: refund.id,
          paymentIntentId: refund.payment_intent,
          amount: refund.amount,
          created: new Date(refund.created * 1000).toISOString(),
        });

        // Find the payment record
        const { data: payment } = await supabase
          .from('payments')
          .select('id')
          .eq('stripe_payment_intent_id', refund.payment_intent as string)
          .single();

        if (payment) {
          // Create refund record to maintain consistency
          await supabase.from('refunds').insert({
            payment_id: payment.id,
            stripe_refund_id: refund.id,
            amount_cents: refund.amount,
            reason: refund.reason || 'Created outside platform',
            status: refund.status as string,
            refund_type: 'full', // We can't determine this from webhook alone
            refund_method: 'stripe',
            merchant_notes:
              'Created outside Threadfolio platform - synced via webhook',
            processed_at: new Date(refund.created * 1000).toISOString(),
            stripe_metadata: refund.metadata,
          });
        }
      }
      break;
    }

    case 'refund.failed': {
      const refund = event.data.object as Stripe.Refund;

      // Update our refund record if it exists
      await supabase
        .from('refunds')
        .update({
          status: 'failed',
          stripe_metadata: {
            failure_reason: refund.failure_reason,
            failure_message: (refund as any).failure_message || null,
          },
        })
        .eq('stripe_refund_id', refund.id);

      break;
    }
  }

  return new Response('OK', { status: 200 });
}
