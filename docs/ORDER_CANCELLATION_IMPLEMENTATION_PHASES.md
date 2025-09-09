# Order Cancellation Implementation Phases

## Overview

This document outlines the phased approach to implementing order cancellation functionality in Hemsy. The implementation is divided into 6 phases to ensure systematic development with proper testing at each stage.

## Phase 0: Database Schema Updates (No migrations needed)

### Status: ✅ Already Supported

The database already supports order cancellation:

- `orders` table has `status` enum with 'cancelled' value
- Automatic status calculation via triggers (except for manual cancellation)
- All required fields exist

### Verification Tasks

- [ ] Confirm `cancelled` status in order_status enum
- [ ] Verify RLS policies handle cancelled orders correctly
- [ ] Test trigger behavior with cancelled status

## Phase 1: Core Server Actions

### 1.1 Create Cancel Order Action

```typescript
// src/lib/actions/orders-cancellation.ts

interface CancelOrderInput {
  orderId: string;
  cancellationReason?: string; // Optional
  cancelledBy?: string; // Defaults to current user
}

interface CancelOrderResult {
  success: boolean;
  order?: Order;
  error?: string;
}

export async function cancelOrder(
  input: CancelOrderInput
): Promise<CancelOrderResult>;
```

**Implementation Details:**

- Verify order exists and belongs to current user
- Check order is not already cancelled or completed
- Update order status to 'cancelled'
- Log cancellation details
- Return updated order

### 1.2 Create Restore Order Action

```typescript
interface RestoreOrderInput {
  orderId: string;
  restoredBy?: string; // Defaults to current user
}

interface RestoreOrderResult {
  success: boolean;
  order?: Order;
  calculatedStatus?: OrderStatus;
  error?: string;
}

export async function restoreOrder(
  input: RestoreOrderInput
): Promise<RestoreOrderResult>;
```

**Implementation Details:**

- Verify order is currently cancelled
- Trigger status recalculation based on garment stages
- Log restoration details
- Return updated order with new status

### 1.3 Create Service Modification Check

```typescript
export async function canModifyGarmentServices(
  garmentId: string
): Promise<boolean>;
```

**Implementation Details:**

- Check if garment's order is cancelled
- Return false if cancelled, true otherwise
- Use in all service modification endpoints

### Testing Requirements

- [ ] Unit tests for all server actions
- [ ] Integration tests with Supabase
- [ ] Error handling for edge cases
- [ ] RLS policy verification

## Phase 2: Service Modification Prevention

### 2.1 Update Garment Service Actions

**Files to Update:**

- `src/lib/actions/garments.ts`
- `src/lib/actions/garment-services.ts`
- `src/lib/actions/services.ts`

**Add Guards to These Functions:**

```typescript
// Before any service modification
const canModify = await canModifyGarmentServices(garmentId);
if (!canModify) {
  return {
    success: false,
    error: 'Cannot modify services for cancelled orders',
  };
}
```

**Functions Requiring Guards:**

- `addServiceToGarment`
- `removeServiceFromGarment`
- `updateServiceCompletion`
- `addServicesToGarment` (bulk operation)
- `softDeleteService`
- `restoreService`

### 2.2 Create UI Feedback Helper

```typescript
export function getServiceModificationError(order: Order): string | null {
  if (order.status === 'cancelled') {
    return 'Services cannot be modified for cancelled orders';
  }
  return null;
}
```

### Testing Requirements

- [ ] Test service modification prevention
- [ ] Verify error messages display correctly
- [ ] Test bulk operations are blocked
- [ ] Ensure existing services remain viewable

## Phase 3: Order List Filtering

### 3.1 Update Order Queries

**File: `src/lib/actions/orders.ts`**

```typescript
interface GetOrdersOptions {
  includeCancelled?: boolean;
  onlyCancelled?: boolean;
  // ... existing options
}

// Update getOrders to filter by default
export async function getOrders(options: GetOrdersOptions = {}) {
  const { includeCancelled = false, onlyCancelled = false } = options;

  let query = supabase.from('orders')...;

  if (onlyCancelled) {
    query = query.eq('status', 'cancelled');
  } else if (!includeCancelled) {
    query = query.neq('status', 'cancelled');
  }

  // ... rest of query
}
```

### 3.2 Update Client Order List

**File: `src/lib/actions/clients.ts`**

```typescript
// Update getClientOrders to exclude cancelled by default
export async function getClientOrders(
  clientId: string,
  includeCancelled = false
) {
  let query = supabase.from('orders').eq('client_id', clientId);

  if (!includeCancelled) {
    query = query.neq('status', 'cancelled');
  }

  // ... rest of query
}
```

### 3.3 Update Garment Queries

**File: `src/lib/actions/garments.ts`**

```typescript
// Exclude garments from cancelled orders by default
export async function getGarments(options: GetGarmentsOptions = {}) {
  const { includeCancelled = false } = options;

  let query = supabase.from('garments').select(`
      *,
      order:orders!inner(
        id,
        status,
        order_number
      )
    `);

  if (!includeCancelled) {
    query = query.neq('order.status', 'cancelled');
  }

  // ... rest of query
}
```

### Testing Requirements

- [ ] Test default filtering excludes cancelled
- [ ] Test explicit include shows cancelled
- [ ] Test cancelled-only filter
- [ ] Verify performance with filters

## Phase 4: UI Components - Order Detail

### 4.1 Add Cancel/Restore Button to Order Detail

**File: `src/components/orders/OrderDetail.tsx`**

