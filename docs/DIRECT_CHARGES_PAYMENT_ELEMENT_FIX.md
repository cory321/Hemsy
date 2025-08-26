# Direct Charges Payment Element Fix

## Problem

When using **direct charges** with Stripe Connect, the Payment Element was showing "Unhandled payment Element loaderror" because it wasn't properly initialized with the connected account context.

## Root Cause

With direct charges:

1. PaymentIntent is created on the **connected account** (not platform)
2. The client secret belongs to that connected account
3. The Payment Element needs to know which account owns the PaymentIntent
4. Without this context, Stripe can't load the payment form

## Solution Implemented

### 1. Backend - Return Connected Account Context

**File: `/src/lib/actions/payments.ts`**

- Modified `createPaymentIntent` to return:
  - `connectedAccountId` - The Stripe Connect account ID
  - `isDirectCharge` - Boolean flag indicating charge type
- This tells the frontend which account context to use

### 2. Frontend - Initialize Stripe with Account Context

**File: `/src/components/orders/RecordPaymentDialog.tsx`**

- When receiving a direct charge payment intent:
  ```javascript
  const stripeWithAccount = loadStripe(publishableKey, {
    stripeAccount: connectedAccountId, // CRITICAL!
  });
  ```
- For destination charges: Uses regular `loadStripe(publishableKey)`

### 3. Enhanced Error Handling

- Added console logging for debugging
- Added visual indicator when using seamstress merchant account
- Added proper error messages for missing configuration
- Added PaymentElement event handlers for better debugging

## How It Works Now

### Direct Charges Flow:

1. Backend creates PaymentIntent on connected account
2. Returns client secret + connected account ID
3. Frontend initializes Stripe with `stripeAccount` parameter
4. Payment Element loads successfully with connected account context
5. Customer sees seamstress name on their statement

### Destination Charges Flow (if USE_DIRECT_CHARGES = false):

1. Backend creates PaymentIntent on platform account
2. Returns client secret (no connected account ID)
3. Frontend initializes Stripe normally
4. Payment Element loads with platform context
5. Customer sees platform name on their statement

## Testing Checklist

✅ **Direct Charge Payment**

1. Create an order with services
2. Go to step 3 (payment)
3. Select "Credit/Debit Card (Stripe)"
4. Payment form should load without errors
5. Should see "Processing via seamstress merchant account" message
6. Console should show: "Initializing Stripe for direct charge with connected account"

✅ **Verify Connected Account Context**

- Check browser console for connected account ID
- Payment should appear in seamstress's Stripe dashboard
- Application fee should appear in platform dashboard

✅ **Error Scenarios**

- Missing publishable key - Should show error message
- Invalid connected account - Should fall back gracefully
- Network issues - Should show appropriate error

## Key Code Changes

### Payment Intent Response Type

```typescript
export interface PaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
  amountCents: number;
  currency: string;
  // New fields for direct charges
  connectedAccountId?: string;
  isDirectCharge?: boolean;
}
```

### Stripe Initialization

```javascript
// Direct charge - with connected account
loadStripe(publishableKey, {
  stripeAccount: connectedAccountId,
});

// Destination charge - platform account
loadStripe(publishableKey);
```

## Important Notes

⚠️ **Critical Requirements**:

- Connected account must be fully onboarded
- Connected account must have charges_enabled = true
- Platform must have valid Stripe keys configured
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` must be set

⚠️ **Common Issues**:

- If Payment Element still fails, check:
  1. Connected account status in database
  2. Stripe dashboard for account capabilities
  3. Browser console for specific errors
  4. Network tab for failed API calls

## Rollback Instructions

To revert to destination charges (platform as merchant):

1. Set `USE_DIRECT_CHARGES = false` in `/src/lib/actions/payments.ts`
2. Payment Element will work without connected account context
3. All payments will process on platform account
