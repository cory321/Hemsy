# Stripe Connect Payment Element Fix

## Issue Summary

The application was experiencing "Unhandled payment Element loaderror" console errors when merchants (seamstresses with connected Stripe accounts) attempted to charge their clients' credit cards in a card-present situation during order creation (step 3).

## Root Cause

The application uses **Stripe Direct Charges** where:

1. The seamstress (connected account) is the merchant of record
2. Payment intents are created on the connected account (not the platform account)
3. The frontend Payment Element was trying to load on the platform account
4. This mismatch caused the Payment Element to fail loading because it couldn't find the payment intent

## Solution Implemented

### Backend (Already Working)

The backend in `/src/lib/actions/payments.ts` was already correctly:

1. Creating payment intents on the connected account using `stripeAccount` parameter
2. Returning `connectedAccountId` and `isDirectCharge` flags in the response
3. Setting `USE_DIRECT_CHARGES = true` to enable direct charges

### Frontend Updates Required

Updated two payment components to properly initialize Stripe Elements with the connected account:

#### 1. OrderPaymentDialog Component

```typescript
// Store connected account ID from payment intent response
const [connectedAccountId, setConnectedAccountId] = useState<string | null>(null);

// When creating payment intent
if (result.data.isDirectCharge && result.data.connectedAccountId) {
    setConnectedAccountId(result.data.connectedAccountId);
}

// Initialize Elements with connected account
<Elements
    stripe={connectedAccountId
        ? loadStripe(publishableKey, {
            stripeAccount: connectedAccountId
        })
        : stripePromise!}
    options={{ clientSecret }}
>
```

#### 2. PaymentFormClient Component (Invoice Payments)

Applied the same pattern to ensure invoice payments also work with connected accounts.

## Stripe Connect Payment Flow

### Direct Charges (Current Implementation)

- **Merchant of Record**: Seamstress (connected account)
- **Compliance**: Seamstress handles compliance, taxes, disputes
- **Funds Flow**: Money goes directly to seamstress's Stripe account
- **Platform Fee**: Currently 0% (configurable via PLATFORM_FEE_PERCENTAGE variable)
- **Statement Descriptor**: Shows seamstress's business name on customer's statement

### Key Benefits

1. **Compliance Offloading**: Seamstresses handle their own tax compliance
2. **Direct Relationship**: Customers see the seamstress as the merchant
3. **Simplified Accounting**: Seamstresses receive funds directly
4. **Lower Platform Risk**: Platform isn't liable for disputes

## Testing Checklist

- [ ] Seamstress can charge customer's card during order creation
- [ ] Payment Element loads without errors
- [ ] Payment completes successfully
- [ ] Funds appear in seamstress's connected account
- [ ] Application fee is collected (if configured)
- [ ] Customer sees seamstress's business name on statement

## Technical Details

### Payment Intent Metadata

The payment intent includes enhanced metadata for security and tracking:

```javascript
metadata: {
    payment_context: 'card_present_merchant_assisted',
    merchant_present: 'true',
    transaction_type: 'card_present',
    risk_level: 'low',
    connect_flow_type: 'direct_charge',
    merchant_account_id: connectedAccountId
}
```

### Error Prevention

- Check for existing pending payments before creating new ones
- Cancel stale payment intents (>15 minutes old)
- Return existing payment intent if one is active

## Configuring Platform Fees

To enable platform fees in the future, modify the `PLATFORM_FEE_PERCENTAGE` constant in `/src/lib/actions/payments.ts`:

```typescript
// Line 290 in payments.ts
const PLATFORM_FEE_PERCENTAGE = 0; // Change to desired percentage (e.g., 0.025 for 2.5%)
```

When platform fees are enabled:

- The fee is automatically calculated as a percentage of the transaction amount
- The fee is deducted from the connected account and transferred to the platform
- For refunds, you may want to refund the application fee by uncommenting line 715

## References

- [Stripe Direct Charges Documentation](https://docs.stripe.com/connect/direct-charges)
- [Payment Element with Connected Accounts](https://docs.stripe.com/connect/direct-charges?platform=web&ui=elements)
- [Stripe Connect Compliance](https://docs.stripe.com/connect/express-accounts#compliance)
