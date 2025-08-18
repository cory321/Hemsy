# Stripe Webhook Testing Guide

This guide explains how to test the Stripe webhook integration for the invoice management system.

## Prerequisites

1. **Stripe CLI**: Install the Stripe CLI

   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Or download from https://stripe.com/docs/stripe-cli
   ```

2. **Environment Variables**: Ensure these are set in `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   RESEND_API_KEY=re_...
   ```

## Setting Up Webhook Testing

### 1. Start the Stripe CLI Webhook Forwarding

```bash
# Login to Stripe (first time only)
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The CLI will display a webhook signing secret like `whsec_...`. Add this to your `.env.local` as `STRIPE_WEBHOOK_SECRET`.

### 2. Test Individual Events

You can trigger specific webhook events using the Stripe CLI:

```bash
# Test successful payment
stripe trigger payment_intent.succeeded

# Test failed payment
stripe trigger payment_intent.payment_failed

# Test checkout session completed
stripe trigger checkout.session.completed

# Test refund
stripe trigger charge.refunded
```

### 3. Test Full Payment Flow

1. **Create a test invoice**:
   - Go to Orders page
   - Create a new order with test data
   - Create an invoice for the order

2. **Test online payment**:
   - Click "Pay Online" on the invoice
   - Use test card: `4242 4242 4242 4242`
   - Any future expiry date and any CVC
   - Complete the payment

3. **Verify webhook processing**:
   - Check the Stripe CLI output for webhook events
   - Verify the invoice status updates to "paid"
   - Check that receipt email was sent

### 4. Test Payment Link Flow

1. **Generate payment link**:
   - From invoice page, click "Send Payment Link"
   - Copy the generated link

2. **Test public payment**:
   - Open the link in an incognito window
   - Complete payment with test card
   - Verify success page appears

### 5. Manual Webhook Testing

Use the provided test script to send webhook events manually:

```bash
# Set the webhook secret from Stripe CLI
export STRIPE_LOCAL_WEBHOOK_SECRET=whsec_test_...

# Run the test script
npm run test:stripe-webhook
```

## Test Cards

### Successful Payment Cards

- `4242 4242 4242 4242` - Visa (US)
- `5555 5555 5555 4444` - Mastercard
- `3782 822463 10005` - American Express

### Cards for Testing Failures

- `4000 0000 0000 0002` - Card declined
- `4000 0000 0000 9995` - Insufficient funds
- `4000 0000 0000 9987` - Lost card
- `4000 0000 0000 9979` - Stolen card

### 3D Secure Test Cards

- `4000 0000 0000 3220` - 3DS authentication required
- `4000 0000 0000 3063` - 3DS authentication supported but not required

## Monitoring and Debugging

### 1. Check Webhook Event Processing

Monitor the webhook events table:

```sql
SELECT * FROM stripe_webhook_events
ORDER BY processed_at DESC
LIMIT 10;
```

### 2. Check Payment Records

```sql
SELECT p.*, i.invoice_number
FROM payments p
JOIN invoices i ON p.invoice_id = i.id
ORDER BY p.created_at DESC
LIMIT 10;
```

### 3. Check Invoice Status History

```sql
SELECT * FROM invoice_status_history
WHERE invoice_id = 'your-invoice-id'
ORDER BY created_at DESC;
```

### 4. Debug Webhook Failures

1. Check the Stripe CLI output for errors
2. Check your app logs for webhook processing errors
3. Verify the webhook secret is correct
4. Check the Stripe Dashboard webhook logs

## Common Issues

### Webhook Signature Verification Failed

- Ensure `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe CLI
- Make sure you're using the raw request body (not parsed JSON)

### Payment Not Updating Invoice

- Check that the payment intent has the correct `invoice_id` in metadata
- Verify the invoice exists and belongs to the correct shop
- Check for errors in the webhook processing logs

### Email Not Sending

- Verify `RESEND_API_KEY` is set correctly
- Check that the client has `accept_email` set to true
- Look for email sending errors in the logs

## Production Webhook Setup

1. **Add webhook endpoint in Stripe Dashboard**:
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/webhooks/stripe`
   - Select events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `checkout.session.completed`
     - `charge.refunded`

2. **Get the production webhook secret**:
   - Copy the signing secret from the webhook details
   - Add to production environment variables

3. **Configure different webhook endpoints**:
   - Development: Use Stripe CLI forwarding
   - Staging: Separate webhook endpoint
   - Production: Production webhook endpoint

## Testing Checklist

- [ ] Webhook forwarding is active
- [ ] Environment variables are set
- [ ] Can create invoices
- [ ] Online payment completes successfully
- [ ] Invoice status updates after payment
- [ ] Receipt email is sent
- [ ] Payment link generation works
- [ ] Public payment page loads
- [ ] Manual payment recording works
- [ ] Refund processing works (if implemented)

## Additional Resources

- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Webhook Documentation](https://stripe.com/docs/webhooks)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe API Reference](https://stripe.com/docs/api)
