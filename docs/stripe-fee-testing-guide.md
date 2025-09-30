# Stripe Fee Tracking - Testing Guide

## 🧪 Quick Test Instructions

### Prerequisites

- Stripe account with Connect enabled
- Test mode API keys configured
- Webhook endpoint deployed and accessible

### Step 1: Configure Webhook (One-time Setup)

1. **Go to Stripe Dashboard**
   - Navigate to: [Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)

2. **Find your webhook endpoint**
   - Look for: `https://yourdomain.com/api/webhooks/stripe`
   - Click to edit

3. **Add `charge.updated` event**
   - Click "Select events"
   - Search: "charge.updated"
   - Check the box
   - Click "Add events"
   - Save changes

### Step 2: Create Test Payment

1. **In your Hemsy app (test mode):**

   ```
   1. Create new order
   2. Add services (e.g., "Hem Pants" - $32.00)
   3. Choose Stripe as payment method
   4. Complete payment with test card: 4242 4242 4242 4242
   ```

2. **Verify payment succeeds:**
   - Order shows as paid
   - Payment appears in Payment History
   - Initial display: NO fee data yet (this is expected!)

### Step 3: Wait for Async Fee Data

**Timeline:** Fees appear within 1 hour (usually within minutes)

**What's happening behind the scenes:**

```
✅ T+0 seconds:  PaymentIntent created & confirmed
✅ T+0 seconds:  payment_intent.succeeded webhook
✅ T+0 seconds:  Payment marked as "completed" in DB
⏳ T+0-60 min:   Stripe creates Balance Transaction (async)
📡 T+0-60 min:   charge.updated webhook fired
✅ T+0-60 min:   Fee data saved to database
```

### Step 4: Verify Fee Display

1. **Refresh the order detail page**
   - You should see fee indicator appear below payment amount
   - Example: `Fee: -$0.87`

2. **Hover over the fee indicator**
   - Tooltip should show:
     ```
     Stripe Processing Breakdown
     Charged: $32.00
     Stripe Fee: -$0.87
     Net Deposited: $31.13
     ```

3. **Verify calculations:**
   - For $32.00 charge at 2.7% + $0.05:
   - Fee = ($32.00 × 0.027) + $0.05 = $0.864 + $0.05 = $0.91
   - Net = $32.00 - $0.91 = $31.09

   (Actual amounts may vary slightly due to rounding)

## 🔍 Debugging Checklist

### ❌ Fee Data Not Appearing After 1 Hour

**Check 1: Webhook Configuration**

```bash
# In Stripe Dashboard → Webhooks → Your endpoint
✅ Endpoint status: "Enabled"
✅ Events includes: "charge.updated"
✅ Recent deliveries show charge.updated events
```

**Check 2: Webhook Logs**

```typescript
// Check server logs for:
"🔔 Webhook Event Received: { type: 'charge.updated' }";
'💰 Balance transaction available for charge: {...}';
'✅ Successfully updated payment with fee data';
```

**Check 3: Database**

```sql
-- Check if fee data was saved
SELECT
  stripe_payment_intent_id,
  amount_cents,
  stripe_fee_cents,
  net_amount_cents,
  status
FROM payments
WHERE payment_method = 'stripe'
ORDER BY created_at DESC
LIMIT 5;
```

**Check 4: Stripe Dashboard**

- Go to Payments → Find your test payment
- Click to view details
- Check "Balance Transaction" section
- Verify fee information is available there

### ❌ Webhook Not Being Received

**Check endpoint health:**

```bash
# Test webhook endpoint manually
curl -X POST https://yourdomain.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Expected: 400 (missing signature is OK for manual test)
```

**Verify environment variables:**

