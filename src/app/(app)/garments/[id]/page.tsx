import { getGarmentById } from '@/lib/actions/orders';
import { getShopHours } from '@/lib/actions/shop-hours';
import { getCalendarSettings } from '@/lib/actions/static-data-cache';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { prefetchGarmentBalanceStatus } from '@/lib/actions/garment-balance-check';
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
  let balanceStatus = null;

  try {
    // Use optimized ensureUserAndShop instead of manual queries (single call)
    const { user, shop } = await ensureUserAndShop();
    shopData = shop;

    // Fetch shop hours, calendar settings, and balance status in parallel using cached functions
    const [rawShopHours, rawCalendarSettings, rawBalanceStatus] =
      await Promise.all([
        getShopHours(),
        getCalendarSettings(shop.id),
        garment.stage === 'Ready For Pickup'
          ? prefetchGarmentBalanceStatus(id, shop.id)
          : Promise.resolve(null),
      ]);

    shopHours = rawShopHours || [];
    calendarSettings = {
      buffer_time_minutes: rawCalendarSettings?.buffer_time_minutes ?? 0,
      default_appointment_duration:
        rawCalendarSettings?.default_appointment_duration ?? 30,
    };

    // Process balance status if available
    if (rawBalanceStatus && rawBalanceStatus.success) {
      balanceStatus = {
        isLastGarment: rawBalanceStatus.isLastGarment || false,
        hasOutstandingBalance: rawBalanceStatus.hasOutstandingBalance || false,
        balanceDue: rawBalanceStatus.balanceDue || 0,
        orderNumber: rawBalanceStatus.orderNumber || '',
        orderTotal: rawBalanceStatus.orderTotal || 0,
        paidAmount: rawBalanceStatus.paidAmount || 0,
        clientName: rawBalanceStatus.clientName || '',
        ...(rawBalanceStatus.invoiceId && {
          invoiceId: rawBalanceStatus.invoiceId,
        }),
        ...(rawBalanceStatus.clientEmail && {
          clientEmail: rawBalanceStatus.clientEmail,
        }),
      };
    }
  } catch (error) {
    console.error('Error fetching shop data:', error);
    // Continue without shop data - appointment functionality will be disabled
  }

  return (
    <GarmentDetailPageClient
      garment={garment}
      initialBalanceStatus={balanceStatus}
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
