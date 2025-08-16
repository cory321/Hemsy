# Garments Due Date Pagination Fix

## Issue

When sorting garments by due date, the pagination was showing incorrect totals. The "View All" stage showed 56 garments, but scrolling to the bottom only loaded 36 garments with the message "All 36 garments loaded".

## Root Cause

The pagination cursor was using `created_at` for all sorting options except `client_name`. When sorting by `due_date`, this mismatch between the sort field and cursor field caused garments to be skipped during pagination.

### Example Scenario

Given garments ordered by due_date:

1. Garment A: due_date: 2024-01-01, created_at: 2024-01-10
2. Garment B: due_date: 2024-01-02, created_at: 2024-01-05 ← cursor position
3. Garment C: due_date: 2024-01-03, created_at: 2024-01-03 ← would be skipped!
4. Garment D: due_date: 2024-01-04, created_at: 2024-01-08

After loading the first 2 items, the cursor would be:

```json
{ "lastId": "B", "lastCreatedAt": "2024-01-05" }
```

The next query would look for `created_at > '2024-01-05'`, which would skip Garment C even though it should be next in due_date order.

## Solution

### 1. Updated Cursor Schema

Added `lastDueDate` as an optional field to the cursor:

```typescript
const GarmentCursorSchema = z.object({
  lastId: z.string().uuid(),
  lastCreatedAt: z.string().min(1),
  lastClientName: z.string().optional(),
  lastDueDate: z.string().optional(), // Added for due_date sorting
});
```

### 2. Updated Cursor Logic

Modified the pagination logic to use the appropriate field based on sort type:

```typescript
if (validatedParams.sortField === 'due_date') {
  const lastDueDate = validatedParams.cursor.lastDueDate;
  if (lastDueDate) {
    query = query.or(
      `due_date.${op}.${lastDueDate},and(due_date.eq.${lastDueDate},id.${idOp}.${lastId}),and(due_date.is.null,id.${idOp}.${lastId})`
    );
  } else {
    query = query.or(`due_date.is.null,id.${idOp}.${lastId}`);
  }
}
```

### 3. Updated Next Cursor Building

The cursor now includes the appropriate field based on sort type:

```typescript
if (validatedParams.sortField === 'client_name' && lastGarment.client_name) {
  baseCursor.lastClientName = lastGarment.client_name;
} else if (validatedParams.sortField === 'due_date' && lastGarment.due_date) {
  baseCursor.lastDueDate = lastGarment.due_date;
}
```

### 4. Fixed UI Display

Updated the InfiniteScrollTrigger to show the total count instead of loaded count:

```typescript
endText={`All ${totalCount || filteredGarments.length} garments loaded`}
```

## Files Modified

1. `/src/app/(app)/garments/page.tsx` - Fixed the display message
2. `/src/lib/actions/garments-paginated.ts` - Fixed cursor-based pagination logic
3. `/src/lib/queries/garment-queries.ts` - Updated cursor type definition
4. `/src/__tests__/unit/actions/garments-due-date-pagination.test.ts` - Added test coverage
5. `/src/__tests__/e2e/garments-due-date-pagination.spec.ts` - Added E2E test

## Testing

Run the unit test to verify the fix:

```bash
npm test -- src/__tests__/unit/actions/garments-due-date-pagination.test.ts
```

Run the E2E test to verify end-to-end functionality:

```bash
npm run test:e2e -- garments-due-date-pagination.spec.ts
```

## Future Considerations

This same pattern should be applied to other sort fields if they experience similar issues:

- `event_date` - Would need `lastEventDate` in cursor
- `name` - Would need `lastName` in cursor

Currently, only `created_at`, `client_name`, and `due_date` have proper cursor handling.
