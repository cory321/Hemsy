import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';
import { handleSuccessfulPayment } from '@/lib/actions/payments';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentIntentId, action } = body;

    if (action === 'test_webhook') {
      return NextResponse.json({
        message: 'Webhook system is operational',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        connectWebhookSecret: !!process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
      });
    }

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 1. Check Stripe PaymentIntent status
    let stripePaymentIntent: Stripe.PaymentIntent;
    try {
      stripePaymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      return NextResponse.json(
        {
          error: `Stripe API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
        { status: 400 }
      );
    }

    // 2. Check database payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(
        `
        *,
        invoice:invoices(
          id,
          status,
          amount_cents,
          order_id
        )
      `
      )
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    // 3. Check webhook event history
    const { data: webhookEvents, error: webhookError } = await supabase
      .from('stripe_webhook_events')
      .select('*')
      .eq('event_type', 'payment_intent.succeeded')
      .order('processed_at', { ascending: false })
      .limit(10);

    // 4. If payment succeeded in Stripe but not in DB, try to process it
    let processingResult = null;
    if (
      stripePaymentIntent.status === 'succeeded' &&
      payment?.status !== 'completed'
    ) {
      try {
        await handleSuccessfulPayment(paymentIntentId, {
          debug_processed: true,
          processed_via: 'debug_tool',
          is_connect_payment: !!(
            stripePaymentIntent.transfer_data?.destination ||
            stripePaymentIntent.on_behalf_of
          ),
          connected_account:
            stripePaymentIntent.transfer_data?.destination ||
            stripePaymentIntent.on_behalf_of,
        });
        processingResult = 'Successfully processed payment via debug tool';
      } catch (error) {
        processingResult = `Error processing payment: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    }

    // 5. Get updated payment status after processing
    const { data: updatedPayment } = await supabase
      .from('payments')
      .select(
        `
        *,
        invoice:invoices(
          id,
          status,
          amount_cents,
          order_id
        )
      `
      )
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    return NextResponse.json({
      paymentIntentId,
      stripe: {
        status: stripePaymentIntent.status,
        amount: stripePaymentIntent.amount,
        currency: stripePaymentIntent.currency,
        created: new Date(stripePaymentIntent.created * 1000).toISOString(),
        transfer_data: stripePaymentIntent.transfer_data,
        on_behalf_of: stripePaymentIntent.on_behalf_of,
      },
      database: {
        found: !!payment,
        status: updatedPayment?.status || payment?.status,
        amount_cents: updatedPayment?.amount_cents || payment?.amount_cents,
        processed_at: updatedPayment?.processed_at || payment?.processed_at,
        invoice_status:
          updatedPayment?.invoice?.status || payment?.invoice?.status,
      },
      webhooks: {
        error: webhookError?.message,
        recent_events:
          webhookEvents?.map((e) => ({
            event_id: e.event_id,
            processed_at: e.processed_at,
          })) || [],
      },
      processing: processingResult,
      diagnosis: {
        stripe_succeeded: stripePaymentIntent.status === 'succeeded',
        db_completed:
          (updatedPayment?.status || payment?.status) === 'completed',
        webhook_received:
          webhookEvents?.some((e) =>
            e.event_id.includes(paymentIntentId.replace('pi_', ''))
          ) || false,
        needs_manual_processing:
          stripePaymentIntent.status === 'succeeded' &&
          (updatedPayment?.status || payment?.status) !== 'completed',
      },
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      {
        error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
