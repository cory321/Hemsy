import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getShopHours } from '@/lib/actions/shop-hours';
import { getCalendarSettings } from '@/lib/actions/calendar-settings';
import { BusinessOverviewClient } from './BusinessOverviewClient';
import type { ShopHours } from '@/types';

async function getShopId() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const supabase = await createClient();

  // Get user's shop
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (userError || !userData) redirect('/onboarding');

  const { data: shopData, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_user_id', userData.id)
    .single();

  if (shopError || !shopData) redirect('/onboarding');

  return shopData.id;
}

export async function BusinessOverviewServer() {
  // Get shop ID first
  const shopId = await getShopId();

  // Fetch shop hours and calendar settings
  const [rawShopHours, calendarSettings] = await Promise.all([
    getShopHours(),
    getCalendarSettings(),
  ]);

  const shopHours: ShopHours[] = (rawShopHours as any[]).map((h) => ({
    day_of_week: h.day_of_week,
    open_time: h.open_time,
    close_time: h.close_time,
    is_closed: !!h.is_closed,
  }));

  const normalizedCalendarSettings = {
    buffer_time_minutes: calendarSettings.buffer_time_minutes ?? 0,
    default_appointment_duration:
      calendarSettings.default_appointment_duration ?? 30,
  } as const;

  return (
    <BusinessOverviewClient
      shopId={shopId}
      shopHours={shopHours}
      calendarSettings={normalizedCalendarSettings}
    />
  );
}
