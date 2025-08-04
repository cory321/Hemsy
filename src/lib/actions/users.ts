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
 */
export async function ensureUserAndShop(): Promise<UserWithShop> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error('Could not fetch user details');
  }

  const supabase = await createSupabaseClient();

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
    // Create a default shop for the user
    const shopName =
      clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}'s Shop`
        : `${clerkUser.username || 'My'} Shop`;

    const { data: newShop, error: createShopError } = await supabase
      .from('shops')
      .upsert(
        {
          owner_user_id: userData!.id,
          name: shopName,
          trial_countdown_enabled: false,
        },
        {
          onConflict: 'owner_user_id',
        }
      )
      .select()
      .single();

    if (createShopError) {
      console.error('Error creating shop:', createShopError);
      throw new Error(`Failed to create shop: ${createShopError.message}`);
    }

    if (!newShop) {
      throw new Error('Failed to create shop - no data returned');
    }

    shopData = newShop;
  } else if (shopError) {
    console.error('Error fetching shop:', shopError);
    throw new Error(`Failed to fetch shop: ${shopError.message}`);
  }

  return {
    user: userData!,
    shop: shopData!,
  };
}
