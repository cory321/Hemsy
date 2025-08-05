# Phase 5: UI Components Migration

**Duration**: 60 minutes  
**Priority**: HIGH - User-facing changes

## Objective

Migrate the calendar UI components to use React Query hooks with sliding window pattern for seamless navigation.

## Prerequisites

- Phase 4 (Query Hooks) completed and tested
- React Query hooks working correctly
- Test data available in database

## Implementation Steps

### 1. Backup Current Components (10 minutes)

```bash
# Navigate to project root
cd "/Users/corywilliams/Threadfolio V2"

# Backup appointments page
cp src/app/(app)/appointments/page.tsx \
   src/app/(app)/appointments/page.backup.tsx

# Backup appointments client
cp src/app/(app)/appointments/AppointmentsClient.tsx \
   src/app/(app)/appointments/AppointmentsClient.backup.tsx

# Backup calendar component if exists
cp src/components/appointments/Calendar.tsx \
   src/components/appointments/Calendar.backup.tsx 2>/dev/null || true
```

### 2. Activate Refactored Components (15 minutes)

```bash
# Replace appointments page
mv src/app/(app)/appointments/page-refactored.tsx \
   src/app/(app)/appointments/page.tsx

# Replace appointments client
mv src/app/(app)/appointments/AppointmentsClientRefactored.tsx \
   src/app/(app)/appointments/AppointmentsClient.tsx
```

### 3. Verify CalendarWithQuery Component (10 minutes)

Check the new calendar at: `/Users/corywilliams/Threadfolio V2/src/components/appointments/CalendarWithQuery.tsx`

Key features to verify:

- Uses `useAppointmentsTimeRange` hook
- Implements `usePrefetchAdjacentWindows`
- Handles loading states gracefully
- Supports month/week/day views

### 4. Update Component Imports (10 minutes)

In `AppointmentsClient.tsx`, ensure it imports:

```typescript
import { CalendarWithQuery } from '@/components/appointments/CalendarWithQuery';
```

If there are any other files importing the old Calendar component, update them.

### 5. Test UI Functionality (15 minutes)

Start the development server and test:

```bash
npm run dev
```

Navigate to http://localhost:3000/appointments and verify:

1. **Initial Load**
   - Calendar displays current month
   - Appointments load within 500ms
   - No console errors

2. **Navigation**
   - Click previous/next month buttons
   - Should transition instantly (no spinner after first load)
   - Check DevTools - prefetched data being used

3. **View Switching**
   - Switch between Month/Week/Day views
   - Each view loads appropriate data
   - Smooth transitions

4. **Appointment Creation**
   - Click to create new appointment
   - Form appears with date pre-filled
   - Submit creates appointment optimistically

5. **Real-time Updates**
   - Create appointment in one window
   - Open another window - should show new appointment

## Component Architecture

The refactored structure:

```
AppointmentsClient (Server Component)
  └── CalendarWithQuery (Client Component)
       ├── useAppointmentsTimeRange (Data fetching)
       ├── usePrefetchAdjacentWindows (Prefetching)
       └── CalendarView (Pure UI Component)
            ├── MonthView
            ├── WeekView
            └── DayView
```

## Verification Checklist

- [ ] No TypeScript errors after migration
- [ ] Calendar loads without errors
- [ ] Navigation between dates is instant
- [ ] View switching works correctly
- [ ] Appointment CRUD operations work
- [ ] React Query DevTools shows proper caching
- [ ] No loading spinners during navigation
- [ ] Mobile responsive layout maintained

## Performance Testing

### 1. Monitor Initial Load

```javascript
// Add to CalendarWithQuery temporarily
useEffect(() => {
  console.time('Calendar Mount');
  return () => console.timeEnd('Calendar Mount');
}, []);
```

### 2. Check Prefetch Behavior

In React Query DevTools:

- Navigate to next month
- Should see 3 queries: previous, current, next
- All should be in "fresh" state

### 3. Test with Large Dataset

If you have test data:

- Load a month with 100+ appointments
- Should still render within 500ms
- Scrolling should be smooth

## UI/UX Checklist

- [ ] Loading skeleton shows during initial load
- [ ] Error states display user-friendly messages
- [ ] Empty states have appropriate messaging
- [ ] Transitions feel smooth and responsive
- [ ] Mobile gestures work (swipe to navigate)
- [ ] Accessibility maintained (keyboard navigation)

## Success Criteria

- Zero loading spinners after initial page load
- Navigation feels instant (< 50ms perceived)
- All CRUD operations work with optimistic updates
- No regression in existing functionality
- Performance metrics meet targets

## Rollback Plan

If issues occur:

```bash
# Restore original files
mv src/app/(app)/appointments/page.backup.tsx \
   src/app/(app)/appointments/page.tsx

mv src/app/(app)/appointments/AppointmentsClient.backup.tsx \
   src/app/(app)/appointments/AppointmentsClient.tsx

# Restart dev server
npm run dev
```

## Common Issues & Fixes

### Issue: Calendar not rendering

```typescript
// Check shopId is passed correctly
console.log('Shop ID:', shopId);
// Ensure user is authenticated
```

### Issue: Infinite loading

```typescript
// Check server action imports
// Verify database connection
// Check React Query provider is active
```

### Issue: Stale data after mutations

```typescript
// Ensure proper invalidation in mutations
queryClient.invalidateQueries({
  queryKey: appointmentKeys.all,
});
```

## Next Phase

With UI migrated, proceed to Phase 6: Testing & Verification

## Notes for Implementation Agent

- Keep browser DevTools open (Network + Console + React Query)
- Test with throttled network to ensure good UX
- Verify all existing features still work
- Document any UI changes for users
