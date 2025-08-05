# Calendar Reducer Architecture

## Overview

This document outlines the new reducer-based architecture for the calendar component that addresses synchronization issues, race conditions, and provides a more robust state management solution.

## Problems with Current Architecture

1. **Race Conditions**: When rapidly navigating between months/weeks, multiple queries can return out of order
2. **Inconsistent Updates**: Mix of optimistic updates, `router.refresh()`, and React Query cache invalidation
3. **No Central State**: Appointments are scattered across React Query cache entries
4. **Complex Cache Management**: Multiple queries need careful invalidation
5. **Limited Real-time Support**: No built-in support for multi-user updates

## New Architecture Benefits

### 1. Centralized State Management

- Single source of truth for all appointment data
- Reducer pattern ensures predictable state updates
- Easy to debug and trace state changes

### 2. Race Condition Prevention

- Request IDs track active requests
- Outdated responses are automatically ignored
- Smooth navigation without data flickering

### 3. Comprehensive Optimistic Updates

- All CRUD operations have optimistic updates
- Automatic rollback on errors
- Consistent user experience
- Important: Appointments are never deleted - they are canceled (status change) to maintain audit trail

### 4. Real-time Synchronization

- Supabase real-time subscriptions built-in
- Updates from other users appear instantly
- Conflict detection for optimistic updates

### 5. Intelligent Data Loading

- Tracks loaded date ranges to prevent redundant fetches
- Automatic prefetching of adjacent date ranges
- Stale data management with configurable TTL

## Architecture Components

### 1. Appointment Reducer (`src/lib/reducers/appointments-reducer.ts`)

The core state management logic with actions for:

- Loading appointments with request tracking
- Create, Update, and Cancel operations with optimistic updates
- Real-time remote updates
- Cache invalidation and stale data cleanup
- Note: No delete operations - appointments are canceled by updating status to 'canceled'

Key features:

- **Request Tracking**: Prevents race conditions with unique request IDs
- **Date Range Cache**: Knows which ranges are loaded and fresh
- **Optimistic Updates Map**: Tracks in-flight updates to prevent conflicts
- **Error Handling**: Comprehensive error states for each operation

### 2. Appointment Provider (`src/providers/AppointmentProvider.tsx`)

Context provider that:

- Manages the reducer state
- Provides Create, Update, and Cancel operations with optimistic updates
- Sets up Supabase real-time subscriptions
- Handles automatic cleanup of stale data
- cancelAppointment: Updates status to 'canceled' (no actual deletion)

Key features:

- **Real-time Subscriptions**: Automatic sync with database changes
- **Conflict Resolution**: Ignores remote updates during optimistic updates
- **Error Boundaries**: Graceful error handling with toast notifications
- **Performance Optimization**: Periodic cleanup of old data

### 3. Calendar Hook (`src/hooks/useCalendarAppointments.ts`)

Custom hook that provides:

- Filtered appointments for current date range
- Loading and error states
- Navigation functions
- Automatic data fetching and prefetching

Key features:

- **Smart Loading**: Only fetches data when needed
- **Prefetching**: Loads adjacent date ranges in background
- **Navigation**: Smooth month/week/day navigation
- **Race Condition Prevention**: Tracks current loading request

### 4. Calendar Component (`src/components/appointments/CalendarWithReducer.tsx`)

Updated component that uses the reducer architecture:

- Cleaner component with separated concerns
- Consistent dialog management
- Proper error handling

## Migration Guide

### Step 1: Add the Provider

Wrap your app with the AppointmentProvider:

```tsx
// In your layout or _app.tsx
import { AppointmentProvider } from '@/providers/AppointmentProvider';

export default function Layout({ children }) {
  const { shopId } = useAuth(); // Get shop ID from your auth

  return <AppointmentProvider shopId={shopId}>{children}</AppointmentProvider>;
}
```

### Step 2: Replace CalendarWithQuery

Replace instances of `CalendarWithQuery` with `CalendarWithReducer`:

