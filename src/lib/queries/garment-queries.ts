'use client';

import {
  useInfiniteQuery,
  useQueryClient,
  UseInfiniteQueryOptions,
  keepPreviousData,
} from '@tanstack/react-query';
import {
  getGarmentsPaginated,
  type GetGarmentsPaginatedParams,
  type PaginatedGarmentsResponse,
  type GarmentListItem,
} from '@/lib/actions/garments-paginated';

// Query key factory
export const garmentKeys = {
  all: ['garments'] as const,
  lists: () => [...garmentKeys.all, 'list'] as const,
  list: (shopId: string, filters?: Partial<GetGarmentsPaginatedParams>) =>
    [...garmentKeys.lists(), shopId, filters] as const,
};

interface UseGarmentsPaginatedOptions {
  shopId: string;
  limit?: number;
  sortField?: GetGarmentsPaginatedParams['sortField'];
  sortOrder?: GetGarmentsPaginatedParams['sortOrder'];
  stage?: GetGarmentsPaginatedParams['stage'];
  search?: GetGarmentsPaginatedParams['search'];
  enabled?: boolean;
}

export function useGarmentsPaginated(options: UseGarmentsPaginatedOptions) {
  const queryClient = useQueryClient();
  const { shopId, enabled = true, ...filters } = options;

  const result = useInfiniteQuery({
    queryKey: garmentKeys.list(shopId, filters),
    queryFn: async ({ pageParam }) => {
      return getGarmentsPaginated({
        shopId,
        cursor: pageParam,
        limit: filters.limit ?? 20,
        sortField: filters.sortField ?? 'created_at',
        sortOrder: filters.sortOrder ?? 'desc',
        stage: filters.stage,
        search: filters.search,
      });
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as
      | {
          lastId: string;
          lastCreatedAt: string;
          lastClientName?: string;
          lastDueDate?: string;
        }
      | undefined,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled,
    placeholderData: keepPreviousData,
  });

  // Flatten all pages into a single array and de-duplicate by id
  const garments = (() => {
    const pages = result.data?.pages as PaginatedGarmentsResponse[] | undefined;
    if (!pages) return [] as GarmentListItem[];
    const map = new Map<string, GarmentListItem>();
    for (const page of pages) {
      for (const g of page.garments) {
        if (!map.has(g.id)) map.set(g.id, g);
      }
    }
    return Array.from(map.values());
  })();
  const totalCount = result.data?.pages[0]?.totalCount;
  const totalGarmentsCount = result.data?.pages[0]?.totalGarmentsCount;
  const stageCounts = (
    result.data?.pages?.[0] as PaginatedGarmentsResponse | undefined
  )?.stageCounts;

  // Prefetch next page when user is near the bottom
  const prefetchNextPage = () => {
    if (result.hasNextPage && !result.isFetchingNextPage) {
      result.fetchNextPage();
    }
  };

  return {
    garments,
    totalCount,
    totalGarmentsCount,
    stageCounts,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
    isError: result.isError,
    error: result.error,
    fetchNextPage: result.fetchNextPage,
    hasNextPage: result.hasNextPage,
    isFetchingNextPage: result.isFetchingNextPage,
    refetch: result.refetch,
    prefetchNextPage,
    isPlaceholderData: result.isPlaceholderData,
  };
}

// Helper hook for search with debounce
import { useDebounce } from '@/hooks/useDebounce';
import { useState } from 'react';

export function useGarmentsSearch(
  shopId: string,
  initialFilters?: Partial<GetGarmentsPaginatedParams>,
  options?: { enabled?: boolean }
) {
  const [search, setSearch] = useState(initialFilters?.search || '');
  const [filters, setFilters] = useState(initialFilters || {});

  // Debounce search and require at least 2 chars before issuing a server query
  const debouncedSearch = useDebounce(search, 350);

  const result = useGarmentsPaginated({
    shopId,
    ...filters,
    search:
      debouncedSearch && debouncedSearch.length >= 2 ? debouncedSearch : '',
    enabled: options?.enabled ?? true,
  });

  return {
    ...result,
    search,
    setSearch,
    filters,
    setFilters,
  };
}
