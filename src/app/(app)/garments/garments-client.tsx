'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  useOptimistic,
} from 'react';
import { flushSync } from 'react-dom';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  useTheme,
  IconButton,
  Tooltip,
  Typography,
  Skeleton,
} from '@mui/material';
import SearchBar from './components/search-bar';
import GarmentsList from './components/garments-list';
import GarmentCard from '@/components/garments/GarmentCard';
import { InfiniteScrollTrigger } from '@/components/common/InfiniteScrollTrigger';
import type {
  PaginatedGarmentsResponse,
  GarmentListItem,
} from '@/lib/actions/garments-paginated';
import { useDebounce } from '@/hooks/useDebounce';
import type { GarmentStage } from '@/types';
import { updateGarmentStage as updateGarmentStageAction } from './actions/update-garment';
import { loadMoreGarments } from '@/lib/actions/garments-load-more';
import StageBox from '@/components/garments/StageBox';
import { GARMENT_STAGES } from '@/constants/garmentStages';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Grid2 from '@mui/material/Grid2';
import { groupGarmentsByClientName } from '@/utils/garments-sort';
import GarmentCardSkeletonGrid from '@/components/garments/GarmentCardSkeleton';

type SortField =
  | 'created_at'
  | 'due_date'
  | 'name'
  | 'event_date'
  | 'client_name';

interface GarmentsClientProps {
  initialData: PaginatedGarmentsResponse;
  stageCounts: Record<string, number>;
  shopId: string;
  initialFilters: {
    stage?: GarmentStage;
    search?: string;
    filter?: 'due-today' | 'overdue';
    sortField: SortField;
    sortOrder: 'asc' | 'desc';
  };
}

const stageToParam: Record<GarmentStage, string> = {
  New: 'new',
  'In Progress': 'in-progress',
  'Ready For Pickup': 'ready-for-pickup',
  Done: 'done',
};

