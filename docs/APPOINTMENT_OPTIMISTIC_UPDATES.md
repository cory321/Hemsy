# Appointment Optimistic Updates

## Problem

Previously, after creating an appointment, users had to refresh the page to see the new appointment in the calendar. This was because the `AppointmentDialog` component was:

1. Directly calling server actions (`createAppointment` from `@/lib/actions/appointments`)
2. Using `router.refresh()` to refresh the entire page
3. Not utilizing React Query's cache invalidation capabilities

## Solution

The fix involves properly integrating React Query's mutations with cache invalidation:

### 1. Updated `AppointmentDialog` Component

**Before:**

```typescript
// Direct server action call
await createAppointment(data);
router.refresh(); // Full page refresh
```

**After:**

```typescript
// Use callback props provided by parent
if (appointment && onUpdate) {
  await onUpdate(data);
} else if (!appointment && onCreate) {
  await onCreate(data);
}
// No router.refresh() needed!
```

### 2. Updated `AppointmentsClient` Component

The parent component now passes mutation functions that handle:

```typescript
const createMutation = useCreateAppointment({
  onSuccess: () => {
    toast.success('Appointment created successfully');
    setAppointmentDialogOpen(false);
    // No refresh needed - React Query handles cache invalidation
  },
});

// Pass the mutation function to AppointmentDialog
<AppointmentDialog
  onCreate={handleCreateAppointment}
  onUpdate={handleUpdateAppointment}
  // ... other props
/>
```

### 3. React Query Mutations with Optimistic Updates

The `useCreateAppointment` hook in `appointment-queries.ts` includes:

- **Optimistic updates**: Shows the appointment immediately while the request is in progress
- **Cache invalidation**: Automatically refreshes the calendar data after success
- **Error handling**: Reverts optimistic updates if the request fails

```typescript
onMutate: async (newAppointment) => {
  // Optimistically add the appointment to the UI
  queryClient.setQueryData(queryKey, (old = []) => {
    return [...old, optimisticAppointment].sort(...);
  });
},

onSettled: async (data, error, variables) => {
  // Invalidate queries to ensure data consistency
  await queryClient.invalidateQueries({
    queryKey: appointmentKeys.timeRange(...),
  });
}
```

## Benefits

1. **Instant feedback**: Users see their appointment immediately
2. **No page refresh**: Smoother user experience
3. **Error recovery**: If creation fails, the UI automatically reverts
4. **Consistent state**: React Query manages all data synchronization

## Usage

The system now works seamlessly:

1. User creates an appointment
2. The appointment appears immediately in the calendar (optimistic update)
3. If successful, the appointment stays and a success toast is shown
4. If failed, the appointment is removed and an error toast is shown
5. All without any page refresh!

## Technical Details

### Key Files Modified:

- `src/components/appointments/AppointmentDialog.tsx`: Removed direct server actions, added callback props
- `src/app/(app)/appointments/AppointmentsClient.tsx`: Passes mutation functions to dialog
- `src/lib/queries/appointment-queries.ts`: Already had optimistic updates configured

### Dependencies:

- `@tanstack/react-query`: For data fetching and caching
- `react-hot-toast`: For user notifications
