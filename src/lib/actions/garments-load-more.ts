'use server';

import { getGarmentsPaginated } from './garments-paginated';
import type { GarmentStage } from '@/types';

type SortField =
  | 'created_at'
  | 'due_date'
  | 'name'
  | 'event_date'
  | 'client_name';

interface LoadMoreGarmentsParams {
  shopId: string;
  cursor: {
    lastId: string;
    lastCreatedAt: string;
    lastClientName?: string;
    lastDueDate?: string;
  };
  stage?: GarmentStage;
  search?: string;
  filter?: 'due-today' | 'overdue';
  sortField: SortField;
  sortOrder: 'asc' | 'desc';
}

export async function loadMoreGarments({
  shopId,
  cursor,
  stage,
  search,
  filter,
  sortField,
  sortOrder,
}: LoadMoreGarmentsParams) {
  const result = await getGarmentsPaginated({
    shopId,
    cursor,
    stage,
    search,
    filter,
    sortField,
    sortOrder,
    limit: 20,
    includeCancelled: false,
    onlyCancelled: false,
  });

  return result;
}
