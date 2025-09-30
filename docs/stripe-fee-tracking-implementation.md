# Stripe Fee Tracking Implementation

**Implementation Date:** September 30, 2025  
**Status:** ✅ Complete (MVP)  
**Approach:** Async fee capture via webhooks (Option A)

## 📋 Overview

This implementation adds transparent Stripe processing fee tracking to Hemsy, allowing seamstresses to see exactly what fees are deducted from their card-present payments and understand their true net revenue.

## 🎯 Key Features

### 1. **Asynchronous Fee Capture**

- Stripe fee data is captured asynchronously via the `charge.updated` webhook
- Fees typically appear within **1 hour** after payment success (Stripe SLA)
- No performance impact on payment processing (uses default `automatic_async` capture method)

### 2. **Database Schema**

Added three new columns to the `payments` table:

```sql
- stripe_fee_cents (INTEGER)      -- Total Stripe fees in cents
- net_amount_cents (INTEGER)       -- Net amount after fees
- stripe_fee_details (JSONB)       -- Detailed fee breakdown
```

**Migration:** `add_stripe_fee_tracking.sql`

### 3. **Webhook Integration**

- **Event:** `charge.updated`
- **Trigger:** When Balance Transaction becomes available (async after payment)
- **Action:** Updates payment record with fee data from `balance_transaction` object

### 4. **UI Display**

- **Location:** Payment History table in Order Details page
- **Visibility:** Shows only for completed Stripe payments with fee data
- **Format:**
  - Inline fee indicator: `Fee: -$0.87`
  - Hover tooltip with full breakdown:
    - Charged amount
    - Stripe processing fee
    - Net deposited amount

## 🔧 Technical Implementation

### Database Migration

```sql
-- Migration: add_stripe_fee_tracking
ALTER TABLE payments
  ADD COLUMN stripe_fee_cents INTEGER DEFAULT 0 CHECK (stripe_fee_cents >= 0),
  ADD COLUMN net_amount_cents INTEGER,
  ADD COLUMN stripe_fee_details JSONB;

CREATE INDEX idx_payments_with_stripe_fees
  ON payments(payment_method, status, stripe_fee_cents, created_at DESC)
  WHERE stripe_fee_cents > 0;
```

### Webhook Handler

**File:** `src/lib/stripe/webhook-handler.ts`

```typescript
case 'charge.updated': {
  const charge = event.data.object as Stripe.Charge;

  if (charge.balance_transaction && typeof charge.balance_transaction !== 'string') {
    const balanceTx = charge.balance_transaction as Stripe.BalanceTransaction;

    await supabase
      .from('payments')
      .update({
        stripe_fee_cents: balanceTx.fee,
        net_amount_cents: balanceTx.net,
        stripe_fee_details: {
          fee_cents: balanceTx.fee,
          net_cents: balanceTx.net,
          fee_details: balanceTx.fee_details || [],
          currency: balanceTx.currency,
          exchange_rate: balanceTx.exchange_rate,
        },
      })
      .eq('stripe_payment_intent_id', paymentIntentId);
  }
}
```

### UI Component

**File:** `src/components/invoices/PaymentManagement.tsx`

Updated Payment interface:

```typescript
interface Payment {
  // ... existing fields
  stripe_fee_cents?: number | null;
  net_amount_cents?: number | null;
  stripe_fee_details?: {
    fee_cents: number;
    net_cents: number;
    fee_details?: Array<{...}>;
    currency: string;
  } | null;
}
```

Fee display in payment history table:

- Shows inline fee amount with info icon
- Tooltip shows complete breakdown on hover
- Only appears for completed Stripe payments

## 📊 Fee Information Available

From Stripe Balance Transaction API:

- **Total Fee** (`fee`): Complete Stripe processing fee
- **Net Amount** (`net`): Amount deposited to merchant account
- **Fee Details** (`fee_details`): Itemized breakdown by fee type
- **Exchange Rate**: For multi-currency transactions

### Standard Card-Present Fees

- **Rate:** 2.7% + $0.05 per transaction
- **Example:** $32.00 charge = $0.87 fee ($31.13 net)

## 🔄 Data Flow

```
1. Customer Payment
   ↓
2. PaymentIntent created & confirmed (fast)
   ↓
3. payment_intent.succeeded webhook → Payment marked complete
   ↓
4. Stripe creates Balance Transaction (async, <1 hour)
   ↓
5. charge.updated webhook → Fee data captured
   ↓
6. UI displays fee information
```

## ✅ Testing Checklist

### Stripe Dashboard Webhook Configuration

1. **Navigate to:** Stripe Dashboard → Developers → Webhooks
2. **Verify endpoint is configured:**
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to send: Must include `charge.updated`

3. **Add `charge.updated` if missing:**
   ```
   Click endpoint → "Add events"
   Search: "charge.updated"
   Select and save
   ```

