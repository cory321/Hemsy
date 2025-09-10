'use server';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Service role client for static data that doesn't require user authentication
 * This client can be used with unstable_cache since it doesn't use cookies
 */
export function createStaticClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key, not anon key
    {
      auth: {
        persistSession: false, // No session needed for static data
      },
    }
  );
}

/**
 * Check if we have the service role key available
 */
export function hasServiceRoleKey(): boolean {
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}
