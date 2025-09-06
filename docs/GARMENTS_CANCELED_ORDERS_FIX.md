# Garments Page - Canceled Orders Fix

## Issue

Garments from canceled orders were appearing on the garments page, showing as "Unknown Client".

## Solution Applied

### 1. Database Migration (Applied)

- Added `order_status` column to `garments_with_clients` view
- Migration file: `055_add_order_status_to_garments_view.sql`
- Status: ✅ Applied to database

### 2. Code Changes (Committed)

- Updated `garments-paginated.ts` to filter out canceled orders
- Added logic for both regular queries and view queries (search/client sorting)
- Status: ✅ Committed to main branch (commit: 6597627)

### 3. Filtering Logic

The following filters are now applied:

- Default: `neq('orders.status', 'cancelled')` or `neq('order_status', 'cancelled')`
- When searching: Uses the view with order_status filtering
- When sorting by client: Uses the view with order_status filtering

## Troubleshooting Steps

If canceled order garments still appear:

### 1. Clear Browser Cache

- Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Clear site data in DevTools > Application > Storage > Clear site data

### 2. Restart Development Server

```bash
# Kill all Next.js processes
pkill -f "next dev"

# Clear Next.js cache
rm -rf .next

# Restart server
npm run dev
```

### 3. Verify Code is Current

```bash
# Check latest commit
git log --oneline -1

# Should show:
# 6597627 fix: exclude canceled orders from garments page...
```

### 4. Test Query Directly

Check if filtering works at database level:

```sql
SELECT id, name, order_status, client_full_name
FROM garments_with_clients
WHERE shop_id = 'YOUR_SHOP_ID'
  AND order_status != 'cancelled'
LIMIT 10;
```

## Expected Behavior

- Canceled order garments should NOT appear in:
  - Main garments list
  - Search results
  - Stage filters
  - Client name sorting
  - Stage counts

## Test Data

In "Samantha Williams's Shop" (84dcc45a-3a63-49c9-bca0-d0fddf0f1eb6):

- Total garments: 43
- Canceled order garments: 10 (should be hidden)
- Active garments: 33 (should be visible)
