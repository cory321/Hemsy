# Migration to Direct Charges for Compliance Offloading

## Quick Summary

To offload legal and compliance burden to seamstresses and Stripe, you need to switch from **destination charges** to **direct charges** with **Standard accounts**.

## What Changes

### 1. Payment Processing (`src/lib/actions/payments.ts`)

✅ **Already Done**: Set `USE_DIRECT_CHARGES = true` in the createPaymentIntent function

- Payments now process directly on seamstress's Stripe account
- Platform takes optional application fee (2.5% by default)

### 2. Account Type

✅ **Already Correct**: You're using Standard accounts

- Standard accounts handle their own compliance
- Seamstresses complete full Stripe onboarding

### 3. Webhook Handling (`src/lib/stripe/webhook-handler.ts`)

✅ **Already Updated**: Handles both direct and destination charge events

- Direct charge events come WITH `event.account` property
- Destination charge events come WITHOUT `event.account`

### 4. Refunds (`src/lib/actions/payments.ts`)

✅ **Already Updated**: Checks charge type and refunds appropriately

- Direct charges refund on connected account
- Destination charges refund on platform account

## What This Means for Compliance

### Before (Destination Charges)

- **Threadfolio** is merchant of record
- **Threadfolio** handles tax compliance
- **Threadfolio** handles disputes
- **Threadfolio** name on statements
- **Threadfolio** bears all compliance burden

### After (Direct Charges)

- **Seamstress** is merchant of record
- **Seamstress** handles tax compliance (1099s, etc.)
- **Seamstress** handles disputes directly
- **Seamstress** name on statements
- **Stripe & Seamstress** bear compliance burden

## UI/UX Impact - Minimal!

### What Stays the Same

✅ Your order flow UI remains unchanged
✅ Your orders summary view remains unchanged  
✅ Invoice creation process unchanged
✅ Payment recording process unchanged

### What Changes (Minor)

- Statement descriptor shows seamstress business name (not Threadfolio)
- Disputes handled by seamstresses in their Stripe dashboard
- Refunds deduct from seamstress balance (not platform)
- Tax forms (1099s) sent by Stripe to seamstresses

## Testing the Change

1. **Enable Direct Charges**: Already set in code
2. **Test Payment**: Create a test payment and verify:
   - Payment appears in seamstress's Stripe dashboard
   - Application fee appears in your platform balance
   - Statement would show seamstress name
3. **Test Refund**: Issue a refund and verify:
   - Refund processes on seamstress account
   - Seamstress balance is reduced

## Rollback Plan

If you need to switch back to destination charges:

1. Set `USE_DIRECT_CHARGES = false` in `payments.ts`
2. All new payments will use destination charges
3. Existing payments continue as they were created

## Important Notes

⚠️ **Seamstress Onboarding**: Standard accounts require full KYC

- Seamstresses must provide SSN/EIN
- Bank account verification required
- Business details required
- Takes 2-3 business days typically

⚠️ **Platform Fees**: You can only monetize via `application_fee_amount`

- Cannot modify seamstress's prices
- Fee is taken from their payment
- Consider 2.5-5% platform fee

✅ **Compliance Benefit**: This setup means:

- No money transmitter license needed
- No sales tax collection burden
- No PCI compliance burden (beyond SAQ-A)
- No dispute liability

## Next Steps

1. ✅ Code changes are complete
2. [ ] Test with a real Standard account
3. [ ] Update Terms of Service to reflect seamstress as merchant
4. [ ] Update onboarding flow to explain Standard account requirements
5. [ ] Communicate change to existing seamstresses