```tsx
// Before
import { CalendarWithQuery } from '@/components/appointments/CalendarWithQuery';

<CalendarWithQuery
  shopId={shopId}
  shopHours={shopHours}
  // ...
/>;

// After
import { CalendarWithReducer } from '@/components/appointments/CalendarWithReducer';

<CalendarWithReducer
  shopId={shopId}
  shopHours={shopHours}
  // ...
/>;
```

### Step 3: Update Components Using Appointments

Components that need appointment data can use the hook:

```tsx
import { useAppointments } from '@/providers/AppointmentProvider';

function MyComponent() {
  const {
    state,
    createAppointment,
    updateAppointment,
    cancelAppointment, // Cancels by updating status
    getAppointmentsForDateRange,
  } = useAppointments();

  // Use appointments data
  const todayAppointments = getAppointmentsForDateRange(
    format(new Date(), 'yyyy-MM-dd'),
    format(new Date(), 'yyyy-MM-dd')
  );

  // Create appointment with automatic optimistic update
  const handleCreate = async (data) => {
    await createAppointment(shopId, data);
    // No need to manually refresh - state updates automatically
  };
}
```

### Step 4: Remove React Query Code

You can remove:

- Manual query invalidations
- `router.refresh()` calls
- Complex cache management logic

### Important Business Logic:

- **No Deletion**: Appointments are never deleted from the database
- **Cancellation**: To cancel an appointment, we update its status to 'canceled'
- **Audit Trail**: This maintains a complete history of all appointments for business records

## Performance Considerations

### 1. Memory Management

- Old appointment data is automatically cleaned up
- Configurable stale time (default: 5 minutes)
- Only keeps data for viewed date ranges

### 2. Network Efficiency

- Prevents duplicate requests for same date range
- Prefetches adjacent ranges during idle time
- Request deduplication for rapid navigation

### 3. Real-time Optimization

- Optimistic updates prevent flicker
- Remote updates only apply when no local changes pending
- Efficient subscription management

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```tsx
try {
  await updateAppointment(id, { notes: 'Updated notes' });
} catch (error) {
  // Error is already shown as toast by provider
  // Additional handling if needed
}
```

### 2. Loading States

Use the loading state from the hook:

```tsx
const { appointments, isLoading } = useCalendarAppointments({
  shopId,
  view: 'month',
});

if (isLoading) {
  return <CalendarSkeleton />;
}
```

### 3. Date Range Queries

For custom date ranges, use the provider directly:

```tsx
const { loadAppointments, getAppointmentsForDateRange } = useAppointments();

// Load a custom range
await loadAppointments(shopId, {
  startDate: '2024-01-01',
  endDate: '2024-12-31',
});

// Get appointments for the range
const yearAppointments = getAppointmentsForDateRange(
  '2024-01-01',
  '2024-12-31'
);
```

## Testing

The reducer architecture makes testing easier:

```tsx
import {
  appointmentReducer,
  initialAppointmentState,
} from '@/lib/reducers/appointments-reducer';

describe('Appointment Reducer', () => {
  it('should handle optimistic updates', () => {
    const state = appointmentReducer(initialAppointmentState, {
      type: AppointmentActionType.UPDATE_APPOINTMENT_OPTIMISTIC,
      payload: {
        id: 'test-id',
        updates: { notes: 'New notes' },
      },
    });

    expect(state.appointments.get('test-id')).toMatchObject({
      notes: 'New notes',
    });
  });
});
```

## Future Enhancements

1. **Offline Support**: Store state in IndexedDB for offline access
2. **Conflict Resolution**: Advanced merge strategies for concurrent edits
3. **Batch Operations**: Support for bulk appointment updates
4. **Analytics**: Track performance metrics and usage patterns
5. **Undo/Redo**: Command pattern for reversible operations

## Conclusion

The reducer-based architecture provides a more robust, scalable solution for managing calendar state. It eliminates race conditions, provides better real-time support, and offers a cleaner programming model for complex state management.
