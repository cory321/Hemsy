import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/admin';
import {
  handleSuccessfulPayment,
  handleFailedPayment,
} from '@/lib/actions/payments';

// Exported for unit testing of business logic separate from signature verification
export async function processStripeEvent(event: Stripe.Event): Promise<void> {
  const supabase = createClient();

  // Record the webhook event to prevent duplicate processing
  try {
    const { error: duplicateError } = await supabase
      .from('stripe_webhook_events')
      .insert({
        event_id: event.id,
        event_type: event.type,
        processed_at: new Date().toISOString(),
      });

    if (duplicateError && duplicateError.code === '23505') {
      // Duplicate event, already processed
      console.log(`Duplicate Stripe event ${event.id}, skipping`);
      return;
    }
  } catch (error) {
    console.error('Error checking for duplicate event:', error);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent was successful:', paymentIntent.id);

      // Process the successful payment
      try {
        await handleSuccessfulPayment(paymentIntent.id, {
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          payment_method: paymentIntent.payment_method,
          receipt_email: paymentIntent.receipt_email,
        });
      } catch (error) {
        console.error('Error processing successful payment:', error);
        throw error; // Let Stripe retry
      }
      return;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent failed:', paymentIntent.id);

      // Process the failed payment
      try {
        await handleFailedPayment(
          paymentIntent.id,
          paymentIntent.last_payment_error?.message || 'Payment failed',
          {
            error_code: paymentIntent.last_payment_error?.code,
            error_type: paymentIntent.last_payment_error?.type,
          }
        );
      } catch (error) {
        console.error('Error processing failed payment:', error);
        throw error; // Let Stripe retry
      }
      return;
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Checkout session completed:', session.id);

      // Handle checkout session if using Stripe Checkout
      if (
        session.payment_intent &&
        typeof session.payment_intent === 'string'
      ) {
        try {
          await handleSuccessfulPayment(session.payment_intent, {
            customer_email: session.customer_email,
            amount_total: session.amount_total,
            currency: session.currency,
            checkout_session_id: session.id,
          });
        } catch (error) {
          console.error('Error processing checkout session:', error);
          throw error;
        }
      }
      return;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      console.log('Charge refunded:', charge.id);

      // Update payment record with refund info
      if (charge.payment_intent && typeof charge.payment_intent === 'string') {
        const supabase = createClient();
        const { error } = await supabase
          .from('payments')
          .update({
            stripe_metadata: {
              refunded: true,
              refunded_at: new Date().toISOString(),
              refund_amount: charge.amount_refunded,
            },
          })
          .eq('stripe_payment_intent_id', charge.payment_intent);

        if (error) {
          console.error('Error updating refund status:', error);
        }
      }
      return;
    }

    default: {
      console.log(`Unhandled event type: ${event.type}`);
      return;
    }
  }
}