```typescript
interface OrderCancellationSectionProps {
  order: Order;
  onCancel: () => void;
  onRestore: () => void;
}

export function OrderCancellationSection({
  order,
  onCancel,
  onRestore
}: OrderCancellationSectionProps) {
  const canCancel = order.status !== 'completed' && order.status !== 'cancelled';
  const canRestore = order.status === 'cancelled';

  if (!canCancel && !canRestore) return null;

  return (
    <Box>
      {canCancel && (
        <Button onClick={onCancel} color="error">
          Cancel Order
        </Button>
      )}
      {canRestore && (
        <Button onClick={onRestore} color="primary">
          Restore Order
        </Button>
      )}
    </Box>
  );
}
```

### 4.2 Create Cancellation Dialog

**File: `src/components/orders/CancelOrderDialog.tsx`**

```typescript
interface CancelOrderDialogProps {
  open: boolean;
  order: Order;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export function CancelOrderDialog({
  open,
  order,
  onClose,
  onConfirm,
}: CancelOrderDialogProps) {
  // Show warnings based on order state
  // Optional reason input
  // Show financial impact
  // Confirm action
}
```

### 4.3 Update Garment Service UI

**File: `src/components/garments/GarmentServices.tsx`**

```typescript
// Disable add/remove buttons for cancelled orders
const isOrderCancelled = garment.order?.status === 'cancelled';

<Button
  disabled={isOrderCancelled}
  title={isOrderCancelled ? "Cannot modify services for cancelled orders" : undefined}
>
  Add Service
</Button>
```

### Testing Requirements

- [ ] Test cancel button appears correctly
- [ ] Test restore button replaces cancel
- [ ] Test dialog validation
- [ ] Test service buttons disable properly

## Phase 5: UI Components - List Views

### 5.1 Update Orders Page

**File: `src/app/(app)/orders/page.tsx`**

```typescript
// Add filter toggle for cancelled orders
const [showCancelled, setShowCancelled] = useState(false);
const [cancelledOnly, setCancelledOnly] = useState(false);

// Add filter UI
<ToggleButtonGroup>
  <ToggleButton value="active">Active Orders</ToggleButton>
  <ToggleButton value="cancelled">Cancelled Orders</ToggleButton>
  <ToggleButton value="all">All Orders</ToggleButton>
</ToggleButtonGroup>
```

### 5.2 Update Order Cards

**Files to Update:**

- `src/components/orders/OrderCardCompact.tsx`
- `src/components/orders/OrderCardDetailed.tsx`
- `src/components/orders/OrderCardMinimal.tsx`

**Add Cancelled Indicator:**

```typescript
{order.status === 'cancelled' && (
  <Chip
    label="CANCELLED"
    color="error"
    size="small"
    sx={{ opacity: 0.8 }}
  />
)}

// Apply visual treatment
<Card sx={{
  opacity: order.status === 'cancelled' ? 0.6 : 1,
  filter: order.status === 'cancelled' ? 'grayscale(50%)' : 'none'
}}>
```

### 5.3 Update Client Orders View

**File: `src/app/(app)/clients/[id]/page.tsx`**

```typescript
// Add toggle to show/hide cancelled orders
const [showCancelledOrders, setShowCancelledOrders] = useState(false);

// Update orders query
const orders = await getClientOrders(clientId, showCancelledOrders);
```

### Testing Requirements

- [ ] Test filter toggles work correctly
- [ ] Test visual indicators display
- [ ] Test performance with filters
- [ ] Test mobile responsiveness

## Phase 6: Testing & Polish

### 6.1 E2E Tests

**File: `src/__tests__/e2e/order-cancellation.test.ts`**

Test Scenarios:

- [ ] Cancel order with no work started
- [ ] Cancel order with work in progress
- [ ] Cancel order ready for pickup
- [ ] Attempt to cancel completed order
- [ ] Restore cancelled order
- [ ] Attempt service modifications on cancelled order
- [ ] Filter views include/exclude cancelled

### 6.2 Integration Tests

**File: `src/__tests__/integration/order-cancellation.test.ts`**

Test Cases:

- [ ] Server action authorization
- [ ] Database constraint validation
- [ ] RLS policy enforcement
- [ ] Trigger behavior with cancellation

### 6.3 Performance Optimization

- [ ] Add database indexes if needed
- [ ] Optimize queries with cancellation filters
- [ ] Test with large datasets
- [ ] Monitor query performance

### 6.4 Documentation Updates

- [ ] Update user documentation
- [ ] Add cancellation to feature tour
- [ ] Create help articles
- [ ] Update API documentation

## Implementation Timeline

| Phase   | Duration | Dependencies |
| ------- | -------- | ------------ |
| Phase 0 | 1 day    | None         |
| Phase 1 | 2 days   | Phase 0      |
| Phase 2 | 2 days   | Phase 1      |
| Phase 3 | 1 day    | Phase 1      |
| Phase 4 | 3 days   | Phases 1-3   |
| Phase 5 | 2 days   | Phase 4      |
| Phase 6 | 3 days   | Phases 1-5   |

**Total: ~14 days**

## Success Criteria

1. **Functionality**
   - Orders can be cancelled and restored
   - Service modifications are prevented on cancelled orders
   - Cancelled orders are hidden by default

2. **User Experience**
   - Clear visual indicators for cancelled orders
   - Intuitive cancellation flow with warnings
   - Easy filtering options

3. **Data Integrity**
   - All data preserved on cancellation
   - Audit trail maintained
   - No orphaned records

4. **Performance**
   - No degradation in query performance
   - Efficient filtering implementation
   - Responsive UI updates

5. **Testing**
   - 95%+ code coverage for new features
   - All E2E tests passing
   - No regression in existing features
