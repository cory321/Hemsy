# Garments Sorting Cleanup

## Issue

The garments page had "Overdue First" and "Due Soon First" sorting options that were not supported by the backend API. When users selected these options, it resulted in Zod validation errors because the backend only accepts: `'due_date' | 'created_at' | 'name' | 'event_date' | 'client_name'`.

## Changes Made

1. **Removed unsupported sort options**:
   - Removed "Overdue First" from the dropdown menu
   - Removed "Due Soon First" from the dropdown menu

2. **Updated TypeScript types**:
   - Changed `sortField` state type from `GetGarmentsPaginatedParams['sortField'] | 'overdue' | 'due_soon'` to just `GetGarmentsPaginatedParams['sortField']`
   - Updated the Select onChange handler type assertion accordingly

3. **Removed client-side sorting logic**:
   - Removed the `filteredGarments` useMemo hook that was handling client-side sorting for these special fields
   - Removed the import for `getGarmentSortComparator` function that's no longer needed

## Why This Change

- The backend doesn't support these sort fields, causing 500 errors
- Sorting by "Due Date" achieves the same result as users can see overdue items first when sorted by due date ascending
- Simplifies the code by removing unnecessary client-side sorting logic

## Files Modified

- `/src/app/(app)/garments/page.tsx` - Removed sorting options and related logic

## User Impact

Users can still effectively sort garments by due date to see overdue items. The removal of these options prevents server errors and improves reliability.
