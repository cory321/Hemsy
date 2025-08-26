import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/admin';
import {
  handleSuccessfulPayment,
  handleFailedPayment,
} from '@/lib/actions/payments';
import { syncConnectAccountToDB } from '@/lib/actions/stripe-connect';

// Exported for unit testing of business logic separate from signature verification
export async function processStripeEvent(event: Stripe.Event): Promise<void> {
  const supabase = createClient();

  // Log all webhook events for debugging
  console.log('🔔 Webhook Event Received:', {
    id: event.id,
    type: event.type,
    account: event.account || 'platform',
    created: new Date(event.created * 1000).toISOString(),
    livemode: event.livemode,
  });

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

  // Check if event is from a connected account (for direct charges)
  const isConnectedAccountEvent = !!event.account;

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent was successful:', paymentIntent.id, {
        from_connected_account: isConnectedAccountEvent,
        account: event.account,
      });

      // For DIRECT charges, events come from connected account
      // For DESTINATION charges, events come from platform account
      const isDestinationCharge =
        !isConnectedAccountEvent &&
        (paymentIntent.transfer_data?.destination ||
          paymentIntent.on_behalf_of);

      const isDirectCharge = isConnectedAccountEvent;

      if (isDestinationCharge || isDirectCharge) {
        console.log('Connect payment detected:', {
          payment_intent: paymentIntent.id,
          type: isDirectCharge ? 'direct_charge' : 'destination_charge',
          connected_account:
            event.account || // For direct charges
            paymentIntent.transfer_data?.destination || // For destination charges
            paymentIntent.on_behalf_of,
        });
      }

      // Process the successful payment
      try {
        await handleSuccessfulPayment(paymentIntent.id, {
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          payment_method: paymentIntent.payment_method,
          receipt_email: paymentIntent.receipt_email,
          is_connect_payment: isDestinationCharge || isDirectCharge,
          charge_type: isDirectCharge
            ? 'direct'
            : isDestinationCharge
              ? 'destination'
              : 'platform',
          connected_account:
            event.account || // For direct charges
            paymentIntent.transfer_data?.destination || // For destination charges
            paymentIntent.on_behalf_of,
          event_account: event.account,
        });
      } catch (error) {
        console.error('Error processing successful payment:', error);
        throw error; // Let Stripe retry
      }
      return;
    }

    case 'payment_intent.created': {
      // For destination charges, this is created on platform account
      // Just log it - no action needed unless you want to track creation
      const createdIntent = event.data.object as Stripe.PaymentIntent;
      console.log('PaymentIntent created:', createdIntent.id);
      return;
    }

    case 'charge.succeeded': {
      // For destination charges, charge succeeds on platform account
      // The payment_intent.succeeded event handles the main processing
      // This is just for logging/tracking if needed
      const charge = event.data.object as Stripe.Charge;
      console.log('Charge succeeded:', charge.id);
      return;
    }

    case 'transfer.created': {
      // Automatic transfer to connected account for destination charges
      const transfer = event.data.object as Stripe.Transfer;
      console.log('Transfer created to connected account:', {
        transfer_id: transfer.id,
        destination: transfer.destination,
        amount: transfer.amount,
      });
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

      // Check if this is a Connect refund
      const isConnectRefund =
        charge.transfer_data?.destination ||
        charge.on_behalf_of ||
        event.account;

      if (isConnectRefund) {
        console.log('Connect refund detected:', {
          charge: charge.id,
          payment_intent: charge.payment_intent,
          connected_account:
            charge.transfer_data?.destination || charge.on_behalf_of,
          event_account: event.account,
          refunded_amount: charge.amount_refunded,
        });
      }

      // Update payment record with refund info
      if (charge.payment_intent && typeof charge.payment_intent === 'string') {
        const supabase = createClient();
        const { error } = await supabase
          .from('payments')
          .update({
            refunded_amount_cents: charge.amount_refunded,
            refunded_at: new Date().toISOString(),
            status:
              charge.amount_refunded >= charge.amount
                ? 'refunded'
                : 'partially_refunded',
            stripe_metadata: {
              refunded: true,
              refunded_at: new Date().toISOString(),
              refund_amount: charge.amount_refunded,
              is_connect_refund: !!isConnectRefund,
              connected_account:
                typeof event.account === 'string' ? event.account : null,
              event_account: event.account || null,
            } as any,
          })
          .eq('stripe_payment_intent_id', charge.payment_intent);

        if (error) {
          console.error('Error updating refund status:', error);
        }
      }
      return;
    }

    case 'refund.created': {
      const refund = event.data.object as Stripe.Refund;
      console.log('Refund created:', refund.id);

      // Check if this is a Connect refund
      const isConnectRefund =
        event.account ||
        (typeof refund.charge === 'object' &&
          refund.charge?.transfer_data?.destination);

      if (isConnectRefund) {
        console.log('Connect refund created:', {
          refund: refund.id,
          payment_intent: refund.payment_intent,
          charge: refund.charge,
          event_account: event.account,
          amount: refund.amount,
        });
      }

      // Find the associated payment and update refund tracking
      if (refund.payment_intent && typeof refund.payment_intent === 'string') {
        const supabase = createClient();

        // Get the payment record
        const { data: payment } = await supabase
          .from('payments')
          .select('id')
          .eq('stripe_payment_intent_id', refund.payment_intent)
          .single();

        if (payment) {
          // Insert refund record
          await supabase.from('refunds').insert({
            payment_id: payment.id,
            stripe_refund_id: refund.id,
            amount_cents: refund.amount,
            reason: refund.reason || 'Refund processed',
            refund_type: 'full', // Will be updated if partial
            status: 'succeeded',
            processed_at: new Date().toISOString(),
            stripe_metadata: {
              ...(refund as any),
              is_connect_refund: isConnectRefund,
              event_account: event.account,
            },
          });
        }
      }
      return;
    }

    case 'account.updated': {
      const account = event.data.object as Stripe.Account;
      console.log('Connect account updated:', account.id);

      try {
        // Sync Connect account status with local database
        await syncConnectAccountToDB(account.id, account);
      } catch (error) {
        console.error('Error syncing Connect account:', error);
        throw error; // Let Stripe retry
      }
      return;
    }

    case 'capability.updated': {
      const capability = event.data.object as Stripe.Capability;
      console.log(
        'Connect capability updated:',
        capability.account,
        capability.id
      );

      try {
        // Retrieve full account and sync
        const stripe = new (require('stripe'))(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: '2025-02-24.acacia',
        });
        const account = await stripe.accounts.retrieve(
          capability.account as string
        );
        await syncConnectAccountToDB(account.id, account);
      } catch (error) {
        console.error('Error handling capability update:', error);
        throw error; // Let Stripe retry
      }
      return;
    }

    case 'account.external_account.created':
    case 'account.external_account.updated': {
      const externalAccount = event.data.object as Stripe.ExternalAccount;
      console.log('Connect external account updated:', externalAccount.account);

      try {
        // Sync account to update payout capabilities
        const stripe = new (require('stripe'))(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: '2025-02-24.acacia',
        });
        const account = await stripe.accounts.retrieve(
          externalAccount.account as string
        );
        await syncConnectAccountToDB(account.id, account);
      } catch (error) {
        console.error('Error handling external account update:', error);
        throw error; // Let Stripe retry
      }
      return;
    }

    default: {
      // Some events we explicitly don't need to handle for destination charges:
      // - payment.created: This comes from connected account perspective, redundant
      // - payment.updated: Usually not needed unless tracking specific changes
      // - charge.updated: Minor updates we don't need to track

      // List events we intentionally skip to reduce log noise
      const intentionallySkippedEvents = [
        'payment.created', // Connected account view of payment (redundant)
        'payment.updated', // Minor payment updates
        'charge.updated', // Minor charge updates
        'customer.created', // Customer management events
        'customer.updated',
      ];

      if (!intentionallySkippedEvents.includes(event.type)) {
        console.log(`Unhandled event type: ${event.type}`);
      }
      return;
    }
  }
}