### Test Payment Flow

1. **Create test order with Stripe payment**
   - Amount: Any amount (e.g., $32.00)
   - Payment method: Stripe (card-present)

2. **Verify initial payment**
   - Check payment appears as "completed" immediately
   - Fee data should NOT be present yet (async)

3. **Wait for webhook (max 1 hour)**
   - Monitor webhook logs in Stripe Dashboard
   - Look for `charge.updated` event

4. **Verify fee data appears**
   - Refresh order detail page
   - Fee indicator should appear under payment amount
   - Hover to see full breakdown

### Expected Results

✅ Payment completes immediately (no delay)  
✅ Fee data appears within 1 hour  
✅ Fee breakdown shows in tooltip  
✅ Cash/external POS payments show no fees  
✅ Only Stripe payments show fee data

## 🚫 Known Limitations (MVP Scope)

### Not Included in MVP:

- ❌ Business health dashboard gross vs. net toggle
- ❌ Fee trend analysis or reporting
- ❌ Historical fee backfill for old payments
- ❌ Fee forecasting or estimation

These features are deferred to post-MVP based on user feedback.

## 🔐 Stripe Connect Integration

### Current Implementation:

- **Charge Type:** Direct Charges
- **Account Type:** Standard Connected Accounts
- **Fee Responsibility:** Connected accounts (seamstresses) pay Stripe fees
- **Dashboard Access:** Seamstresses have full Stripe Dashboard access

### Important Notes:

- Fees are **automatically deducted** by Stripe before payout
- Seamstresses can also see fees in their own Stripe Dashboard
- Platform tracks fees for analytics but does NOT charge fees to seamstresses
- Balance Transaction data is available because we listen to webhooks from connected accounts

## 📝 TypeScript Types

```typescript
// Payment record with fee tracking
interface PaymentWithFees {
	id: string;
	amount_cents: number;
	stripe_fee_cents?: number | null;
	net_amount_cents?: number | null;
	stripe_fee_details?: {
		fee_cents: number;
		net_cents: number;
		fee_details: Array<{
			type: string; // e.g., "stripe_fee", "application_fee"
			amount: number; // Fee amount in cents
			currency: string;
			description?: string;
		}>;
		currency: string;
		exchange_rate?: number | null;
		available_on?: number;
		created?: number;
	} | null;
}
```

## 🔍 Troubleshooting

### Fee Data Not Appearing

**Problem:** Payment completed but no fee data shows  
**Solution:**

1. Check webhook configuration includes `charge.updated`
2. Wait up to 1 hour (Stripe SLA)
3. Check webhook logs in Stripe Dashboard for errors
4. Verify payment method is 'stripe' (not cash/external_pos)

### Webhook Not Firing

**Problem:** `charge.updated` webhook not being received  
**Solution:**

1. Verify webhook endpoint URL is correct
2. Check webhook signing secret is set in environment variables
3. Test webhook delivery from Stripe Dashboard
4. Check server logs for webhook processing errors

### Missing Balance Transaction

**Problem:** `charge.updated` fires but no balance_transaction  
**Solution:**

1. This is normal immediately after payment
2. Stripe will send another `charge.updated` when ready
3. Handler checks for balance_transaction existence before processing

## 📚 Related Documentation

- [Stripe Balance Transactions API](https://docs.stripe.com/api/balance_transactions)
- [Asynchronous Capture](https://docs.stripe.com/payments/payment-intents/asynchronous-capture)
- [Stripe Connect Direct Charges](https://docs.stripe.com/connect/direct-charges)
- [Webhook Events](https://docs.stripe.com/webhooks/events)

## 🎯 Success Metrics

**User Value:**

- ✅ Transparent fee visibility for all Stripe payments
- ✅ No performance impact on payment processing
- ✅ Accurate net revenue tracking
- ✅ Simple, intuitive fee display

**Technical Achievements:**

- ✅ Async webhook-based implementation
- ✅ Proper database schema with indexes
- ✅ Clean separation of concerns
- ✅ Type-safe TypeScript implementation

## 🚀 Future Enhancements (Post-MVP)

1. **Business Health Dashboard**
   - Add gross vs. net revenue toggle
   - Show total fees paid per period
   - Fee trend charts

2. **Reporting & Analytics**
   - Export fee data for accounting
   - Monthly fee summaries
   - Fee comparison across payment methods

3. **Historical Data**
   - Backfill fees for older payments using Stripe API
   - Periodic sync job for missing fee data

4. **Advanced Features**
   - Fee notifications for high-fee transactions
   - Fee optimization recommendations
   - Multi-currency fee handling

---

**Implementation Status:** ✅ Complete  
**Ready for Production:** Yes (pending webhook verification)  
**Next Steps:** Configure webhooks in Stripe Dashboard and test with live payment
