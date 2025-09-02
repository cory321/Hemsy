/**
 * Helper functions for retrieving user and shop timezones
 */

import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

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
 * Update a user's timezone
 * @param userId - Supabase user ID
 * @param timezone - IANA timezone string
 * @param offset - Optional timezone offset in minutes
 */
export async function updateUserTimezone(
  userId: string,
  timezone: string,
  offset?: number
): Promise<void> {
  const supabase = await createClient();

  const updateData: any = { timezone };
  if (offset !== undefined) {
    updateData.timezone_offset = offset;
  }

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update user timezone: ${error.message}`);
  }
}

/**
 * Update a shop's timezone
 * @param shopId - Shop UUID
 * @param timezone - IANA timezone string
 * @param offset - Optional timezone offset in minutes
 */
export async function updateShopTimezone(
  shopId: string,
  timezone: string,
  offset?: number
): Promise<void> {
  const supabase = await createClient();

  const updateData: any = { timezone };
  if (offset !== undefined) {
    updateData.timezone_offset = offset;
  }

  const { error } = await supabase
    .from('shops')
    .update(updateData)
    .eq('id', shopId);

  if (error) {
    throw new Error(`Failed to update shop timezone: ${error.message}`);
  }
}
