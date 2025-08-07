# Calendar Refactoring Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the calendar refactoring to support hundreds of thousands of appointments using time-range queries, React Query, and sliding window fetching.

## Prerequisites

### 1. Install Dependencies

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools react-hot-toast
```

### 2. Update TypeScript Types

Add to `package.json`:

```json
{
  "devDependencies": {
    "@tanstack/react-query": "^5.17.0",
    "@tanstack/react-query-devtools": "^5.17.0",
    "react-hot-toast": "^2.4.1"
  }
}
```

## Implementation Steps

### Phase 1: Database Optimization (Day 1-2)

1. **Run the migration to optimize indexes:**

   ```bash
   npx supabase db push
   ```

2. **Verify indexes are created:**

   ```sql
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename = 'appointments'
   ORDER BY indexname;
   ```

3. **Test the new database functions:**

   ```sql
   -- Test time-range query
   SELECT * FROM get_appointments_time_range(
     'your-shop-id'::uuid,
     '2024-01-01'::date,
     '2024-01-31'::date,
     false
   );

   -- Test appointment counts
   SELECT * FROM get_appointment_counts_by_date(
     'your-shop-id'::uuid,
     '2024-01-01'::date,
     '2024-01-31'::date
   );
   ```

### Phase 2: React Query Setup (Day 3-4)

1. **Update the root layout:**
   - Replace `src/app/layout.tsx` with `src/app/layout-refactored.tsx`
   - Delete the old layout file
   - Rename the refactored file to `layout.tsx`

2. **Add React Query provider:**
   - The QueryProvider is already created in `src/providers/QueryProvider.tsx`
   - It includes optimized configuration for calendar use case

3. **Verify React Query DevTools:**
   - In development, you should see the React Query DevTools in bottom-right
   - Use it to monitor cache state and query performance

### Phase 3: Calendar Component Migration (Day 5-7)

1. **Update the appointments page:**

   ```bash
   # Backup the original
   cp src/app/(app)/appointments/page.tsx src/app/(app)/appointments/page.backup.tsx

   # Replace with refactored version
   mv src/app/(app)/appointments/page-refactored.tsx src/app/(app)/appointments/page.tsx
   ```

2. **Update the appointments client:**

   ```bash
   # Backup the original
   cp src/app/(app)/appointments/AppointmentsClient.tsx src/app/(app)/appointments/AppointmentsClient.backup.tsx

   # Replace with refactored version
   mv src/app/(app)/appointments/AppointmentsClientRefactored.tsx src/app/(app)/appointments/AppointmentsClient.tsx
   ```

3. **Import the new calendar component in AppointmentsClient:**
   ```typescript
   import { CalendarWithQuery } from '@/components/appointments/CalendarWithQuery';
   ```

### Phase 4: Server Actions Migration (Day 8-9)

1. **Add the new appointments actions:**
   - Keep the original `appointments.ts` for backward compatibility
   - Gradually migrate to `appointments-refactored.ts`

2. **Update imports in components:**

   ```typescript
   // Old
   import { getAppointments } from '@/lib/actions/appointments';

   // New
   import { getAppointmentsByTimeRange } from '@/lib/actions/appointments-refactored';
   ```

### Phase 5: Testing & Performance Tuning (Day 10-12)

1. **Load Testing Setup:**

   ```typescript
   // scripts/seed-appointments-bulk.ts
   import { createClient } from '@/lib/supabase/server';

   async function seedBulkAppointments(count: number) {
     const supabase = await createClient();
     const batchSize = 1000;

     for (let i = 0; i < count; i += batchSize) {
       const appointments = Array.from(
         { length: Math.min(batchSize, count - i) },
         (_, j) => ({
           shop_id: 'your-shop-id',
           title: `Test Appointment ${i + j}`,
           date: generateRandomDate(),
           start_time: generateRandomTime(),
           end_time: generateEndTime(),
           type: 'consultation',
           status: 'scheduled',
         })
       );

       await supabase.from('appointments').insert(appointments);
       console.log(`Inserted ${i + batchSize} appointments`);
     }
   }

   // Seed 100k appointments
   seedBulkAppointments(100000);
   ```

2. **Performance Monitoring:**

   ```typescript
   // Add to CalendarWithQuery component
   useEffect(() => {
     const startTime = performance.now();

     return () => {
       const loadTime = performance.now() - startTime;
       console.log(`Calendar rendered in ${loadTime}ms`);

       // Send to analytics
       if (window.analytics) {
         window.analytics.track('calendar_performance', {
           view,
           loadTime,
           appointmentCount: appointments.length,
         });
       }
     };
   }, [appointments, view]);
   ```

3. **Cache Hit Rate Monitoring:**
   ```typescript
   // Add to QueryProvider
   queryClient.getQueryCache().subscribe((event) => {
     if (event.type === 'observerResultsUpdated') {
       const cacheHit = !event.query.state.isFetching && event.query.state.data;
       console.log(`Query ${cacheHit ? 'HIT' : 'MISS'}:`, event.query.queryKey);
     }
   });
   ```

## Testing Strategy

### Unit Tests

```typescript
// src/__tests__/queries/appointment-queries.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppointmentsTimeRange } from '@/lib/queries/appointment-queries';

