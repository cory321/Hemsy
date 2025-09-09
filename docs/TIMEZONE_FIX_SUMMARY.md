# Timezone Fix for Dashboard Calculations

## Problem Identified

The discrepancy between localhost and remote server dashboard values was caused by **timezone differences in date calculations**:

### Root Cause

1. **Server Environment**: Remote server runs in UTC or Eastern timezone
2. **Client Environment**: Your localhost runs in Pacific timezone
3. **Date Calculation Issue**: Both implementations used `new Date()` which creates dates in the **server's timezone**, not the shop's business timezone

### Impact

- Remote server (UTC/Eastern): Shows Sep 1-9 data → includes Sep 9 payments ($2,146)
- Localhost (Pacific): Shows Sep 1-8 data → excludes Sep 9 payments
- Result: ~$2,400 difference in revenue calculations

## Solution Implemented

### 1. Shop Timezone Integration ✅

Updated both `dashboard.ts` and `dashboard-optimized.ts` to:

```typescript
// Get shop's configured timezone
const shopTimezone = await getShopTimezone(shop.id);

// Use shop timezone for all date calculations
const shopNow = toZonedTime(now, shopTimezone);
const currentDay = shopNow.getDate();
const currentMonth = shopNow.getMonth();
```

### 2. Consistent Date Ranges ✅

Now both environments will calculate dates from the **shop's perspective**:

- Shop in Pacific → Sep 1-8 (11:13 PM = still Sep 8)
- Shop in Eastern → Sep 1-9 (2:13 AM = now Sep 9)

### 3. Benefits

- **Consistent Results**: Same shop = same date ranges regardless of server location
- **Business Logic**: Dates reflect the shop's actual business hours/timezone
- **User Expectation**: Dashboard shows data from shop owner's perspective

## Files Modified

1. **`src/lib/actions/dashboard-optimized.ts`**
   - Added timezone imports
   - Use `getShopTimezone()` and `toZonedTime()`
   - Calculate all dates in shop timezone

2. **`src/lib/actions/dashboard.ts`**
   - Added same timezone logic to original implementation
   - Ensures both versions are consistent

## Expected Results

After this fix:

- **Localhost and remote will show identical values** for the same shop
- **Date ranges will reflect shop's business timezone** (not server timezone)
- **"Sep 1-8" vs "Sep 1-9" discrepancy resolved** - both will show the same range based on shop time

## Testing

To verify the fix:

1. Check that localhost dashboard matches remote server values
2. Verify date ranges show consistent periods (e.g., both show "Sep 1-9" if shop is in Eastern time)
3. Confirm timezone changes in shop settings affect dashboard date calculations appropriately
