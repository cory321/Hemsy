# Supabase Setup Guide

This guide walks through setting up Supabase for Threadfolio V2, including creating tables and configuring authentication.

## Prerequisites

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the Supabase dashboard

## Environment Variables

Add these to your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Database Setup

### 1. Create the Users Table

First, create the users table that syncs with Clerk authentication:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    clerk_user_id TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can view own record" ON public.users
    FOR SELECT USING (auth.uid()::text = clerk_user_id);
```

### 2. Create the Shops Table

```sql
-- Create shops table
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trial_countdown_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own shops" ON public.shops
    FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY "Users can create shops" ON public.shops
    FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can update own shops" ON public.shops
    FOR UPDATE USING (owner_user_id = auth.uid());
```

### 3. Create the Clients Table

Run the migration file at `supabase/migrations/001_create_clients_table.sql` in your Supabase SQL editor:

```sql
-- See supabase/migrations/001_create_clients_table.sql for the full migration
```

## Authentication Setup

### Integrating with Clerk

1. Set up a Clerk webhook to sync users:
   - Endpoint: `/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`

2. The webhook should upsert users into the Supabase users table:

```typescript
// Example webhook handler
export async function POST(req: Request) {
  const { data, type } = await req.json();

  if (type === 'user.created' || type === 'user.updated') {
    await supabase.from('users').upsert(
      {
        clerk_user_id: data.id,
        email: data.email_addresses[0].email_address,
      },
      {
        onConflict: 'clerk_user_id',
      }
    );
  }
}
```

## Using the Clients Feature

### Server Actions

The clients feature provides these server actions:

- `getClients(page, pageSize, filters)` - Get paginated list of clients
- `getClient(clientId)` - Get a single client
- `createClient(clientData)` - Create a new client
- `updateClient(clientId, updates)` - Update a client
- `deleteClient(clientId)` - Delete a client

### Example Usage

```typescript
// In a server component
import { getClients } from '@/lib/actions/clients';

export default async function ClientsPage() {
  const clients = await getClients(1, 10);

  return <ClientsList initialData={clients} />;
}
```

### Client Component

The `ClientsList` component provides:

- Paginated table view
- Search functionality
- Responsive design
- Loading and error states
- Click to navigate to client details

## Testing

Run the test suite to ensure everything is working:

```bash
# Unit tests
npm test src/lib/actions/clients.test.ts
npm test src/components/clients/ClientsList.test.tsx

# Integration tests (requires database)
npm run test:integration
```

## Troubleshooting

### Common Issues

1. **"User not found" error**
   - Ensure the Clerk webhook is properly syncing users
   - Check that the user exists in the users table

2. **"Shop not found" error**
   - Users need to complete onboarding to create a shop
   - Check that the shop exists for the user

3. **RLS policy violations**
   - Verify the RLS policies are correctly set up
   - Check that auth.uid() is properly set in Supabase

### Debugging Tips

1. Check Supabase logs for RLS policy failures
2. Use the Supabase dashboard to verify data
3. Test queries directly in the SQL editor
4. Check browser console for client-side errors

## Next Steps

1. Implement the client detail page (`/clients/[id]`)
2. Create the new client form (`/clients/new`)
3. Add client import/export functionality
4. Integrate clients with orders and appointments
