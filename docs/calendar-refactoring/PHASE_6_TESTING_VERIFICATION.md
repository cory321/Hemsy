# Phase 6: Testing & Verification

**Duration**: 90 minutes  
**Priority**: CRITICAL - Ensure production readiness

## Objective

Comprehensive testing of the refactored calendar system including unit tests, integration tests, E2E tests, and performance verification.

## Prerequisites

- Phases 1-5 completed successfully
- Calendar UI working with React Query
- Test database with sample data

## Implementation Steps

### 1. Create Test Data (15 minutes)

Create a seed script for testing:

```javascript
// scripts/seed-calendar-test-data.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function seedTestData() {
  const shopId = 'YOUR_TEST_SHOP_ID';
  const appointments = [];

  // Generate 1000 appointments across 3 months
  const startDate = new Date('2024-01-01');

  for (let i = 0; i < 1000; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + Math.floor(i / 10));

    const hour = 9 + (i % 8);
    appointments.push({
      shop_id: shopId,
      title: `Appointment ${i + 1}`,
      date: date.toISOString().split('T')[0],
      start_time: `${hour}:00:00`,
      end_time: `${hour + 1}:00:00`,
      type: 'consultation',
      status: 'scheduled',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // Insert in batches
  for (let i = 0; i < appointments.length; i += 100) {
    const batch = appointments.slice(i, i + 100);
    const { error } = await supabase.from('appointments').insert(batch);

    if (error) console.error('Error:', error);
    else console.log(`Inserted ${i + batch.length} appointments`);
  }
}

seedTestData();
```

Run the script:

```bash
node scripts/seed-calendar-test-data.js
```

### 2. Unit Tests (20 minutes)

Create/update test files:

```typescript
// src/__tests__/unit/queries/appointment-queries.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppointmentsTimeRange } from '@/lib/queries/appointment-queries';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Appointment Queries', () => {
  it('fetches appointments for time range', async () => {
    const { result } = renderHook(
      () => useAppointmentsTimeRange('shop-id', '2024-01-01', '2024-01-31'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
  });

  it('caches results properly', async () => {
    const wrapper = createWrapper();

    const { result: result1 } = renderHook(
      () => useAppointmentsTimeRange('shop-id', '2024-01-01', '2024-01-31'),
      { wrapper }
    );

    await waitFor(() => expect(result1.current.isSuccess).toBe(true));

    // Second call should use cache
    const { result: result2 } = renderHook(
      () => useAppointmentsTimeRange('shop-id', '2024-01-01', '2024-01-31'),
      { wrapper }
    );

    expect(result2.current.isSuccess).toBe(true);
    expect(result2.current.isFetching).toBe(false);
  });
});
```

Run tests:

```bash
npm test -- src/__tests__/unit/queries/appointment-queries.test.tsx
```

### 3. Integration Tests (20 minutes)

```typescript
// src/__tests__/integration/calendar-refactored.test.ts
import { getAppointmentsByTimeRange } from '@/lib/actions/appointments-refactored';
import { createClient } from '@/lib/supabase/server';

describe('Calendar Integration', () => {
  it('fetches appointments within date range', async () => {
    const appointments = await getAppointmentsByTimeRange(
      'test-shop-id',
      '2024-01-01',
      '2024-01-31'
    );

    expect(Array.isArray(appointments)).toBe(true);

    // Verify all appointments are within range
    appointments.forEach((apt) => {
      const date = new Date(apt.date);
      expect(date >= new Date('2024-01-01')).toBe(true);
      expect(date <= new Date('2024-01-31')).toBe(true);
    });
  });

  it('handles concurrent requests efficiently', async () => {
    const start = Date.now();

    // Make 5 concurrent requests
    const promises = Array(5)
      .fill(null)
      .map(() =>
        getAppointmentsByTimeRange('test-shop-id', '2024-01-01', '2024-01-31')
      );

    const results = await Promise.all(promises);
    const duration = Date.now() - start;

    // Should complete within reasonable time
    expect(duration).toBeLessThan(1000);

    // All should return same data
    results.forEach((result) => {
      expect(result.length).toBe(results[0].length);
    });
  });
});
```

### 4. E2E Tests (20 minutes)

