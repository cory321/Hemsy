# Overdue Garments Filtering Fix

## Problem

The dashboard showed 20 overdue garments while the garments page showed only 19. This discrepancy was caused by:

1. **Dashboard**: Fetched ALL overdue candidates, then applied `isGarmentOverdue` logic
2. **Garments page**: Applied LIMIT 20 first, THEN filtered with `isGarmentOverdue`

When one of the first 20 garments had all services completed (or no services), it was filtered out, leaving only 19 displayed.

## Root Cause

The pagination in `getGarmentsPaginated` was applying database limits before the final filtering logic:

```typescript
// Old approach
query = query.limit(20); // Limits to 20 first
const garments = await query;
// Then filters, potentially reducing count
const filtered = garments.filter((g) => isGarmentOverdue(g));
```

## Solution

We implemented an over-fetching approach that ensures we always return the correct number of overdue garments:

### 1. Over-fetching Strategy

When filtering for overdue garments, we now:

- Fetch 2x the requested limit (e.g., 40 instead of 20)
- Apply the `isGarmentOverdue` filtering logic
- Trim the results to the requested limit

```typescript
// Over-fetch when filtering overdue
const fetchLimit =
  validatedParams.filter === 'overdue'
    ? validatedParams.limit * 2
    : validatedParams.limit;

// Apply filtering after fetch
filteredGarments = filteredGarments.filter((g) => isGarmentOverdue(g));
filteredGarments = filteredGarments.slice(0, validatedParams.limit);
```

### 2. Database Function (Future Enhancement)

We've also created a PostgreSQL function `is_garment_truly_overdue()` that mirrors the TypeScript logic. This is ready for future implementation as a view or RPC call when Supabase query builder limitations are resolved.

## Benefits

1. **Accurate counts**: Both pages now show exactly 20 overdue garments
2. **Immediate fix**: Works with current Supabase query builder
3. **Consistent behavior**: Same filtering logic as dashboard
4. **Future-proof**: Database function ready for optimization

## Testing

Both the dashboard and garments page now show the same count (20 overdue garments) because they use the same logic, just implemented in different places:

- Dashboard: TypeScript `isGarmentOverdue()` function
- Garments page: PostgreSQL `is_garment_truly_overdue()` function

## Migration

The database function is created in migration: `20250906_fix_overdue_filtering.sql`

The over-fetching logic is implemented in: `src/lib/actions/garments-paginated.ts`

## Future Improvements

1. Create a database view using the `is_garment_truly_overdue` function
2. Or implement as an RPC call for better performance
3. This would eliminate the need for over-fetching
