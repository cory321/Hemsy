# Timezone UTC Migration Plan

## Current State Analysis

### Database Schema Issues

1. **Timestamps** - Good ✅
   - Most timestamps use `timestamptz` (stores in UTC)
   - Examples: `created_at`, `updated_at`, `paid_at`, etc.

2. **Problematic Date/Time Fields** - Need Migration ❌
   - `appointments.date` (date) + `appointments.start_time/end_time` (time without timezone)
   - `orders.order_due_date` (date)
   - `garments.event_date` and `garments.due_date` (date)
   - `shop_hours.open_time/close_time` (time without timezone)

3. **Missing Timezone Storage** - Need to Add ❌
   - No timezone field in `users` table
   - No timezone field in `shops` table

## Migration Strategy

### Phase 1: Add Timezone Storage

```sql
-- Add timezone to users table
ALTER TABLE users ADD COLUMN timezone TEXT DEFAULT 'America/New_York';
ALTER TABLE users ADD COLUMN timezone_offset INTEGER; -- Minutes from UTC

-- Add timezone to shops table
ALTER TABLE shops ADD COLUMN timezone TEXT DEFAULT 'America/New_York';
ALTER TABLE shops ADD COLUMN timezone_offset INTEGER; -- Minutes from UTC
```

### Phase 2: Migrate Existing Data

1. **Appointments** - Convert to timestamptz

   ```sql
   -- Add new UTC columns
   ALTER TABLE appointments ADD COLUMN start_datetime timestamptz;
   ALTER TABLE appointments ADD COLUMN end_datetime timestamptz;

   -- Migrate existing data (assuming shop timezone)
   UPDATE appointments a
   SET start_datetime = (a.date + a.start_time)::timestamptz AT TIME ZONE s.timezone,
       end_datetime = (a.date + a.end_time)::timestamptz AT TIME ZONE s.timezone
   FROM shops s
   WHERE a.shop_id = s.id;
   ```

2. **Orders & Garments** - Convert dates to timestamptz

   ```sql
   -- Add UTC columns
   ALTER TABLE orders ADD COLUMN order_due_datetime timestamptz;
   ALTER TABLE garments ADD COLUMN event_datetime timestamptz;
   ALTER TABLE garments ADD COLUMN due_datetime timestamptz;

   -- Migrate with noon in shop timezone
   UPDATE orders o
   SET order_due_datetime = (o.order_due_date::timestamp + TIME '12:00:00')::timestamptz AT TIME ZONE s.timezone
   FROM shops s
   WHERE o.shop_id = s.id AND o.order_due_date IS NOT NULL;
   ```

3. **Shop Hours** - Keep as-is but interpret in shop timezone

## Code Changes Required

### 1. Onboarding Process

- Detect user timezone using `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Show confirmation dialog during onboarding
- Save to database

### 2. Date/Time Utilities

- All dates/times stored as UTC in database
- Convert to user/shop timezone for display
- Use date-fns-tz for timezone conversions

### 3. Components to Update

#### High Priority (User-facing dates/times):

- `/src/components/appointments/*` - All appointment components
- `/src/components/orders/*` - Order cards and forms
- `/src/components/garments/*` - Garment cards
- `/src/components/dashboard/*` - Dashboard displays
- `/src/components/calendar/*` - Calendar views

#### Server Actions:

- `/src/lib/actions/appointments.ts` - Create/update appointments in UTC
- `/src/lib/actions/orders.ts` - Due dates in UTC
- `/src/lib/actions/garments.ts` - Event/due dates in UTC
- `/src/lib/actions/dashboard.ts` - Query adjustments

#### Utilities:

- `/src/lib/utils/date-time-utils.ts` - Core conversion functions
- `/src/lib/utils/calendar.ts` - Calendar logic
- `/src/lib/utils/overdue-logic.ts` - Timezone-aware comparisons

## Implementation Steps

### Step 1: Database Migration

1. Add timezone columns to users and shops
2. Create migration for existing data
3. Add new UTC columns for appointments, orders, garments

### Step 2: Core Utilities

1. Create timezone-aware date utilities
2. Add conversion functions (UTC ↔ Local)
3. Update comparison functions

### Step 3: Onboarding

1. Add timezone detection
2. Create timezone confirmation UI
3. Save to database

### Step 4: Update Components

1. Start with read-only displays
2. Then update forms/inputs
3. Finally update server actions

### Step 5: Data Migration

1. Backfill timezones for existing users/shops
2. Convert existing dates/times to UTC
3. Switch to new columns

## Key Functions Needed

```typescript
// Core timezone utilities
function convertUTCToUserTime(utcDate: Date, timezone: string): Date;
function convertUserTimeToUTC(localDate: Date, timezone: string): Date;
function formatInTimezone(date: Date, timezone: string, format: string): string;
function parseInTimezone(dateStr: string, timezone: string): Date;

// Business logic
function getShopTimezone(shopId: string): Promise<string>;
function getUserTimezone(userId: string): Promise<string>;
function isDateTimeInPastForTimezone(date: Date, timezone: string): boolean;
```

## Testing Strategy

1. **Unit Tests**: Timezone conversion functions
2. **Integration Tests**: Database operations with timezones
3. **E2E Tests**: User flows across timezones
4. **Manual Testing**:
   - PST user creating appointments
   - EST shop viewing appointments
   - UTC server processing

## Rollback Plan

1. Keep old columns during migration
2. Dual-write to both old and new columns
3. Feature flag for timezone-aware code
4. Easy revert if issues arise