```typescript
// src/__tests__/e2e/calendar-performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Calendar Performance', () => {
  test('loads month view quickly', async ({ page }) => {
    // Start timing
    const startTime = Date.now();

    await page.goto('/appointments');

    // Wait for calendar to render
    await page.waitForSelector('[data-testid="calendar-month-view"]');

    const loadTime = Date.now() - startTime;

    // Should load within 500ms
    expect(loadTime).toBeLessThan(500);
  });

  test('navigates without loading spinners', async ({ page }) => {
    await page.goto('/appointments');
    await page.waitForSelector('[data-testid="calendar-month-view"]');

    // Navigate to next month
    await page.click('[data-testid="calendar-next-button"]');

    // Should NOT show loading spinner
    const spinner = await page
      .locator('[data-testid="loading-spinner"]')
      .count();
    expect(spinner).toBe(0);
  });

  test('prefetches adjacent months', async ({ page }) => {
    const requests: string[] = [];

    // Monitor API calls
    page.on('request', (request) => {
      if (request.url().includes('/api/appointments/time-range')) {
        requests.push(request.url());
      }
    });

    await page.goto('/appointments');
    await page.waitForTimeout(2000); // Wait for prefetch

    // Should have made 3 requests (prev, current, next)
    expect(requests.length).toBeGreaterThanOrEqual(3);
  });
});
```

Run E2E tests:

```bash
npm run test:e2e
```

### 5. Performance Testing (15 minutes)

Create performance monitoring:

```typescript
// src/utils/calendar-performance-monitor.ts
export class CalendarPerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getAverageMetric(name: string): number {
    const values = this.metrics.get(name) || [];
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  getP95Metric(name: string): number {
    const values = (this.metrics.get(name) || []).sort((a, b) => a - b);
    const index = Math.floor(values.length * 0.95);
    return values[index] || 0;
  }

  generateReport() {
    const report = {
      queryTime: {
        average: this.getAverageMetric('query_time'),
        p95: this.getP95Metric('query_time'),
      },
      renderTime: {
        average: this.getAverageMetric('render_time'),
        p95: this.getP95Metric('render_time'),
      },
      cacheHitRate: this.calculateCacheHitRate(),
    };

    console.table(report);
    return report;
  }

  private calculateCacheHitRate() {
    const hits = this.metrics.get('cache_hits')?.length || 0;
    const misses = this.metrics.get('cache_misses')?.length || 0;
    const total = hits + misses;
    return total > 0 ? (hits / total) * 100 : 0;
  }
}
```

### 6. Load Testing (10 minutes)

Test with large dataset:

```bash
# Generate 100k appointments
node scripts/seed-calendar-test-data.js --count=100000

# Monitor performance in browser
# Check memory usage in Chrome DevTools
# Verify query times remain < 100ms
```

## Verification Checklist

### Performance Metrics

- [ ] Initial load time < 500ms
- [ ] Navigation time < 50ms (with prefetch)
- [ ] Query response time < 100ms (p95)
- [ ] Memory usage < 50MB
- [ ] Cache hit rate > 80%

### Functionality Tests

- [ ] All CRUD operations work correctly
- [ ] Optimistic updates feel instant
- [ ] Error handling shows user-friendly messages
- [ ] Offline mode degrades gracefully
- [ ] Mobile responsive on all screen sizes

### Database Performance

- [ ] Indexes being used (check EXPLAIN ANALYZE)
- [ ] No slow queries in logs
- [ ] Connection pool not exhausted
- [ ] RLS policies not causing slowdowns

### React Query Health

- [ ] No memory leaks (check DevTools)
- [ ] Queries garbage collected properly
- [ ] Prefetch working as expected
- [ ] Mutations invalidate correct queries

## Success Criteria

- All tests passing (unit, integration, E2E)
- Performance metrics within targets
- No console errors or warnings
- Smooth user experience verified
- Ready for production deployment

## Monitoring Setup

Add production monitoring:

```typescript
// src/lib/monitoring/calendar-metrics.ts
import { analytics } from '@/lib/analytics';

export function trackCalendarMetrics(queryClient: QueryClient) {
  queryClient.getQueryCache().subscribe((event) => {
    if (
      event.type === 'observerResultsUpdated' &&
      event.query.queryKey[0] === 'appointments'
    ) {
      analytics.track('calendar_query', {
        queryKey: event.query.queryKey,
        fetchStatus: event.query.state.fetchStatus,
        dataUpdateCount: event.query.state.dataUpdateCount,
        errorUpdateCount: event.query.state.errorUpdateCount,
      });
    }
  });
}
```

## Next Phase

With testing complete, proceed to Phase 7: Production Deployment

## Notes for Implementation Agent

- Run all test suites before marking complete
- Document any performance bottlenecks found
- Keep test data for future regression testing
- Set up monitoring before production deployment
