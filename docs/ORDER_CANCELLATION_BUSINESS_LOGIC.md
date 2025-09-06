# Order Cancellation Business Logic

## Overview

Order cancellation in Threadfolio V2 implements a "soft cancellation" approach that preserves all data while freezing the ability to modify services on associated garments. This ensures complete audit trails and enables order restoration capabilities.

## Core Principles

1. **Data Preservation**: All order data (garments, services, invoices) remains intact when cancelled
2. **Service Freeze**: Cancelled orders prevent adding/removing services on associated garments
3. **Visibility Control**: Cancelled orders are hidden from default views but remain accessible
4. **Restoration Capability**: Cancelled orders can be restored to their previous active state
5. **Financial Independence**: Refund processing remains functional for cancelled orders

## Order Cancellation Rules

### Who Can Cancel Orders

- **Solo seamstresses** (shop owners) only
- Authenticated via Clerk Auth
- No customer self-service cancellation

### When Orders Can Be Cancelled

| Order Status | Can Cancel? | Notes                                    |
| ------------ | ----------- | ---------------------------------------- |
| `new`        | ✅ Yes      | No work started                          |
| `active`     | ✅ Yes      | Work in progress - show warning          |
| `ready`      | ✅ Yes      | Work completed - show strong warning     |
| `completed`  | ❌ No       | All garments picked up - use refund flow |
| `cancelled`  | ❌ No       | Already cancelled                        |

### Cancellation Effects

#### 1. Order Level

- Status changes to `cancelled`
- Original status is preserved via automatic recalculation capability
- Order remains in database with all relationships intact

#### 2. Garment Level

- Garments remain in their current stage (New, In Progress, Ready For Pickup, Done)
- **Service Modification Freeze**:
  - Cannot add new services
  - Cannot remove existing services
  - Cannot mark services as complete/incomplete
  - Existing service states are preserved

#### 3. Financial Level

- Existing invoices remain unchanged
- Unpaid invoices remain collectable
- **Refunds remain fully functional**:
  - Can process full refunds
  - Can process partial refunds
- No new invoices can be created for the cancelled order

#### 4. Visibility Level

- **Hidden from**:
  - Default garments list view
  - Client's active orders view
  - Default orders list
- **Visible in**:
  - Orders page with "Cancelled" filter applied
  - Direct order detail page (with cancelled status)
  - Financial reports and history

## Order Restoration (Uncancellation)

### Restoration Rules

- Only cancelled orders can be restored
- Restoration returns order to its calculated status based on garment stages
- All service modification capabilities are re-enabled
- Order becomes visible again in all default views

### Restoration Process

1. Verify order is currently cancelled
2. Remove cancelled status
3. Trigger automatic status recalculation based on garment stages
4. Re-enable service modifications on all associated garments
5. Log restoration in audit trail

## Business Scenarios

### Scenario 1: Customer Cancels Before Work Starts

- Order status: `new`
- All garments: `New` stage
- **Action**: Cancel order, process any deposits as refunds
- **Result**: Order hidden, no work lost

### Scenario 2: Customer Cancels Mid-Work

- Order status: `active`
- Mixed garment stages
- **Action**: Cancel with warning about work completed
- **Result**: Work frozen at current state, partial refund possible

### Scenario 3: Work Complete, Customer Doesn't Pick Up

- Order status: `ready`
- All garments: `Ready For Pickup`
- **Action**: Cancel with strong warning
- **Result**: Completed work preserved, full payment may be kept

### Scenario 4: Accidental Cancellation

- Any cancellable status
- **Action**: Click "Restore Order" button
- **Result**: Order returns to calculated status, work continues

### Scenario 5: Partial Pickup Then Cancel

- Some garments: `Done`, others: `Ready For Pickup`
- Order status: `ready`
- **Action**: Cancel order
- **Result**: Picked up items stay `Done`, unpicked items frozen

## Audit Requirements

### Cancellation Tracking

- Timestamp of cancellation
- User who cancelled (shop owner ID)
- Cancellation reason (optional field)
- Order status at time of cancellation
- Financial state at cancellation

### Restoration Tracking

- Timestamp of restoration
- User who restored
- Restored status
- Time order was cancelled

## Integration Points

### With Existing Features

- **Invoicing**: Refund workflows remain active
- **Reporting**: Cancelled orders included with filter
- **Search**: Cancelled orders excluded by default
- **Notifications**: Future integration point

### Database Integrity

- No cascade deletes on cancellation
- All foreign key relationships maintained
- RLS policies respect cancellation status

## Future Considerations

1. **Cancellation Policies**: Allow configuration of cancellation rules
2. **Automated Refunds**: Rule-based refund calculations
3. **Customer Portal**: Self-service cancellation requests
4. **Analytics**: Cancellation reason analysis
5. **Workflow Automation**: Trigger actions on cancellation

## Summary

Order cancellation in Threadfolio V2 is designed as a reversible state change that:

- Preserves all work history
- Prevents further modifications
- Maintains financial flexibility
- Enables easy restoration
- Provides clear audit trails

This approach balances the need to stop work on cancelled orders while maintaining data integrity and supporting business operations like refunds and reporting.
