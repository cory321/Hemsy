# Dashboard Business Health Calculation Analysis

## Executive Summary

The discrepancy in business health calculations between your local environment (with optimized changes) and the remote server (previous commit) is caused by several key differences in the implementation. Most critically, there appears to be a date mismatch issue where the database contains data from 2025 while the JavaScript code might be calculating based on 2024 dates.

## Key Differences Found

### 1. Date Handling (CRITICAL ISSUE)

**Original Implementation (`dashboard.ts`):**

```typescript
// Uses toISOString() which converts to UTC
.gte('created_at', firstDayThisMonth.toISOString())
.lt('created_at', endOfTodayThisMonth.toISOString())
```

**Optimized Implementation (`dashboard-optimized.ts`):**

```typescript
// Uses formatDateForDatabase which preserves local timezone
.gte('processed_at', monthStartStr)
.lte('processed_at', todayStr)
```

**Impact:**

- `toISOString()` converts dates to UTC, which can shift dates by up to 24 hours depending on timezone
- `formatDateForDatabase()` preserves local timezone dates
- This can cause queries to include/exclude data at date boundaries

### 2. Payment Date Field Differences

**Original:** Uses `created_at` field for payment date filtering
**Optimized:** Uses `processed_at` field for payment date filtering

**Impact:** These fields may have different values, causing different payments to be included in calculations.

### 3. Payment Status Filtering

**Original Implementation:**

```typescript
.in('status', ['completed', 'partially_refunded'])
```

**Optimized Implementation:**

```typescript
.eq('status', 'completed')
```

**Impact:** The optimized version excludes `partially_refunded` payments, which will result in lower revenue numbers.

### 4. Unpaid Balance Calculation

**Original Implementation:**

- Queries the `orders` table
- Calculates unpaid based on `order.total_cents` minus payments from associated invoices
- Counts unpaid orders

**Optimized Implementation:**

- Queries the `invoices` table directly
- Calculates unpaid based on `invoice.amount_cents` minus payments
- Counts unpaid invoices

**Impact:** Orders and invoices may not have a 1:1 relationship, leading to different counts and amounts.

### 5. Date Range Operators

**Original:** Uses `.gte()` and `.lt()` (inclusive start, exclusive end)
**Optimized:** Uses `.gte()` and `.lte()` (inclusive start, inclusive end)

**Impact:** The optimized version includes one extra day of data.

## Database Date Issue

The database contains data from 2025 (confirmed via SQL query showing current date as 2025-09-09), while the calculations appear to be looking for 2024 data. This temporal mismatch is likely the primary cause of the dramatic difference in values.

## Specific Value Differences

### Local (Optimized):

- MTD: Sep 1-8, $791.50
- 30d: Aug 10 - Sep 8, $4,466.53
- Unpaid Balance: $1,834.00, 17 orders

### Remote (Original):

- MTD: Sep 1-9, $3,222.50
- 30d: Aug 10 - Sep 9, $7,032.53
- Unpaid Balance: $4,715.02, 16 orders

## Recommendations

1. **Immediate Fix for Date Issue:**
   - Ensure both implementations are querying the same year
   - Check if there's a year offset being applied somewhere

2. **Standardize Date Handling:**
   - Use consistent date formatting across both implementations
   - Consider timezone implications carefully

3. **Align Payment Queries:**
   - Decide whether to use `created_at` or `processed_at` consistently
   - Include the same payment statuses in both queries

4. **Unify Unpaid Balance Logic:**
   - Choose either orders-based or invoices-based calculation
   - Ensure the counting logic matches (orders vs invoices)

5. **Test with Consistent Data:**
   - Verify both environments are connected to the same database
   - Check for any data sync issues between environments

## Root Cause Analysis

After thorough investigation, the primary cause of the discrepancy is **timezone handling differences**:

1. **Shop Configuration:** Samantha Williams's Shop is configured for Eastern timezone (America/New_York)
2. **User Location:** You're in Pacific timezone (3 hours behind Eastern)
3. **The Problem:**
   - When it's 11:13 PM on Sep 8 in Pacific time
   - It's already 2:13 AM on Sep 9 in Eastern time
   - The remote server uses the shop's Eastern timezone, showing "Sep 1-9" data
   - Your localhost uses your browser's Pacific timezone, showing "Sep 1-8" data
   - This causes different date ranges and different revenue calculations

## Immediate Action Items

1. **Fix Timezone Handling:**
   - The dashboard should use the shop's configured timezone (Eastern) for all date calculations
   - Currently, it's using the browser's local timezone (Pacific in your case)
   - This needs to be fixed to ensure consistent calculations across all environments

2. **Code Changes Already Made:**
   - ✅ **Payment Status:** Updated to include `partially_refunded` payments
   - ✅ **Refund Handling:** Now properly subtracts refunded amounts
   - ✅ **Date Fields:** Switched back to `created_at` to match original implementation
   - ⚠️ **Timezone:** Still needs to be fixed to use shop timezone instead of browser timezone

3. **Proposed Timezone Fix:**
   - Use the shop's timezone setting from the database
   - Convert all date calculations to use the shop's timezone
   - This ensures Sep 1-9 shows the same data regardless of where you access it from

## Conclusion

The discrepancy in business health calculations is primarily caused by **timezone differences**:

- The shop is configured for Eastern timezone
- Your browser is in Pacific timezone (3 hours behind)
- This causes the dashboard to show different date ranges (Sep 1-8 vs Sep 1-9)
- Sep 9 alone has $2,146.00 in revenue, explaining the ~$2,400 difference

The code changes already made (including partially_refunded payments and proper refund handling) have improved accuracy, but the timezone issue remains the main cause of the discrepancy. To fully resolve this, the dashboard needs to use the shop's configured timezone for all date calculations, not the browser's local timezone.
