import { getGarmentById } from '@/lib/actions/orders';
import { getShopHours } from '@/lib/actions/shop-hours';
import { getCalendarSettings } from '@/lib/actions/calendar-settings';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import GarmentDetailPageClient from './GarmentDetailPageClient';

export default async function GarmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Await params directly in Server Components (Next.js 15)
  const { id } = await params;
  const sp = (await searchParams) || {};
  const from =
    typeof sp.from === 'string'
      ? sp.from
      : Array.isArray(sp.from)
        ? sp.from[0]
        : undefined;
  const orderId =
    typeof sp.orderId === 'string'
      ? sp.orderId
      : Array.isArray(sp.orderId)
        ? sp.orderId[0]
        : undefined;

  // Fetch garment data from Supabase
  const result = await getGarmentById(id);

  if (!result.success || !result.garment) {
    notFound();
  }

  const garment = result.garment as any;

  // Get shop data for appointments functionality
  let shopData = null;
  let shopHours: any[] = [];
  let calendarSettings = {
    buffer_time_minutes: 0,
    default_appointment_duration: 30,
  };

  try {
    const { userId } = await auth();
    if (userId) {
      const supabase = await createClient();

      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', userId)
        .single();

      if (userData) {
        const { data: shop } = await supabase
          .from('shops')
          .select('id')
          .eq('owner_user_id', userData.id)
          .single();

        if (shop) {
          shopData = shop;
          // Fetch shop hours and calendar settings in parallel
          const [rawShopHours, rawCalendarSettings] = await Promise.all([
            getShopHours(),
            getCalendarSettings(),
          ]);

          shopHours = rawShopHours;
          calendarSettings = {
            buffer_time_minutes: rawCalendarSettings.buffer_time_minutes ?? 0,
            default_appointment_duration:
              rawCalendarSettings.default_appointment_duration ?? 30,
          };
        }
      }
    }
  } catch (error) {
    console.error('Error fetching shop data:', error);
    // Continue without shop data - appointment functionality will be disabled
  }

  return (
    <GarmentDetailPageClient
      garment={garment}
      shopId={shopData?.id}
      shopHours={shopHours.map((hour: any) => ({
        day_of_week: hour.day_of_week,
        open_time: hour.open_time,
        close_time: hour.close_time,
        is_closed: hour.is_closed ?? false,
      }))}
      calendarSettings={calendarSettings}
      {...(from && { from })}
      {...(orderId && { orderId })}
    />
  );
}
