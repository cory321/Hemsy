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

function getWebhookSecret(): string | undefined {
  // Prefer test secret in development if provided
  return (
    process.env.STRIPE_TEST_WEBHOOK_SECRET ||
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

    const secret = getWebhookSecret();
    if (!secret) {
      return createJsonResponse(
        { error: 'Missing STRIPE_WEBHOOK_SECRET in environment' },
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

    try {
      await processStripeEvent(event);
    } catch (err) {
      // Log and return 200 to let Stripe retry for transient errors handled upstream
      console.error('Error processing Stripe event:', err);
    }

    return createJsonResponse({ received: true }, 200);
  } catch (error) {
    console.error('Stripe webhook handler error:', error);
    return createJsonResponse({ error: 'Internal server error' }, 500);
  }
}

function createJsonResponse(payload: unknown, status: number): Response {
  // Use global Response if available (provided by undici in tests or by runtime)
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
