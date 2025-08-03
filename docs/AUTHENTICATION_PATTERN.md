# Threadfolio V2 Authentication Pattern

## Overview

Threadfolio V2 uses a hybrid authentication approach:

- **Clerk** for user authentication and session management
- **Supabase** for data storage without using Supabase Auth

## Important: RLS is Disabled

**Row Level Security (RLS) is DISABLED on all tables** because we're using Clerk for authentication, not Supabase Auth. This means:

1. RLS policies that use `auth.uid()` will NOT work
2. Security is enforced at the application layer through server actions
3. All server actions must verify Clerk authentication before database operations

## How It Works

### 1. User Authentication Flow

```
User Login → Clerk Auth → Server Action → Verify Clerk Session → Database Operation
```

### 2. Key Components

#### Server Actions (`src/lib/actions/`)

All database operations go through server actions that:

1. Verify Clerk authentication using `auth()`
2. Call `ensureUserAndShop()` to sync user data
3. Filter data by `shop_id` at the application level

#### User/Shop Sync (`src/lib/actions/users.ts`)

The `ensureUserAndShop()` function:

1. Checks Clerk authentication
2. Creates/updates user record in Supabase using `clerk_user_id`
3. Creates/updates shop record for the user
4. Returns both user and shop for use in queries

### 3. Database Schema

#### Users Table

```sql
CREATE TABLE public.users (
    id UUID PRIMARY KEY,
    clerk_user_id TEXT UNIQUE NOT NULL,  -- Links to Clerk
    email TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
-- RLS DISABLED
```

#### Shops Table

```sql
CREATE TABLE public.shops (
    id UUID PRIMARY KEY,
    owner_user_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    trial_countdown_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
-- RLS DISABLED
```

#### Other Tables (clients, orders, etc.)

All tables reference `shop_id` and have RLS DISABLED.

## Security Considerations

Since RLS is disabled, **NEVER**:

1. Query the database directly from the client
2. Expose Supabase service role key to the client
3. Skip authentication checks in server actions

**ALWAYS**:

1. Use server actions for all database operations
2. Call `ensureUserAndShop()` at the start of server actions
3. Filter data by `shop_id` in your queries
4. Validate user permissions in the application layer

## Common Issues and Solutions

### Issue: "No clients loading"

**Cause**: RLS policies using `auth.uid()` when Clerk is the auth provider
**Solution**: Disable RLS on affected tables

### Issue: "Permission denied" errors

**Cause**: RLS enabled with incompatible policies
**Solution**: Run this SQL to disable RLS:

```sql
ALTER TABLE public.your_table DISABLE ROW LEVEL SECURITY;
```

### Issue: User/Shop not created

**Cause**: `ensureUserAndShop()` not called
**Solution**: Add to the beginning of your server action:

```typescript
const { user, shop } = await ensureUserAndShop();
```

## Migration Notes

When creating new tables:

1. DO NOT enable RLS
2. DO NOT create policies using `auth.uid()`
3. DO add `shop_id` foreign key for multi-tenancy
4. DO handle authorization in server actions

## Example Server Action

```typescript
export async function getClients() {
  // 1. Verify auth and get shop
  const { shop } = await ensureUserAndShop();

  // 2. Query with shop_id filter
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('shop_id', shop.id); // Application-level filtering

  if (error) throw error;
  return data;
}
```

## Future Considerations

If migrating to Supabase Auth in the future:

1. Update RLS policies to use proper Supabase auth functions
2. Migrate Clerk user IDs to Supabase auth IDs
3. Re-enable RLS on all tables
4. Remove application-level security checks
