# Garment Search Client Name Issue - RESOLVED

## Problem Summary

When searching for garments, the client name was showing as "Unknown Client" because the search functionality was attempting to filter on deeply nested relationships (garments → orders → clients) using PostgREST's `foreignTable` option, which doesn't support nested relationships.

## Solution Implemented

We created a database view `garments_with_clients` that flattens the relationship between garments and clients, making it possible to search garments by client name. The implementation includes:

1. **Database View**: Created `garments_with_clients` view that joins garments with client information
2. **Updated Backend**: Modified `garments-paginated.ts` to use the view when searching
3. **Updated UI**: Updated search placeholder to indicate client name search is supported

The search now supports filtering by:

- Garment name
- Garment notes
- Client first name
- Client last name
- Full client name

## Why This Limitation Exists

PostgREST (Supabase's REST API) has limitations when filtering on nested relationships. The `foreignTable` option only works for direct foreign key relationships, not for relationships that traverse multiple tables.

## Potential Solutions for Client Name Search

If you need to search garments by client name in the future, here are some options:

### Option 1: Database View (Recommended)

Create a database view that flattens the relationship:

```sql
CREATE OR REPLACE VIEW garments_with_clients AS
SELECT
  g.*,
  c.first_name as client_first_name,
  c.last_name as client_last_name,
  c.first_name || ' ' || c.last_name as client_full_name
FROM garments g
JOIN orders o ON g.order_id = o.id
JOIN clients c ON o.client_id = c.id;
```

Then query this view instead of the garments table directly.

### Option 2: RPC Function

Create a PostgreSQL function that handles the complex search:

```sql
CREATE OR REPLACE FUNCTION search_garments_with_clients(
  shop_id_param UUID,
  search_term TEXT DEFAULT NULL
)
RETURNS TABLE (
  -- garment fields
  id UUID,
  name TEXT,
  -- ... other fields
  client_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.name,
    -- ... other fields
    c.first_name || ' ' || c.last_name as client_name
  FROM garments g
  JOIN orders o ON g.order_id = o.id
  JOIN clients c ON o.client_id = c.id
  WHERE g.shop_id = shop_id_param
    AND (
      search_term IS NULL
      OR g.name ILIKE '%' || search_term || '%'
      OR g.notes ILIKE '%' || search_term || '%'
      OR c.first_name ILIKE '%' || search_term || '%'
      OR c.last_name ILIKE '%' || search_term || '%'
    );
END;
$$ LANGUAGE plpgsql;
```

### Option 3: Client-Side Filtering

For smaller datasets, fetch all garments and filter on the client side. This is less efficient but simpler to implement.

### Option 4: Denormalization

Store the client name directly on the garment record. This requires maintaining data consistency but provides the best query performance.

## Current Workaround

Users can still find garments for specific clients by:

1. Going to the Clients page
2. Finding the specific client
3. Viewing that client's orders and garments

## Implementation Details

### Files Created/Modified

1. **Database Migration**:
   - `/supabase/migrations/029_create_garments_with_clients_view.sql` - Creates the view

2. **Backend Changes**:
   - `/src/lib/actions/garments-paginated.ts` - Updated to use view for search queries

3. **Frontend Changes**:
   - `/src/app/(app)/garments/page.tsx` - Updated search placeholder text

4. **Type Definitions**:
   - `/src/types/database.d.ts` - Updated with view types
   - `/src/types/supabase.ts` - Updated with view types

### How It Works

1. When a user searches, the backend checks if there's a search term
2. If yes, it queries the `garments_with_clients` view which includes flattened client data
3. The search filters on garment name, notes, and all client name fields
4. Results are returned with proper client names displayed

## Performance Considerations

- The view uses indexes on `orders.client_id` and `garments.order_id` for optimal join performance
- A compound index on `garments(shop_id, created_at)` improves pagination performance
- The view only queries when searching; regular listing uses the base tables for better performance
