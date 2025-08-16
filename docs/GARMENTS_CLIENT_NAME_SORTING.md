# Garments Client Name Sorting Implementation

## Overview

This document describes the implementation of server-side sorting by client name for the garments page, including support for infinite scrolling with thousands of clients.

## Problem

Previously, sorting by client name was done client-side, which caused:

1. Runtime error: "clientGarments.map is not a function"
2. Incompatibility with server-side pagination
3. Poor performance with large datasets

## Solution

We implemented server-side sorting by client name using the `garments_with_clients` database view.

### Key Changes

#### 1. Database View

The `garments_with_clients` view (created in migration 029) flattens the relationship between garments, orders, and clients, making client information directly accessible for sorting.

#### 2. Backend Implementation (`garments-paginated.ts`)

- **Dynamic View Usage**: The query switches to use `garments_with_clients` view when:
  - Searching (any search term)
  - Sorting by client name
- **Cursor Enhancement**: Added `lastClientName` to the cursor schema for client name pagination:

  ```typescript
  const GarmentCursorSchema = z.object({
    lastId: z.string().uuid(),
    lastCreatedAt: z.string().min(1),
    lastClientName: z.string().optional(),
  });
  ```

- **Sorting Logic**: When sorting by client name:

  ```typescript
  query = query
    .order('client_full_name', {
      ascending: validatedParams.sortOrder === 'asc',
      nullsFirst: false,
    })
    .order('id', { ascending: validatedParams.sortOrder === 'asc' });
  ```

- **Cursor-based Pagination**: Special handling for client name cursors:
  ```typescript
  if (validatedParams.sortField === 'client_name' && hasSearch) {
    const lastClientName = validatedParams.cursor.lastClientName;
    if (lastClientName) {
      query = query.or(
        `client_full_name.${op}.${lastClientName},and(client_full_name.eq.${lastClientName},id.${idOp}.${lastId})`
      );
    }
  }
  ```

#### 3. Frontend Changes (`garments/page.tsx`)

- **Removed Client-side Grouping**: Eliminated the `groupGarmentsByClientName` function usage
- **Unified Rendering**: All sort fields now use the same grid rendering logic
- **Server-side Sorting**: Client name sorting is handled entirely by the backend

### Performance Considerations

1. **View Performance**: The view uses indexes on:
   - `orders.client_id`
   - `garments.order_id`
   - `garments(shop_id, created_at)`

2. **Conditional View Usage**: The view is only used when necessary:
   - Regular queries use the base `garments` table for better performance
   - View queries are used only for searching or client name sorting

3. **Stable Pagination**: Uses cursor-based pagination with composite keys for consistent results

### Infinite Scrolling

The implementation supports infinite scrolling with any number of clients:

1. **Cursor includes client name** when sorting by client name
2. **Keyset pagination** ensures no duplicate results
3. **Composite sorting** (client_full_name + id) provides stable ordering
4. **Limit of 20 items per page** for optimal performance

### Usage

```typescript
// Frontend usage remains the same
const { garments, fetchNextPage, hasNextPage } = useGarmentsSearch(shopId, {
  sortField: 'client_name',
  sortOrder: 'asc',
});
```

### Testing

1. **Unit Tests**: `garments-paginated-client-sort.test.ts`
   - Verifies view usage
   - Tests cursor generation
   - Validates pagination logic

2. **E2E Tests**: `garments-client-sort.spec.ts`
   - Tests sorting functionality
   - Verifies infinite scroll
   - Checks sort order toggling
   - Validates search + sort combination

### Migration Notes

- The feature requires migration 029 to be applied
- No frontend code changes required beyond removing client-side grouping
- Backward compatible with existing functionality
