import { Suspense } from 'react';
import { ensureUserAndShop } from '@/lib/actions/users';
import GarmentsClient from './garments-client';
import Loading from './loading';
import { getGarmentsPaginated } from '@/lib/actions/garments-paginated';
import type { GarmentStage } from '@/types';
type SortField =
  | 'created_at'
  | 'due_date'
  | 'name'
  | 'event_date'
  | 'client_name';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    stage?: string;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
    filter?: string;
  }>;
}

const urlParamToStage: Record<string, GarmentStage> = {
  new: 'New',
  'in-progress': 'In Progress',
  'ready-for-pickup': 'Ready For Pickup',
  done: 'Done',
};

export default async function GarmentsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const { shop } = await ensureUserAndShop();

  const filters = {
    stage: sp.stage ? (urlParamToStage[sp.stage] as GarmentStage) : undefined,
    search: sp.search,
    sortField: (sp.sort || 'created_at') as any,
    sortOrder: (sp.order || 'desc') as 'asc' | 'desc',
    filter: sp.filter as 'due-today' | 'overdue' | undefined,
  };

  const initialData = await getGarmentsPaginated({
    shopId: shop.id,
    ...filters,
    limit: 20,
  });

  // compute stageCounts from first page if provided; fallback to zeros
  const stageCounts =
    initialData.stageCounts ||
    ({
      New: 0,
      'In Progress': 0,
      'Ready For Pickup': 0,
      Done: 0,
    } as Record<string, number>);

  return (
    <Suspense fallback={<Loading />}>
      <GarmentsClient
        initialData={initialData}
        stageCounts={stageCounts}
        shopId={shop.id}
        initialFilters={{
          // Only include optional fields if defined to satisfy exactOptionalPropertyTypes
          ...(filters.stage ? { stage: filters.stage as GarmentStage } : {}),
          ...(filters.search ? { search: filters.search as string } : {}),
          ...(filters.filter ? { filter: filters.filter } : {}),
          sortField: filters.sortField as SortField,
          sortOrder: filters.sortOrder,
        }}
      />
    </Suspense>
  );
}
