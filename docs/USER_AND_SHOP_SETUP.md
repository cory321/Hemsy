# User and Shop Auto-Creation

## Overview

The application now automatically creates user and shop records in Supabase when a Clerk-authenticated user accesses the application for the first time. This ensures a seamless experience without requiring manual user setup.

## Important: Security Model

Since we're using Clerk for authentication (not Supabase Auth), Row Level Security (RLS) has been **disabled** on the `users` and `shops` tables. Security is enforced at the application layer through server actions that verify Clerk authentication before any database operations.

## How It Works

### 1. Authentication Flow

```
Clerk Auth → ensureUserAndShop() → Supabase Records
```

### 2. The `ensureUserAndShop()` Function

Located in `src/lib/actions/users.ts`, this function:

1. **Checks Clerk Authentication**: Verifies the user is authenticated with Clerk
2. **Fetches Clerk User Data**: Gets the user's email and name from Clerk
3. **Creates/Retrieves User Record**:
   - Checks if a user exists with the Clerk user ID
   - If not, creates a new user record in Supabase
4. **Creates/Retrieves Shop Record**:
   - Checks if the user has a shop
   - If not, creates a default shop with a generated name

### 3. Implementation Details

```typescript
export async function ensureUserAndShop(): Promise<UserWithShop> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Get Clerk user details
  const clerkUser = await currentUser();

  // Create or get user in Supabase
  let userData = await getOrCreateUser(userId, clerkUser);

  // Create or get shop for user
  let shopData = await getOrCreateShop(userData);

  return { user: userData, shop: shopData };
}
```

### 4. Usage in Server Actions

All client-related server actions now use this pattern:

```typescript
export async function getClients() {
  const { shop } = await ensureUserAndShop();
  // Now we have a guaranteed shop to query against
  const clients = await supabase
    .from('clients')
    .select('*')
    .eq('shop_id', shop.id);
}
```

## Benefits

1. **Seamless Onboarding**: Users don't need manual database setup
2. **Error Prevention**: Eliminates "User not found" errors
3. **Consistent Data**: Ensures every authenticated user has required records
4. **Simplified Code**: Server actions don't need to handle missing user/shop cases

## Testing

The `ensureUserAndShop` function is mocked in tests to provide consistent test data:

```typescript
mockEnsureUserAndShop.mockResolvedValue({
  user: { id: 'user_123', clerk_user_id: 'clerk_123', ... },
  shop: { id: 'shop_123', owner_user_id: 'user_123', ... }
});
```

## Troubleshooting

### "Failed to create user" Error

This error can occur if:

1. The Supabase connection fails
2. The email address is missing from Clerk user data
3. Database constraints are violated

The function now provides detailed error messages in the console to help diagnose issues.

### "Failed to create shop" Error

This error can occur if:

1. The user record wasn't created successfully
2. Database constraints are violated
3. Network issues with Supabase

Check the console logs for detailed error messages.

## Database Schema Notes

- **Unique Constraints**:
  - `users.clerk_user_id` - Ensures one user per Clerk ID
  - `shops.owner_user_id` - Ensures one shop per user
- **Upsert Operations**: Both user and shop creation use `upsert` to handle race conditions
- **RLS Disabled**: Since we use Clerk auth, RLS is disabled on users/shops tables

## Future Improvements

1. **Custom Shop Names**: Allow users to customize their shop name during onboarding
2. **Multiple Shops**: Support users having multiple shops
3. **Shop Settings**: Add more default settings when creating shops
4. **Onboarding Flow**: Create a dedicated onboarding UI for new users
5. **Re-enable RLS**: Implement custom RLS policies that work with Clerk authentication