describe('Appointment Queries', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    return ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  it('should fetch appointments for time range', async () => {
    const { result } = renderHook(
      () => useAppointmentsTimeRange('shop-id', '2024-01-01', '2024-01-31', 'month'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it('should cache results', async () => {
    const wrapper = createWrapper();

    // First render
    const { result: result1 } = renderHook(
      () => useAppointmentsTimeRange('shop-id', '2024-01-01', '2024-01-31', 'month'),
      { wrapper }
    );

    await waitFor(() => expect(result1.current.isSuccess).toBe(true));

    // Second render should use cache
    const { result: result2 } = renderHook(
      () => useAppointmentsTimeRange('shop-id', '2024-01-01', '2024-01-31', 'month'),
      { wrapper }
    );

    expect(result2.current.isSuccess).toBe(true);
    expect(result2.current.isFetching).toBe(false);
  });
});
```

### E2E Tests

```typescript
// src/__tests__/e2e/calendar-performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Calendar Performance', () => {
  test('should load month view in under 500ms', async ({ page }) => {
    await page.goto('/appointments');

    const startTime = Date.now();
    await page.waitForSelector('[data-testid="calendar-month-view"]');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(500);
  });

  test('should navigate between months without loading spinner', async ({
    page,
  }) => {
    await page.goto('/appointments');
    await page.waitForSelector('[data-testid="calendar-month-view"]');

    // Click next month
    await page.click('[data-testid="calendar-next-button"]');

    // Should not show loading spinner
    const spinner = await page
      .locator('[data-testid="calendar-loading"]')
      .isVisible();
    expect(spinner).toBe(false);
  });

  test('should prefetch adjacent windows', async ({ page }) => {
    await page.goto('/appointments');

    // Monitor network requests
    const requests = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/appointments/time-range')) {
        requests.push(request.url());
      }
    });

    // Wait for initial load
    await page.waitForSelector('[data-testid="calendar-month-view"]');

    // Should have prefetched adjacent months
    await page.waitForTimeout(1000);
    expect(requests.length).toBeGreaterThanOrEqual(3); // Current + prev + next
  });
});
```

## Performance Benchmarks

### Target Metrics

| Metric         | Target      | Measurement Method  |
| -------------- | ----------- | ------------------- |
| Initial Load   | < 500ms     | Performance.now()   |
| Navigation     | < 50ms      | No spinner visible  |
| Cache Hit Rate | > 80%       | Query cache monitor |
| Memory Usage   | < 50MB      | Chrome DevTools     |
| Query Time     | < 100ms p95 | Supabase Analytics  |

### Monitoring Dashboard

Create a dashboard to track:

1. Average query response times
2. Cache hit rates by view type
3. User navigation patterns
4. Error rates and types
5. Memory usage over time

## Rollout Strategy

### Stage 1: Internal Testing (Week 1)

- Deploy to staging environment
- Run load tests with 100k+ appointments
- Monitor performance metrics

### Stage 2: Beta Users (Week 2)

- Enable for 10% of users via feature flag
- Monitor error rates and performance
- Gather user feedback

### Stage 3: Gradual Rollout (Week 3-4)

- Increase to 50% of users
- A/B test performance improvements
- Monitor system load

### Stage 4: Full Release (Week 5)

- Enable for all users
- Remove old implementation
- Archive backup code

## Troubleshooting

### Common Issues

1. **Slow Queries**
   - Check if indexes are being used: `EXPLAIN ANALYZE` query
   - Verify RLS policies aren't causing performance issues
   - Consider partitioning for very large datasets

2. **Cache Misses**
   - Verify query keys are consistent
   - Check stale time configuration
   - Monitor prefetch timing

3. **Memory Issues**
   - Implement more aggressive garbage collection
   - Reduce cache time for older queries
   - Limit concurrent queries

4. **Optimistic Update Conflicts**
   - Ensure proper error handling in mutations
   - Implement retry logic with exponential backoff
   - Show clear error messages to users

## Future Enhancements

1. **Real-time Updates**
   - Integrate Supabase Realtime for live updates
   - Implement WebSocket-based cache invalidation
   - Add collaborative features

2. **Advanced Caching**
   - Implement persistent cache with IndexedDB
   - Add offline support with service workers
   - Smart cache warming based on user patterns

3. **Performance Optimizations**
   - Virtual scrolling for list views
   - Web Workers for data processing
   - Edge caching with CDN integration

## Conclusion

This refactoring provides a solid foundation for scaling to hundreds of thousands of appointments while maintaining excellent performance. The sliding window pattern with React Query provides predictable performance characteristics and a great user experience.
