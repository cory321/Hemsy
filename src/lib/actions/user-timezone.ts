'use server';

/**
 * Server actions for retrieving user timezone information
 * These can be safely called from client components
 */

import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

/**
 * Get the current authenticated user's timezone
 * @returns Timezone string (defaults to 'America/New_York' if not set)
 */
export async function getCurrentUserTimezone(): Promise<string> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return 'America/New_York';
  }

  const supabase = await createClient();

  // Get the Supabase user ID from Clerk ID
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, timezone')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (userError || !userData?.timezone) {
    console.warn('Failed to get current user timezone, using default');
    return 'America/New_York';
  }

  return userData.timezone;
}

/**
 * Get the timezone for a specific shop
 * @param shopId - UUID of the shop
 * @returns Timezone string (defaults to 'America/New_York' if not set)
 */
export async function getShopTimezone(shopId: string): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('shops')
    .select('timezone')
    .eq('id', shopId)
    .single();

  if (error || !data?.timezone) {
    console.warn(`Failed to get timezone for shop ${shopId}, using default`);
    return 'America/New_York';
  }

  return data.timezone;
}

/**
 * Get the timezone for a specific user
 * @param userId - Supabase user ID (not Clerk ID)
 * @returns Timezone string (defaults to 'America/New_York' if not set)
 */
export async function getUserTimezone(userId: string): Promise<string> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('timezone')
    .eq('id', userId)
    .single();

  if (error || !data?.timezone) {
    console.warn(`Failed to get timezone for user ${userId}, using default`);
    return 'America/New_York';
  }

  return data.timezone;
}
