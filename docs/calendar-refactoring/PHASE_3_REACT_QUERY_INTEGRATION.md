# Phase 3: React Query Integration

**Duration**: 30 minutes  
**Priority**: HIGH - Core infrastructure for caching

## Objective

Integrate React Query provider and verify the query infrastructure is working correctly with DevTools.

## Prerequisites

- Phase 1 (Dependencies) completed
- Phase 2 (Database Migration) completed
- React Query packages installed

## Implementation Steps

### 1. Activate React Query Provider (10 minutes)

The provider is already created at: `/Users/corywilliams/Threadfolio V2/src/providers/QueryProvider.tsx`

Activate it in the root layout:

```bash
# Navigate to project root
cd "/Users/corywilliams/Threadfolio V2"

# Backup current layout
cp src/app/layout.tsx src/app/layout.backup.tsx

# Replace with React Query enabled layout
mv src/app/layout-refactored.tsx src/app/layout.tsx
```

### 2. Verify Provider Configuration (5 minutes)

Check that `src/app/layout.tsx` now includes:

```typescript
import { QueryProvider } from '@/providers/QueryProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <QueryProvider>
          {/* Other providers */}
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

### 3. Test React Query DevTools (10 minutes)

1. Start development server:

```bash
npm run dev
```

2. Open browser to http://localhost:3000

3. Look for React Query DevTools icon (bottom-right corner)
   - Should show a floating button with "🔍" or React Query logo
   - Click to open DevTools panel

4. Verify DevTools shows:
   - Query cache (empty initially)
   - Mutation cache
   - Settings panel

### 4. Verify Query Key Factory (5 minutes)

Check the query key factory at: `/Users/corywilliams/Threadfolio V2/src/lib/queries/appointment-keys.ts`

Test TypeScript types:

```typescript
// Create a test file: src/test-query-keys.ts
import { appointmentKeys } from '@/lib/queries/appointment-keys';

// These should all have correct TypeScript types
const keys = {
  all: appointmentKeys.all,
  timeRange: appointmentKeys.timeRange('shop-id', '2024-01-01', '2024-01-31'),
  month: appointmentKeys.monthView('shop-id', 2024, 1),
  week: appointmentKeys.weekView('shop-id', 2024, 1),
  day: appointmentKeys.dayView('shop-id', '2024-01-01'),
};

console.log('Query keys:', keys);

// Delete this file after verification
```

## Files Modified

- `src/app/layout.tsx` - Now includes QueryProvider
- React Query is now active globally

## Verification Checklist

- [ ] Layout file successfully replaced
- [ ] No TypeScript errors on build
- [ ] Development server starts without errors
- [ ] React Query DevTools visible in development
- [ ] DevTools responsive and showing empty cache
- [ ] Query key factory imports work correctly

## Testing the Integration

Create a simple test component:

```typescript
// src/components/test-query.tsx
'use client';

import { useQuery } from '@tanstack/react-query';

export function TestQuery() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['test'],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { message: 'React Query is working!' };
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data?.message}</div>;
}
```

Add to any page and verify:

1. Shows "Loading..." for 1 second
2. Then shows "React Query is working!"
3. DevTools shows the query in cache

## Configuration Details

The QueryProvider includes optimized settings:

- `staleTime`: Different for month/week/day views
- `gcTime`: 30 minutes for month, 15 for week, 5 for day
- `refetchOnWindowFocus`: false (prevents unnecessary refetches)
- `retry`: 2 attempts with exponential backoff

## Success Criteria

- React Query provider active on all pages
- DevTools accessible in development
- No console errors or warnings
- TypeScript compilation successful
- Test query works and visible in DevTools

## Troubleshooting

### Issue: DevTools not showing

```bash
# Ensure you're in development mode
NODE_ENV=development npm run dev

# Check browser console for errors
# DevTools only show in development
```

### Issue: TypeScript errors

```typescript
// Add to src/types/globals.d.ts if needed
declare module '@tanstack/react-query';
```

### Issue: Hydration errors

Ensure all providers are in the correct order in layout.tsx

## Next Phase

With React Query active, proceed to Phase 4: Query Hooks Implementation

## Notes for Implementation Agent

- React Query DevTools are development-only
- Provider must wrap all components that use queries
- Keep the original layout.backup.tsx until fully tested
- Monitor browser console for any hydration warnings
