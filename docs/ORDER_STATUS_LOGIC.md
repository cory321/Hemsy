# Order Status Logic Implementation

## Overview

Order status is now automatically derived from garment stages, completely decoupled from payment status. The system uses database triggers to automatically update order status whenever garment stages change.

## Order Status Values

- **`new`** - All garments are in 'New' stage (no work has started)
- **`active`** - Mixed garment stages indicating work is in progress
- **`ready`** - All garments are either 'Ready For Pickup' or 'Done' (but not all Done)
- **`completed`** - All garments are in 'Done' stage (all picked up)
- **`cancelled`** - Order has been cancelled (set manually)

## Business Rules

### Status: `new`

- **Condition**: All garments in the order are in 'New' stage
- **Meaning**: No work has started on any garment yet

### Status: `active`

- **Condition**: Mixed garment stages (not all garments at the same completion level)
- **Examples**:
  - Some garments are 'New' and others are 'Ready For Pickup'
  - Some garments are 'New' and others are 'In Progress'
  - Any garments are 'In Progress'
  - Some garments are 'New' and others are 'Done'
- **Meaning**: Work is actively being done on the order

### Status: `ready`

- **Condition**: All garments are either 'Ready For Pickup' or 'Done' (but NOT all are 'Done')
- **Examples**:
  - All garments are 'Ready For Pickup'
  - Some garments are 'Ready For Pickup' and some are 'Done'
  - Most garments are 'Done' but at least one is still 'Ready For Pickup'
- **Meaning**: All work is complete, items are being picked up or await pickup
- **Important**: Order remains 'ready' as garments are progressively picked up, until ALL are 'Done'

### Status: `completed`

- **Condition**: All garments are in 'Done' stage
- **Meaning**: All garments have been picked up/delivered

## Garment Stage Rules

Garment stages are automatically updated based on service completion:

1. **New**: No services completed
2. **In Progress**: Some services completed (when garment has multiple services)
3. **Ready For Pickup**:
   - Single service completed, OR
   - All services completed (for garments with multiple services)
4. **Done**: Garment has been picked up (set via `mark_garment_picked_up` function)

## Automatic Updates

The system uses PostgreSQL triggers to maintain consistency:

1. **Service Completion Trigger** (`update_garment_on_service_change`)
   - Fires when `is_done` is updated on any garment service
   - Updates the garment's stage based on service completion rules
   - Cascades to update the order status

2. **Garment Stage Trigger** (`update_order_on_garment_change`)
   - Fires when a garment's stage changes
   - Recalculates the order status based on all garments in the order

## Database Implementation

### Key Functions

```sql
-- Calculate order status based on garment stages
calculate_order_status(p_order_id UUID) RETURNS order_status

-- Update garment stage when services are marked complete
update_garment_stage_from_services() RETURNS TRIGGER

-- Update order status when garment stages change
update_order_status_from_garments() RETURNS TRIGGER

-- Mark a garment as picked up (moves to Done stage)
mark_garment_picked_up(p_garment_id UUID) RETURNS void
```

### Migration Files

- `20241230_update_order_status_enum.sql` - Creates the order_status enum type
- `20241230_order_status_business_rules.sql` - Implements the business logic

## TypeScript Types

```typescript
export type OrderStatus =
  | 'new' // No work started
  | 'active' // Work in progress
  | 'ready' // Ready for pickup
  | 'completed' // All picked up
  | 'cancelled'; // Manually cancelled
```

## Example Workflow

Consider an order with 3 garments:

1. **Initial State**: All 3 garments are 'New'
   - Order Status: **`new`**

2. **Work Begins**: 1 garment moves to 'In Progress'
   - Order Status: **`active`** (mixed states)

3. **First Item Ready**: 1 garment becomes 'Ready For Pickup', others still 'New' or 'In Progress'
   - Order Status: **`active`** (mixed states)

4. **All Work Complete**: All 3 garments are 'Ready For Pickup'
   - Order Status: **`ready`**

5. **Partial Pickup**: Customer picks up 1 garment (moves to 'Done'), 2 remain 'Ready For Pickup'
   - Order Status: **`ready`** (still has items to pick up)

6. **More Pickup**: Customer picks up another garment, 1 remains 'Ready For Pickup'
   - Order Status: **`ready`** (still has 1 item to pick up)

7. **Final Pickup**: Last garment is picked up (all 3 are now 'Done')
   - Order Status: **`completed`**

## Important Notes

1. **Decoupled from Payments**: Order status no longer reflects payment status. Payment tracking is handled separately through the invoice system.

2. **Automatic Management**: Order status is automatically managed by database triggers. Manual updates should only be done for cancellation.

3. **Consistency**: The triggers ensure order status always reflects the actual state of garment work progress.

4. **Performance**: Status calculation is efficient as it only counts garment stages, not complex payment calculations.

## Testing

To verify the order status logic:

```sql
-- View current order statuses with garment breakdowns
SELECT
    o.order_number,
    o.status,
    COUNT(g.id) as total_garments,
    COUNT(g.id) FILTER (WHERE g.stage = 'New') as new,
    COUNT(g.id) FILTER (WHERE g.stage = 'In Progress') as in_progress,
    COUNT(g.id) FILTER (WHERE g.stage = 'Ready For Pickup') as ready,
    COUNT(g.id) FILTER (WHERE g.stage = 'Done') as done
FROM orders o
LEFT JOIN garments g ON o.id = g.order_id
GROUP BY o.id, o.order_number, o.status;
```

## Migration from Old System

The migration automatically:

1. Maps old payment-based statuses to new workflow-based statuses
2. Sets up triggers for automatic status management
3. Recalculates all existing order statuses based on garment stages

Old → New Status Mapping:

- `pending` → `new`
- `partially_paid` → `active`
- `paid` → `completed`
- `cancelled` → `cancelled`
