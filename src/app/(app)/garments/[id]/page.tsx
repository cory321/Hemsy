import { getGarmentById } from '@/lib/actions/orders';
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

  return (
    <GarmentDetailPageClient
      garment={garment}
      {...(from && { from })}
      {...(orderId && { orderId })}
    />
  );
}
