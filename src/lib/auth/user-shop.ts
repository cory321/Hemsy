'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/supabase';

export interface UserWithShop {
  user: Tables<'users'>;
  shop: Tables<'shops'>;
}

/**
 * Ensures that a user and their shop exist in the database.
 * Creates them if they don't exist.
 * This function is idempotent and handles race conditions.
 */
export async function ensureUserAndShop(): Promise<UserWithShop> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized - no Clerk user ID found');
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error('Could not fetch user details from Clerk');
  }

  const supabase = await createSupabaseClient();

  // Log the attempt for debugging
  console.log(
    `[ensureUserAndShop] Processing user: ${userId}, email: ${clerkUser.emailAddresses[0]?.emailAddress}`
  );

  // First, try to get the user
  let userData: Tables<'users'> | null;
  let userError: any;

  const userResult = await supabase
    .from('users')
    .select('*')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  userData = userResult.data;
  userError = userResult.error;

  // If user doesn't exist, create them
  if (!userData) {
    // Create new user - we'll use upsert to handle race conditions
    const { data: newUser, error: createUserError } = await supabase
      .from('users')
      .upsert(
        {
          clerk_user_id: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          role: 'user',
          first_name: clerkUser.firstName || 'User',
          last_name: clerkUser.lastName || '',
        },
        {
          onConflict: 'clerk_user_id',
        }
      )
      .select()
      .single();

    if (createUserError) {
      console.error('Error creating user:', createUserError);
      throw new Error(`Failed to create user: ${createUserError.message}`);
    }

    if (!newUser) {
      throw new Error('Failed to create user - no data returned');
    }

    userData = newUser;
  } else if (userError) {
    console.error('Error fetching user:', userError);
    throw new Error(`Failed to fetch user: ${userError.message}`);
  }

  // Now check for the shop
  let shopData: Tables<'shops'> | null;
  let shopError: any;

  const shopResult = await supabase
    .from('shops')
    .select('*')
    .eq('owner_user_id', userData!.id)
    .maybeSingle();

  shopData = shopResult.data;
  shopError = shopResult.error;

  // If shop doesn't exist, create it
  if (!shopData) {
    // Generate a proper shop name based on user data
    let shopName: string;

    if (clerkUser.firstName && clerkUser.lastName) {
      // Ideal case: we have both first and last name
      shopName = `${clerkUser.firstName} ${clerkUser.lastName}'s Shop`;
    } else if (clerkUser.firstName) {
      // Only first name available
      shopName = `${clerkUser.firstName}'s Shop`;
    } else if (clerkUser.username) {
      // Fall back to username
      shopName = `${clerkUser.username}'s Shop`;
    } else {
      // Last resort: use email prefix
      const emailPrefix =
        clerkUser.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User';
      shopName = `${emailPrefix}'s Shop`;
    }

    console.log(
      `[ensureUserAndShop] Creating shop for user ${userData!.id} with name: ${shopName}`
    );

    const { data: newShop, error: createShopError } = await supabase
      .from('shops')
      .upsert(
        {
          owner_user_id: userData!.id,
          name: shopName,
          // Initialize with user's email for communication
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          trial_countdown_enabled: false,
          onboarding_completed: false,
          // Set a default trial end date (14 days from now)
          trial_end_date: new Date(
            Date.now() + 14 * 24 * 60 * 60 * 1000
          ).toISOString(),
        },
        {
          onConflict: 'owner_user_id',
        }
      )
      .select()
      .single();

    if (createShopError) {
      console.error(
        '[ensureUserAndShop] Error creating shop:',
        createShopError
      );
      throw new Error(`Failed to create shop: ${createShopError.message}`);
    }

    if (!newShop) {
      throw new Error('Failed to create shop - no data returned');
    }

    console.log(
      `[ensureUserAndShop] Successfully created shop ${newShop.id} for user ${userData!.id}`
    );
    shopData = newShop;
  } else if (shopError) {
    console.error('[ensureUserAndShop] Error fetching shop:', shopError);
    throw new Error(`Failed to fetch shop: ${shopError.message}`);
  }

  return {
    user: userData!,
    shop: shopData!,
  };
}

/**
 * Gets the display name for a shop, preferring business_name over name
 */
// Removed display helper; use '@/lib/utils/shop' instead to avoid mixing with server actions
