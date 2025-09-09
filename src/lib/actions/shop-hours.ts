'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';

// Get shop hours
export async function getShopHours() {
  const { shop } = await ensureUserAndShop();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('shop_hours')
    .select('*')
    .eq('shop_id', shop.id)
    .order('day_of_week');

  if (error) throw new Error('Failed to fetch shop hours');

  // If no shop hours exist, return default hours
  if (!data || data.length === 0) {
    return getDefaultShopHours();
  }

  return data;
}

// Get default shop hours (Mon-Fri 9-5, Sat-Sun closed)
function getDefaultShopHours() {
  const defaultHours = [];
  for (let day = 0; day <= 6; day++) {
    if (day === 0 || day === 6) {
      // Sunday or Saturday - closed
      defaultHours.push({
        day_of_week: day,
        open_time: null,
        close_time: null,
        is_closed: true,
      });
    } else {
      // Monday to Friday - 9 AM to 5 PM
      defaultHours.push({
        day_of_week: day,
        open_time: '09:00',
        close_time: '17:00',
        is_closed: false,
      });
    }
  }
  return defaultHours;
}

// Update shop hours
export async function updateShopHours(
  hours: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = await createClient();

  // Get user's shop
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (userError) throw new Error('Failed to fetch user');

  const { data: shopData, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_user_id', userData.id)
    .single();

  if (shopError) throw new Error('Failed to fetch shop');

  // Upsert shop hours
  const { error } = await supabase.from('shop_hours').upsert(
    hours.map((hour) => ({
      shop_id: shopData.id,
      ...hour,
    })),
    { onConflict: 'shop_id,day_of_week' }
  );

  if (error) throw new Error('Failed to update shop hours');

  revalidatePath('/settings');
  revalidatePath('/appointments');
}
