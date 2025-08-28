# Refund System & Audit Trail Architecture Decision

## Decision: Maintain Platform-Level Audit Trail

**Date:** January 2025  
**Status:** Implemented  
**Context:** Stripe Connect with Standard Accounts using Direct Charges

## Summary

We maintain our own `refunds` table alongside Stripe's records to provide platform-level visibility, enable custom business logic, and support non-Stripe payment methods.

## Context

Threadfolio uses Stripe Connect with Standard accounts where:

- Seamstresses are the merchant of record (direct charges)
- Each seamstress has their own Stripe Dashboard access
- Refunds are processed directly on the connected account
- Stripe handles all compliance and regulatory requirements

## Decision Drivers

1. **Platform Visibility**: Need cross-account analytics and reporting
2. **Multiple Payment Methods**: Support cash and POS refunds
3. **Business Logic**: Enforce refund limits and approval workflows
4. **User Experience**: Enable optimistic updates and real-time UI
5. **Audit Requirements**: Maintain platform-level audit trail

## Architecture

### Database Design

```sql
-- Payments table tracks cumulative refunded amount
payments (
  id,
  amount_cents,
  refunded_amount_cents,  -- Sum of all successful refunds
  status                  -- 'completed', 'partially_refunded', 'refunded'
)

-- Refunds table tracks individual refund transactions
refunds (
  id,
  payment_id,
  amount_cents,
  refund_method,          -- 'stripe', 'cash', 'external_pos'
  stripe_refund_id,       -- For Stripe refunds
  status,
  initiated_by,           -- Audit trail
  reason,
  merchant_notes
)
```

### Key Features

1. **Multiple Partial Refunds**: Accumulate refund amounts correctly
2. **Refund History**: Show all refunds per payment with tooltip
3. **Mixed Payment Methods**: Handle Stripe, cash, and POS refunds
4. **Audit Trail**: Track who initiated refunds and why

## Stripe Integration

### What Stripe Handles (Compliance Offloading)

- PCI DSS Level 1 compliance
- KYC/AML verification for connected accounts
- Regulatory compliance updates
- Fraud detection (Radar)
- Dispute management
- Transaction records in connected account Dashboard

### What We Handle (Platform Requirements)

- Cross-account visibility and reporting
- Platform-specific business rules
- Non-Stripe payment method refunds
- Real-time UI updates
- Custom metadata and notes

## Implementation Details

### Refund Processing Flow

1. **Stripe Refunds**:

   ```typescript
   // Process refund on connected account (direct charge)
   const refund = await stripe.refunds.create(
     {
       payment_intent: paymentIntentId,
       amount: refundAmount,
     },
     {
       stripeAccount: connectedAccountId, // Critical for direct charges
     }
   );
   ```

2. **Database Updates**:
   - Insert record in `refunds` table
   - Update `payments.refunded_amount_cents` (accumulative)
   - Update `payments.status` based on total refunded

3. **Audit Trail**:
   - Track `initiated_by` (user ID)
   - Store `reason` and `merchant_notes`
   - Maintain `refund_count` in payment metadata

### Security Considerations

1. **Refund Limits**: Enforce max refundable amount in application logic
2. **Database Trigger**: Automatically sync refunded amounts
3. **Webhook Sync**: Handle refunds created outside platform
4. **RLS Policies**: Ensure proper access control

## Alternatives Considered

### Option 1: Rely Solely on Stripe Records

**Rejected because:**

- No cross-account visibility at platform level
- Can't support non-Stripe refunds
- No custom business logic enforcement
- Poor UX due to API latency

### Option 2: Use Destination Charges Instead

**Rejected because:**

- Platform becomes merchant of record (compliance burden)
- Platform liable for disputes and chargebacks
- Conflicts with business model (seamstresses own their business)

## Consequences

### Positive

- Complete platform-level visibility
- Support for all payment methods
- Custom business logic enforcement
- Excellent user experience
- Comprehensive audit trail

### Negative

- Data duplication with Stripe
- Need to maintain sync logic
- Additional database storage

## Future Considerations

1. **Webhook Integration**: Implement refund webhooks for edge cases
2. **Reconciliation**: Build automated reconciliation reports
3. **Approval Workflows**: Add refund approval for large amounts
4. **Analytics**: Build refund analytics dashboard

## References

- [Stripe Connect Direct Charges](https://docs.stripe.com/connect/direct-charges)
- [Stripe Refunds Documentation](https://docs.stripe.com/refunds)
- [Connect Account Types](https://docs.stripe.com/connect/accounts)
