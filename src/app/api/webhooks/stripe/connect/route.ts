import Stripe from 'stripe';
import { processStripeEvent } from '@/lib/stripe/webhook-handler';

// Ensure Node.js runtime for access to raw request body
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// During tests, the Stripe SDK will be instantiated but we won't make network calls
const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
  {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
  }
);

function getConnectWebhookSecret(): string | undefined {
  // Use separate webhook secret for Connect events
  return (
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    undefined
  );
}

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return createJsonResponse(
        { error: 'Missing stripe-signature header' },
        400
      );
    }

    const secret = getConnectWebhookSecret();
    if (!secret) {
      return createJsonResponse(
        { error: 'Missing STRIPE_CONNECT_WEBHOOK_SECRET in environment' },
        500
      );
    }

    const body = await request.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, secret);
    } catch (err) {
      return createJsonResponse(
        { error: 'Invalid signature', details: String(err) },
        400
      );
    }

    // Only process Connect-specific events in this endpoint
    const connectEvents = [
      // Account events
      'account.updated',
      'account.application.deauthorized',
      'capability.updated',
      'account.external_account.created',
      'account.external_account.updated',
      'account.external_account.deleted',
      'person.created',
      'person.updated',
      'person.deleted',
      // Payment events on connected accounts
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'payment_intent.canceled',
      'charge.succeeded',
      'charge.failed',
      'charge.refunded',
      'refund.created',
      'refund.updated',
      // Transfer events
      'transfer.created',
      'transfer.updated',
      'transfer.paid',
      'transfer.failed',
    ];

    if (!connectEvents.includes(event.type)) {
      console.log(`Non-Connect event received: ${event.type}, ignoring`);
      return createJsonResponse({ received: true }, 200);
    }

    try {
      await processStripeEvent(event);
    } catch (err) {
      // Log and return 200 to let Stripe retry for transient errors handled upstream
      console.error('Error processing Stripe Connect event:', err);
    }

    return createJsonResponse({ received: true }, 200);
  } catch (error) {
    console.error('Stripe Connect webhook handler error:', error);
    return createJsonResponse({ error: 'Internal server error' }, 500);
  }
}

function createJsonResponse(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
