'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

// Get calendar settings
export async function getCalendarSettings() {
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

  const { data, error } = await supabase
    .from('calendar_settings')
    .select('*')
    .eq('shop_id', shopData.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw new Error('Failed to fetch calendar settings');
  }

  // Return default settings if none exist
  return (
    data || {
      buffer_time_minutes: 0,
      default_appointment_duration: 30,
      send_reminders: true,
      reminder_hours_before: 24,
    }
  );
}

// Update calendar settings
export async function updateCalendarSettings(settings: {
  buffer_time_minutes: number;
  default_appointment_duration: number;
  send_reminders: boolean;
  reminder_hours_before: number;
}) {
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

  const { error } = await supabase.from('calendar_settings').upsert(
    {
      shop_id: shopData.id,
      ...settings,
    },
    { onConflict: 'shop_id' }
  );

  if (error) throw new Error('Failed to update calendar settings');

  revalidatePath('/settings');
  revalidatePath('/appointments');
}
