# Dashboard Optimization Fixes Applied

## Changes Made to `dashboard-optimized.ts`

### 1. Payment Status Filtering

- **Changed**: From `.eq('status', 'completed')` to `.in('status', ['completed', 'partially_refunded'])`
- **Impact**: Now includes partially refunded payments in revenue calculations

### 2. Refund Handling

- **Changed**: Added `refunded_amount_cents` to payment selections and calculations
- **Impact**: Revenue is now calculated as `amount_cents - refunded_amount_cents`

### 3. Date Field Alignment

- **Changed**: From `processed_at` to `created_at` for all payment queries
- **Impact**: Matches the original implementation's date field usage

### 4. Unpaid Balance Calculation

- **Changed**: From invoice-based to order-based calculation
- **Impact**: Now shows 16 unpaid orders (matching original) instead of 17 unpaid invoices

## Expected Results

With these changes, your localhost should now show values closer to the remote server:

### MTD (Sep 1-8/9)

- Should show higher revenue (~$3,222.50 when including Sep 9 data)
- Calculation now includes partially_refunded payments
- Properly subtracts refund amounts

### Unpaid Balance

- Should show 16 orders (not 17)
- Should show ~$4,715.02 unpaid balance
- Matches the original order-based calculation

### 30-Day Rolling

- Should show higher revenue with partially_refunded payments included
- Properly accounts for refunds

## Note on Timezone

The shop is now configured for Pacific timezone (America/Los_Angeles), so the date discrepancy between Sep 1-8 (local) vs Sep 1-9 (remote) should be resolved if both environments are using the same timezone.

## Verification

After restarting your dev server, the business health calculations should match the remote server values.
