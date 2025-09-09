# Phase 4: Query Hooks & Server Actions Implementation

**Duration**: 45 minutes  
**Priority**: HIGH - Core data fetching layer

## Objective

Verify and test the React Query hooks and server actions for efficient data fetching with sliding window pattern.

## Prerequisites

- Phase 3 (React Query Integration) completed
- React Query DevTools working
- Database migration applied

## Implementation Steps

### 1. Verify Query Hooks File (10 minutes)

Check the hooks at: `/Users/corywilliams/Hemsy/src/lib/queries/appointment-queries.ts`

Key hooks to verify:

- `useAppointmentsTimeRange()` - Main time-range query
- `useAppointmentsForMonth()` - Month view specific
- `useAppointmentsForWeek()` - Week view specific
- `useAppointmentsForDay()` - Day view specific
- `usePrefetchAdjacentWindows()` - Background prefetching
- `useCreateAppointment()` - Mutation with optimistic updates

### 2. Update Import Paths (10 minutes)

The query hooks import from `appointments.ts` but need functions from `appointments-refactored.ts`.

**Option A: Update imports in appointment-queries.ts**

```typescript
// In src/lib/queries/appointment-queries.ts
// Change line ~6:
import {
  getAppointmentsByTimeRange,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentCounts,
} from '@/lib/actions/appointments-refactored';
```

**Option B: Add new functions to original file**

```bash
# Copy new functions to original file
# This allows gradual migration
```

### 3. Test Server Actions (10 minutes)

Verify the refactored server actions at: `/Users/corywilliams/Hemsy/src/lib/actions/appointments-refactored.ts`

Test the time-range function:

```typescript
// Create test file: src/test-server-actions.ts
import { getAppointmentsByTimeRange } from '@/lib/actions/appointments-refactored';

async function testServerAction() {
  try {
    const result = await getAppointmentsByTimeRange(
      'your-shop-id',
      '2024-01-01',
      '2024-01-31'
    );
    console.log('Appointments found:', result.length);
    console.log('First appointment:', result[0]);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run with: npm run dev and navigate to a page that calls this
```

### 4. Verify Edge Runtime Route (10 minutes)

Check the API route at: `/Users/corywilliams/Hemsy/src/app/api/appointments/time-range/route.ts`

Test the endpoint:

```bash
# With the dev server running, test the API
curl "http://localhost:3000/api/appointments/time-range?shopId=YOUR_SHOP_ID&startDate=2024-01-01&endDate=2024-01-31"

# Should return JSON array of appointments
```

### 5. Test Query Hook Integration (10 minutes)

Create a test component:

```typescript
// src/components/test-appointment-query.tsx
'use client';

import { useAppointmentsForMonth } from '@/lib/queries/appointment-queries';

export function TestAppointmentQuery({ shopId }: { shopId: string }) {
  const { data, isLoading, error } = useAppointmentsForMonth(
    shopId,
    2024,
    1 // January
  );

  if (isLoading) return <div>Loading appointments...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h3>Appointments: {data?.length || 0}</h3>
      <pre>{JSON.stringify(data?.[0], null, 2)}</pre>
    </div>
  );
}
```

## Files to Review

- `/src/lib/queries/appointment-queries.ts` - All React Query hooks
- `/src/lib/queries/appointment-keys.ts` - Type-safe query keys
- `/src/lib/actions/appointments-refactored.ts` - Server actions
- `/src/app/api/appointments/time-range/route.ts` - Edge API route

## Verification Checklist

- [ ] Import paths resolved (either Option A or B)
- [ ] No TypeScript errors in query files
- [ ] Server actions return correct data format
- [ ] Edge API route responds with proper caching headers
- [ ] Test component shows appointments
- [ ] React Query DevTools shows cached queries

## Testing Scenarios

### 1. Test Prefetching

```typescript
// Add to a calendar component
import { usePrefetchAdjacentWindows } from '@/lib/queries/appointment-queries';

// This should trigger 3 queries (previous, current, next)
usePrefetchAdjacentWindows(shopId, currentDate, 'month');

// Check DevTools - should see 3 queries in cache
```

### 2. Test Optimistic Updates

```typescript
// Test the create mutation
const createMutation = useCreateAppointment();

// Create appointment
createMutation.mutate({
  title: 'Test Appointment',
  date: '2024-01-15',
  startTime: '10:00',
  endTime: '11:00',
  type: 'consultation',
});

// Should immediately show in UI before server confirms
```

### 3. Test Cache Invalidation

After creating/updating/deleting, verify:

- Affected time ranges are invalidated
- UI updates automatically
- No stale data shown

## Performance Checks

Monitor in React Query DevTools:

- Query execution time (should be < 100ms for cached)
- Number of active queries (should be ~3-5 max)
- Cache hit rate (should increase over time)
- Background refetch behavior

## Success Criteria

- All query hooks working without errors
- Prefetching triggers for adjacent windows
- Mutations include optimistic updates
- Edge API returns proper cache headers
- TypeScript types fully satisfied

## Troubleshooting

### Issue: Import errors

```bash
# Ensure appointments-refactored.ts exports all needed functions
# Check function names match between files
```

### Issue: Query not caching

```typescript
// Check query keys are consistent
console.log('Query key:', appointmentKeys.timeRange(shopId, start, end));
// Keys must be identical for cache hits
```

### Issue: Prefetch not working

```typescript
// Add logging to prefetch hook
console.log('Prefetching for:', currentDate, view);
// Check DevTools for pending queries
```

## Next Phase

With queries working, proceed to Phase 5: UI Components Migration

## Notes for Implementation Agent

- Keep React Query DevTools open while testing
- Monitor Network tab for unnecessary requests
- Test with both empty and large datasets
- Verify optimistic updates feel instant