```bash
# Check .env.local contains:
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Test from Stripe Dashboard:**

1. Go to Webhooks → Your endpoint
2. Click "Send test webhook"
3. Select "charge.updated"
4. Check if it appears in your logs

### ❌ Balance Transaction is Null

**This is normal!**

- Balance Transaction is created asynchronously
- Stripe sends multiple `charge.updated` events:
  1. First event: balance_transaction = null (immediately after payment)
  2. Second event: balance_transaction populated (within 1 hour)

**Our handler ignores the first event:**

```typescript
if (
	charge.balance_transaction &&
	typeof charge.balance_transaction !== 'string'
) {
	// Only processes when balance_transaction is available
}
```

## 📊 Test Scenarios

### Scenario 1: Standard Card Payment

```
Charge: $32.00
Expected Fee: ~$0.91 (2.7% + $0.05)
Expected Net: ~$31.09
```

### Scenario 2: Small Payment

```
Charge: $5.00
Expected Fee: ~$0.19 (2.7% + $0.05)
Expected Net: ~$4.81
```

### Scenario 3: Large Payment

```
Charge: $500.00
Expected Fee: ~$13.55 (2.7% + $0.05)
Expected Net: ~$486.45
```

### Scenario 4: Cash Payment

```
Payment Method: Cash
Expected Fee: None (no fee tracking)
UI: No fee indicator shown
```

### Scenario 5: External POS Payment

```
Payment Method: External POS
Expected Fee: None (processed outside Stripe)
UI: No fee indicator shown
```

## 🎯 Expected Behavior Summary

| Payment Method | Fee Tracked? | Fee Display? | When Appears? |
| -------------- | ------------ | ------------ | ------------- |
| Stripe (card)  | ✅ Yes       | ✅ Yes       | Within 1 hour |
| Cash           | ❌ No        | ❌ No        | N/A           |
| External POS   | ❌ No        | ❌ No        | N/A           |

## 🚦 Quick Visual Test

**Before `charge.updated` webhook:**

```
Payment History:
─────────────────────────────────────
Date        Type      Amount
Sep 30      Payment   + $32.00
                      [No fee info yet]
```

**After `charge.updated` webhook:**

```
Payment History:
─────────────────────────────────────────────────────────
Date        Type          Method    Amount      Status
Sep 30      Payment       stripe    + $32.00    ✓
Sep 30      Stripe Fee    stripe    - $0.87     ⓘ Auto-deducted
                                    ↑ Hover for breakdown
```

**Tooltip on fee row:**

```
┌─────────────────────────────────┐
│ Processing Fee Breakdown        │
│                                 │
│ Gross Charge: $32.00            │
│ Processing Fee: -$0.87          │
│ Net Deposited: $31.13           │
└─────────────────────────────────┘
```

## 🔄 Testing in CI/CD

### Automated Test Considerations

**Mock webhook testing:**

```typescript
// In your test suite
import { processStripeEvent } from '@/lib/stripe/webhook-handler';

test('should capture fee data from charge.updated webhook', async () => {
	const mockEvent = {
		type: 'charge.updated',
		data: {
			object: {
				id: 'ch_test123',
				payment_intent: 'pi_test123',
				balance_transaction: {
					fee: 87,
					net: 3113,
					fee_details: [{ type: 'stripe_fee', amount: 87 }],
					currency: 'usd',
				},
			},
		},
	};

	await processStripeEvent(mockEvent);

	// Verify payment was updated with fee data
	const payment = await getPayment('pi_test123');
	expect(payment.stripe_fee_cents).toBe(87);
	expect(payment.net_amount_cents).toBe(3113);
});
```

## 📝 Manual Test Checklist

- [ ] Webhook endpoint configured with `charge.updated`
- [ ] Test payment created successfully
- [ ] Payment shows as "completed" immediately
- [ ] Wait up to 1 hour for fee data
- [ ] Fee indicator appears in payment history
- [ ] Tooltip shows correct breakdown on hover
- [ ] Fee calculations match expected values
- [ ] Cash payments show no fee indicator
- [ ] External POS payments show no fee indicator
- [ ] Database contains correct fee data

## 🎉 Success Criteria

✅ Payment processing is fast (no delay for fees)  
✅ Fee data appears automatically within 1 hour  
✅ UI clearly shows fee breakdown  
✅ Only Stripe payments show fees  
✅ Calculations are accurate  
✅ Tooltip provides helpful detail

---

**Next Steps After Testing:**

1. Test with real payments in production
2. Monitor webhook delivery success rate
3. Gather user feedback on fee display
4. Consider adding business health enhancements
