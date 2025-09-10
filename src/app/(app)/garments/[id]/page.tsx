import { getGarmentById } from '@/lib/actions/orders';
import {
  getShopHours,
  getCalendarSettings,
} from '@/lib/actions/static-data-cache';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
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

  // Get shop data and settings using optimized functions
  let shopData = null;
  let shopHours: any[] = [];
  let calendarSettings = {
    buffer_time_minutes: 0,
    default_appointment_duration: 30,
  };

  try {
    // Use optimized ensureUserAndShop instead of manual queries (single call)
    const { user, shop } = await ensureUserAndShop();
    shopData = shop;

    // Fetch shop hours and calendar settings in parallel using cached functions
    const [rawShopHours, rawCalendarSettings] = await Promise.all([
      getShopHours(shop.id),
      getCalendarSettings(shop.id),
    ]);

    shopHours = rawShopHours || [];
    calendarSettings = {
      buffer_time_minutes: rawCalendarSettings?.buffer_time_minutes ?? 0,
      default_appointment_duration:
        rawCalendarSettings?.default_appointment_duration ?? 30,
    };
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