export default function GarmentsClient({
  initialData,
  stageCounts,
  shopId,
  initialFilters,
}: GarmentsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [searchInput, setSearchInput] = useState(initialFilters.search || '');
  const debouncedSearch = useDebounce(searchInput, 350);

  // Accumulated garments state
  const [allGarments, setAllGarments] = useState(initialData.garments);
  const [nextCursor, setNextCursor] = useState(initialData.nextCursor);
  const [hasMore, setHasMore] = useState(initialData.hasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  const [optimisticGarments, updateOptimisticGarments] = useOptimistic(
    allGarments,
    (
      state: GarmentListItem[],
      { id, updates }: { id: string; updates: Partial<GarmentListItem> }
    ) => state.map((g) => (g.id === id ? { ...g, ...updates } : g))
  );

  // Track current query string locally so we can compose changes even if useSearchParams
  // doesn't immediately reflect router.replace in tests or slower environments.
  const [currentQueryString, setCurrentQueryString] = useState<string>(() => {
    const qs = new URLSearchParams();
    qs.set('sort', initialFilters.sortField);
    qs.set('order', initialFilters.sortOrder);
    if (initialFilters.stage)
      qs.set('stage', stageToParam[initialFilters.stage]);
    if (initialFilters.filter) qs.set('filter', initialFilters.filter);
    if (initialFilters.search) qs.set('search', initialFilters.search);
    return qs.toString();
  });

  // Reset accumulated data when filters change
  useEffect(() => {
    setAllGarments(initialData.garments);
    setNextCursor(initialData.nextCursor);
    setHasMore(initialData.hasMore);
  }, [
    initialData.garments,
    initialData.nextCursor,
    initialData.hasMore,
    initialFilters.stage,
    initialFilters.search,
    initialFilters.sortField,
    initialFilters.sortOrder,
  ]);

  const updateFilters = useCallback(
    (newFilters: Record<string, string | undefined>) => {
      const current = new URLSearchParams(currentQueryString);

      // Seed current params from current selections if missing (so changes compose correctly)
      if (!current.has('sort')) current.set('sort', initialFilters.sortField);
      if (!current.has('order')) current.set('order', initialFilters.sortOrder);
      if (initialFilters.stage && !current.has('stage'))
        current.set('stage', stageToParam[initialFilters.stage]);
      if (initialFilters.filter && !current.has('filter'))
        current.set('filter', initialFilters.filter);
      if (initialFilters.search && !current.has('search'))
        current.set('search', initialFilters.search);

      Object.entries(newFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '')
          current.set(key, value);
        else current.delete(key);
      });
      // Always remove cursor when updating filters
      current.delete('cursor');

      // If stage or filter is changing, clear search as well to avoid stale results
      if ('stage' in newFilters || 'filter' in newFilters) {
        current.delete('search');
        setSearchInput('');
      }
      const next = current.toString();
      startTransition(() => {
        router.replace(`${pathname}?${next}`, { scroll: false });
        setCurrentQueryString(next);
      });
    },
    [router, pathname, currentQueryString, initialFilters]
  );

  // Keep local query string in sync if initialFilters prop changes
  useEffect(() => {
    const qs = new URLSearchParams();
    qs.set('sort', initialFilters.sortField);
    qs.set('order', initialFilters.sortOrder);
    if (initialFilters.stage)
      qs.set('stage', stageToParam[initialFilters.stage]);
    if (initialFilters.filter) qs.set('filter', initialFilters.filter);
    if (initialFilters.search) qs.set('search', initialFilters.search);
    setCurrentQueryString(qs.toString());
  }, [
    initialFilters.stage,
    initialFilters.filter,
    initialFilters.sortField,
    initialFilters.sortOrder,
    initialFilters.search,
  ]);

  useEffect(() => {
    const prev = initialFilters.search ?? '';
    const next = debouncedSearch ?? '';
    if (next !== prev) {
      updateFilters({
        search: next || undefined,
      });
    }
  }, [debouncedSearch, initialFilters.search, updateFilters]);

  const handleStageUpdate = useCallback(
    (garmentId: string, newStage: GarmentStage) => {
      startTransition(async () => {
        updateOptimisticGarments({
          id: garmentId,
          updates: { stage: newStage, stage_name: newStage },
        });
        try {
          await updateGarmentStageAction(shopId, garmentId, newStage);
          router.refresh();
        } catch (e) {
          // On failure, a refresh will restore server truth
          router.refresh();
        }
      });
    },
    [router, shopId, updateOptimisticGarments]
  );

  const onLoadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;

    setIsLoadingMore(true);
    setLoadError(null);

    try {
      const params = {
        shopId,
        cursor: nextCursor,
        sortField: initialFilters.sortField,
        sortOrder: initialFilters.sortOrder,
        ...(initialFilters.stage && { stage: initialFilters.stage }),
        ...(initialFilters.search && { search: initialFilters.search }),
        ...(initialFilters.filter && { filter: initialFilters.filter }),
      };

      const result = await loadMoreGarments(params);

      if (!result) {
        throw new Error('No result returned from loadMoreGarments');
      }

      // Use flushSync to ensure all state updates happen atomically
      // This prevents layout thrashing during content insertion
      flushSync(() => {
        // Append new garments to existing ones, filtering out duplicates
        setAllGarments((prev) => {
          const existingIds = new Set(prev.map((g) => g.id));
          const newGarments = result.garments.filter(
            (g) => !existingIds.has(g.id)
          );
          return [...prev, ...newGarments];
        });
        setNextCursor(result.nextCursor);
        setHasMore(result.hasMore);
      });
    } catch (error) {
      console.error('Error loading more garments:', error);
      setLoadError(
        error instanceof Error
          ? error
          : new Error('Failed to load more garments')
      );
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore, shopId, initialFilters]);

  const totalAll =
    initialData.totalGarmentsCount ??
    Object.values(stageCounts || {}).reduce((a, b) => a + (b || 0), 0);

  const isGroupedByClient = initialFilters.sortField === 'client_name';
  const grouped = useMemo(() => {
    return isGroupedByClient
      ? groupGarmentsByClientName(
          optimisticGarments as any,
          initialFilters.sortOrder
        )
      : null;
  }, [isGroupedByClient, optimisticGarments, initialFilters.sortOrder]);

  // const renderSkeletonGrid = () => (
  // 	<Grid2 container spacing={3} columns={{ xs: 4, sm: 8, md: 12, lg: 20 }}>
  // 		{Array.from({ length: 12 }).map((_, idx) => (
  // 			<Grid2 key={idx} size={{ xs: 4, sm: 4, md: 4, lg: 4 }}>
  // 				<Box
  // 					sx={{
  // 						borderTop: '4px solid',
  // 						borderTopColor: 'divider',
  // 						borderRadius: 1,
  // 						p: 2,
  // 					}}
  // 				>
  // 					<Skeleton
  // 						variant="rectangular"
  // 						height={160}
  // 						sx={{ mb: 1, borderRadius: 1 }}
  // 					/>
  // 					<Skeleton variant="text" width="80%" height={24} />
  // 					<Skeleton variant="text" width="60%" height={18} />
  // 					<Skeleton
  // 						variant="rectangular"
  // 						width={100}
  // 						height={20}
  // 						sx={{ borderRadius: 10, mt: 1 }}
  // 					/>
  // 				</Box>
  // 			</Grid2>
  // 		))}
  // 	</Grid2>
  // );

  return (
    <Box
      sx={{
        p: 3,
        minHeight: '100vh',
        // Enable scroll anchoring to maintain scroll position during content changes
        overflowAnchor: 'auto',
        // Optimize rendering performance
        contain: 'layout',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        {!isMobile ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <StageBox
              stage={{ name: 'View All', count: totalAll }}
              isSelected={!initialFilters.stage}
              onClick={() =>
                updateFilters({
                  stage: undefined,
                  cursor: undefined,
                  filter: undefined,
                })
              }
              isLast={false}
            />
            {GARMENT_STAGES.map((stage, index) => (
              <StageBox
                key={stage.name}
                stage={{
                  name: stage.displayName,
                  color: stage.color,
                  count: stageCounts[stage.name] || 0,
                }}
                isSelected={initialFilters.stage === stage.name}
                onClick={() =>
                  updateFilters({
                    stage: stageToParam[stage.name],
                    cursor: undefined,
                    filter: undefined,
                  })
                }
                isLast={index === GARMENT_STAGES.length - 1}
              />
            ))}
          </Box>
        ) : (
          <FormControl fullWidth size="small">
            <InputLabel>Stage</InputLabel>
            <Select
              label="Stage"
              value={initialFilters.stage || 'all'}
              onChange={(e) => {
                const value = e.target.value as string;
                updateFilters({
                  stage:
                    value === 'all'
                      ? undefined
                      : stageToParam[value as GarmentStage],
                  cursor: undefined,
                  filter: undefined,
                });
              }}
            >
              <MenuItem value="all">View All ({totalAll})</MenuItem>
              {GARMENT_STAGES.map((stage) => (
                <MenuItem key={stage.name} value={stage.name}>
                  {stage.displayName} ({stageCounts[stage.name] || 0})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {/* Search + Sort row */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
          }}
        >
          <Box sx={{ flex: 1, minWidth: 260 }}>
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              placeholder="Search garments by name, notes, or client name..."
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="filter-label">Filter By</InputLabel>
              <Select
                labelId="filter-label"
                label="Filter By"
                value={initialFilters.filter || 'all'}
                onChange={(e) => {
                  const value = e.target.value as string;
                  updateFilters({
                    filter: value === 'all' ? undefined : value,
                    cursor: undefined,
                  });
                }}
                MenuProps={{
                  disableScrollLock: true,
                }}
              >
                <MenuItem value="all">All Garments</MenuItem>
                <MenuItem value="due-today">Due Today</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id="sort-label">Sort By</InputLabel>
              <Select
                labelId="sort-label"
                label="Sort By"
                value={initialFilters.sortField}
                onChange={(e) =>
                  updateFilters({
                    sort: e.target.value as string,
                    cursor: undefined,
                  })
                }
                MenuProps={{
                  disableScrollLock: true,
                }}
              >
                <MenuItem value="due_date">Due Date</MenuItem>
                <MenuItem value="created_at">Created Date</MenuItem>
                <MenuItem value="client_name">Client Name</MenuItem>
                <MenuItem value="name">Garment Name</MenuItem>
              </Select>
            </FormControl>
            <Tooltip
              title={
                initialFilters.sortOrder === 'asc' ? 'Ascending' : 'Descending'
              }
            >
              <IconButton
                size="small"
                onClick={() =>
                  updateFilters({
                    order: initialFilters.sortOrder === 'asc' ? 'desc' : 'asc',
                    cursor: undefined,
                  })
                }
              >
                {initialFilters.sortOrder === 'asc' ? (
                  <ArrowUpwardIcon />
                ) : (
                  <ArrowDownwardIcon />
                )}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Content: pending skeleton vs. grouped or list */}
      {isPending ? (
        <GarmentCardSkeletonGrid count={8} />
      ) : isGroupedByClient && grouped ? (
        <Box>
          {/* Show "No garments found" if there are no garments in grouped view */}
          {grouped.sortedClientNames.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="body1" color="text.secondary">
                No garments found
                {typeof initialData.totalCount === 'number'
                  ? ` (0/${initialData.totalCount})`
                  : ''}
              </Typography>
            </Box>
          ) : (
            <>
              {grouped.sortedClientNames.map((clientName) => (
                <Box key={clientName} sx={{ mb: 4 }}>
                  <Box
                    sx={{
                      borderBottom: 2,
                      borderColor: 'divider',
                      pb: 1,
                      mb: 2,
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 1,
                    }}
                  >
                    <Typography variant="h6" component="h2">
                      {clientName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ({(grouped.groups[clientName] || []).length} garment
                      {(grouped.groups[clientName] || []).length !== 1
                        ? 's'
                        : ''}
                      )
                    </Typography>
                  </Box>
                  <Grid2
                    container
                    spacing={3}
                    columns={{ xs: 4, sm: 8, md: 12, lg: 20 }}
                  >
                    {(grouped.groups[clientName] || []).map((g) => (
                      <Grid2 key={g.id} size={{ xs: 4, sm: 4, md: 4, lg: 4 }}>
                        <GarmentCard
                          garment={g as any}
                          orderId={(g as any).order_id}
                        />
                      </Grid2>
                    ))}
                  </Grid2>
                </Box>
              ))}

              {/* Show loading skeleton when loading more in grouped view */}
              {isLoadingMore && (
                <Box sx={{ mt: 3 }}>
                  <GarmentCardSkeletonGrid count={4} />
                </Box>
              )}

              {/* Infinite scroll trigger for grouped view */}
              {hasMore && (
                <InfiniteScrollTrigger
                  onLoadMore={onLoadMore}
                  hasMore={hasMore}
                  isLoading={isLoadingMore}
                  loadMoreText="Load more garments"
                  loadingText="Loading more garments..."
                  endText="All garments loaded"
                  showFallbackPagination={false}
                />
              )}
            </>
          )}
        </Box>
      ) : (
        <GarmentsList
          garments={optimisticGarments}
          isLoading={isLoadingMore}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          totalCount={initialData.totalCount}
          error={loadError}
        />
      )}
    </Box>
  );
}
