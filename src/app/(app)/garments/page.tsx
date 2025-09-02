'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment,
  Paper,
  Skeleton,
  Card,
  CardContent,
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';

import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

import { GARMENT_STAGES, getStageColor } from '@/constants/garmentStages';
import { getCurrentUserShop } from '@/lib/actions/shops';
import GarmentCard from '@/components/garments/GarmentCard';
import { GarmentStage } from '@/types';
import { InfiniteScrollTrigger } from '@/components/common/InfiniteScrollTrigger';
import { useGarmentsSearch } from '@/lib/queries/garment-queries';
import type { GetGarmentsPaginatedParams } from '@/lib/actions/garments-paginated';
import { groupGarmentsByClientName } from '@/utils/garments-sort';

import StageBox from '@/components/garments/StageBox';

// URL-friendly stage name mappings
const stageToUrlParam: Record<string, string> = {
  New: 'new',
  'In Progress': 'in-progress',
  'Ready For Pickup': 'ready-for-pickup',
  Done: 'done',
};

const urlParamToStage: Record<string, string> = {
  new: 'New',
  'in-progress': 'In Progress',
  'ready-for-pickup': 'Ready For Pickup',
  done: 'Done',
};

export default function GarmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize stage from URL params
  const stageParam = searchParams.get('stage');
  const initialStage = stageParam ? urlParamToStage[stageParam] || null : null;

  const [selectedStage, setSelectedStage] = useState<string | null>(
    initialStage
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortField, setSortField] =
    useState<GetGarmentsPaginatedParams['sortField']>('due_date');
  const [shopId, setShopId] = useState<string | null>(null);
  const [shopLoaded, setShopLoaded] = useState(false);

  const { userId } = useAuth();
  const { user } = useUser();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Update URL when stage changes
  const updateUrlWithStage = useCallback(
    (stage: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (stage && stageToUrlParam[stage]) {
        params.set('stage', stageToUrlParam[stage]);
      } else {
        params.delete('stage');
      }

      // Use replace to avoid adding to browser history for filter changes
      router.replace(
        `/garments${params.toString() ? '?' + params.toString() : ''}`
      );
    },
    [router, searchParams]
  );

  // Handle stage change with URL update
  const handleStageChange = useCallback(
    (stage: string | null) => {
      setSelectedStage(stage);
      updateUrlWithStage(stage);
      setSearch('');
    },
    // setSearch is not included as it's defined after this callback and is stable from the hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [updateUrlWithStage]
  );

  // Sync stage from URL params when they change
  useEffect(() => {
    const stageParam = searchParams.get('stage');
    const newStage = stageParam ? urlParamToStage[stageParam] || null : null;

    // Only update if different to avoid infinite loops
    if (newStage !== selectedStage) {
      setSelectedStage(newStage);
    }
  }, [searchParams, selectedStage]);

  // Initialize shop ID
  useEffect(() => {
    const initShop = async () => {
      try {
        const shop = await getCurrentUserShop();
        if (shop) {
          setShopId(shop.id);
        }
      } catch (error) {
        console.error('Failed to get shop:', error);
      } finally {
        setShopLoaded(true);
      }
    };
    if (userId) {
      initShop();
    }
  }, [userId]);

  // Use the paginated garments hook
  const {
    garments,
    totalCount,
    totalGarmentsCount,
    stageCounts,
    isLoading,
    isFetching,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    search,
    setSearch,
    filters,
    setFilters,
    prefetchNextPage,
  } = useGarmentsSearch(
    shopId!,
    {
      sortField: sortField as GetGarmentsPaginatedParams['sortField'],
      sortOrder,
      stage: selectedStage as GarmentStage | undefined,
    },
    {
      enabled: !!shopId, // Only enable the query when we have a valid shopId
    }
  );

  // Update filters when state changes
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      sortField: sortField as GetGarmentsPaginatedParams['sortField'],
      sortOrder,
      stage: selectedStage as GarmentStage | undefined,
    }));
  }, [sortField, sortOrder, selectedStage, setFilters]);

  // Prefetch next page when user scrolls
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.body.offsetHeight * 0.8;

      if (scrollPosition > threshold) {
        prefetchNextPage();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prefetchNextPage]);

  // Compute counts of garments per stage
  const garmentCounts = useMemo<Record<string, number>>(() => {
    // Prefer server-provided totals from hook
    if (stageCounts) return stageCounts as Record<string, number>;
    // Fallback to counting loaded items
    const counts: Record<string, number> = {};
    garments.forEach((garment) => {
      const stageName = garment.stage_name || 'New';
      counts[stageName] = (counts[stageName] || 0) + 1;
    });
    return counts;
  }, [garments, stageCounts]);

  const handleClearSearch = useCallback(() => {
    setSearch('');
  }, [setSearch]);

  // All sorting is now handled server-side
  const filteredGarments = garments;

  // Group garments by client name when sorting by client_name
  const isGroupedByClient = sortField === 'client_name';
  const groupedData = useMemo(() => {
    if (isGroupedByClient) {
      return groupGarmentsByClientName(filteredGarments, sortOrder);
    }
    return null;
  }, [filteredGarments, isGroupedByClient, sortOrder]);

  // Don't show error until we've actually tried to load the shop
  if (!shopId && shopLoaded) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>
          Unable to load shop information
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please try refreshing the page or contact support if the issue
          persists.
        </Typography>
      </Box>
    );
  }

  // Show loading skeleton while shop is loading
  if (!shopId && !shopLoaded) {
    return (
      <Box sx={{ p: 3 }}>
        {/* Stage Selection Skeleton */}
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            alignItems: 'center',
            mb: 3,
            gap: 2,
          }}
        >
          {/* Stage Box Skeletons */}
          {Array.from({ length: 7 }).map((_, index) => (
            <Box
              key={index}
              sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  borderRadius: 2,
                  minWidth: '120px',
                  border: '2px solid',
                  borderColor: 'divider',
                }}
              >
                <Skeleton
                  variant="text"
                  width={40}
                  height={40}
                  sx={{ mx: 'auto', mb: 0.5 }}
                />
                <Skeleton
                  variant="text"
                  width={80}
                  height={20}
                  sx={{ mx: 'auto' }}
                />
              </Paper>
              {index < 6 && (
                <ArrowForwardIcon
                  sx={{
                    color: 'text.disabled',
                    fontSize: 20,
                  }}
                />
              )}
            </Box>
          ))}
        </Box>

        {/* Mobile Stage Dropdown Skeleton */}
        <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 3 }}>
          <Skeleton
            variant="rectangular"
            height={56}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Search Bar Skeleton */}
        <Box sx={{ mb: 2 }}>
          <Skeleton
            variant="rectangular"
            height={56}
            sx={{ borderRadius: 2 }}
          />
        </Box>

        {/* Controls Skeleton */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          {/* Heading */}
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Skeleton variant="text" width={150} height={40} />
            <Skeleton variant="text" width={80} height={24} />
          </Box>

          {/* Sort Controls */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Skeleton
              variant="rectangular"
              width={150}
              height={40}
              sx={{ borderRadius: 1 }}
            />
            <Skeleton variant="circular" width={32} height={32} />
          </Box>
        </Box>

        {/* Garment Cards Grid */}
        <Grid2 spacing={3} columns={{ xs: 4, sm: 8, md: 12, lg: 20 }}>
          {Array.from({ length: 12 }).map((_, index) => (
            <Grid2 size={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderTop: '4px solid',
                  borderTopColor: 'divider',
                }}
              >
                {/* Image Section Skeleton */}
                <Box
                  sx={{
                    position: 'relative',
                    paddingTop: '100%',
                    bgcolor: 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: 'text.disabled',
                      opacity: 1,
                    }}
                  >
                    <i
                      className="ri ri-t-shirt-line"
                      style={{ fontSize: 128 }}
                      aria-hidden
                    />
                  </Box>
                </Box>

                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  {/* Garment Name */}
                  <Skeleton
                    variant="text"
                    width="80%"
                    height={28}
                    sx={{ mb: 1 }}
                  />

                  {/* Client Name */}
                  <Skeleton
                    variant="text"
                    width="60%"
                    height={20}
                    sx={{ mb: 1 }}
                  />

                  {/* Due Date Chip */}
                  <Skeleton
                    variant="rectangular"
                    width={100}
                    height={24}
                    sx={{ borderRadius: 12, mb: 1 }}
                  />

                  {/* Price */}
                  <Skeleton variant="text" width={60} height={24} />
                </CardContent>
              </Card>
            </Grid2>
          ))}
        </Grid2>
      </Box>
    );
  }

  if (isError && !garments.length) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>
          Failed to load garments
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error?.message || 'Please try again later'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Stage Selection */}
      {!isMobile ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 3,
            gap: 2,
          }}
        >
          {/* "View All" Stage */}
          <StageBox
            stage={{ name: 'View All', count: totalGarmentsCount || 0 }}
            isSelected={!selectedStage}
            onClick={() => handleStageChange(null)}
            isLast={false}
          />
          {GARMENT_STAGES.map((stage, index) => (
            <StageBox
              key={stage.name}
              stage={{
                name: stage.displayName,
                color: stage.color,
                count: garmentCounts[stage.name] || 0,
              }}
              isSelected={selectedStage === stage.name}
              onClick={() => handleStageChange(stage.name)}
              isLast={index === GARMENT_STAGES.length - 1}
            />
          ))}
        </Box>
      ) : (
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Stage</InputLabel>
          <Select
            value={selectedStage || 'all'}
            onChange={(e) => {
              handleStageChange(
                e.target.value === 'all' ? null : e.target.value
              );
            }}
            label="Stage"
          >
            <MenuItem value="all">
              View All ({totalGarmentsCount || 0})
            </MenuItem>
            {GARMENT_STAGES.map((stage) => (
              <MenuItem key={stage.name} value={stage.name}>
                {stage.displayName} ({garmentCounts[stage.name] || 0})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {garments.length > 0 ? (
        <>
          {/* Search Bar */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search garments by name, notes, or client name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {isFetching && !isFetchingNextPage && search && (
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                    )}
                    {search && (
                      <IconButton
                        aria-label="clear search"
                        onClick={handleClearSearch}
                        edge="end"
                        size="small"
                      >
                        <ClearIcon />
                      </IconButton>
                    )}
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
          </Box>

          {/* Controls */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            {/* Heading */}
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography variant="h4">
                {selectedStage ? selectedStage : 'All Garments'}
              </Typography>
              {totalCount !== undefined && (
                <Typography variant="body2" color="text.secondary">
                  ({totalCount} total)
                </Typography>
              )}
            </Box>

            {/* Sort Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl
                variant="outlined"
                size="small"
                sx={{ minWidth: 150 }}
              >
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortField}
                  onChange={(e) =>
                    setSortField(
                      e.target.value as GetGarmentsPaginatedParams['sortField']
                    )
                  }
                  label="Sort By"
                  endAdornment={
                    isFetching && !isFetchingNextPage && !isLoading ? (
                      <CircularProgress
                        size={16}
                        sx={{
                          position: 'absolute',
                          right: 28,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          pointerEvents: 'none',
                        }}
                      />
                    ) : null
                  }
                >
                  <MenuItem value="due_date">Due Date</MenuItem>
                  <MenuItem value="created_at">Created Date</MenuItem>
                  <MenuItem value="client_name">Client Name</MenuItem>
                  <MenuItem value="name">Garment Name</MenuItem>
                </Select>
              </FormControl>
              <Tooltip title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}>
                <IconButton
                  onClick={() =>
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                  }
                  size="small"
                >
                  {sortOrder === 'asc' ? (
                    <ArrowUpwardIcon />
                  ) : (
                    <ArrowDownwardIcon />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Garments Grid */}
          {isGroupedByClient && groupedData ? (
            // Grouped view by client name
            <Box>
              {groupedData.sortedClientNames.map((clientName) => {
                const clientGarments = groupedData.groups[clientName] || [];
                return (
                  <Box key={clientName} sx={{ mb: 4 }}>
                    {/* Client Name Header */}
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
                        ({clientGarments.length} garment
                        {clientGarments.length !== 1 ? 's' : ''})
                      </Typography>
                    </Box>

                    {/* Garments for this client */}
                    <Grid2
                      container
                      spacing={3}
                      columns={{ xs: 4, sm: 8, md: 12, lg: 20 }}
                    >
                      {clientGarments.map((garment) => (
                        <Grid2
                          size={{ xs: 4, sm: 4, md: 4, lg: 4 }}
                          key={garment.id}
                        >
                          <GarmentCard
                            garment={garment}
                            orderId={garment.order_id}
                            stageColor={getStageColor(
                              (garment.stage_name || 'New') as any
                            )}
                          />
                        </Grid2>
                      ))}
                    </Grid2>
                  </Box>
                );
              })}
            </Box>
          ) : (
            // Regular grid view
            <Grid2 spacing={3} columns={{ xs: 4, sm: 8, md: 12, lg: 20 }}>
              {filteredGarments.map((garment) => (
                <Grid2 size={{ xs: 4, sm: 4, md: 4, lg: 4 }} key={garment.id}>
                  <GarmentCard
                    garment={garment}
                    orderId={garment.order_id}
                    stageColor={getStageColor(
                      (garment.stage_name || 'New') as any
                    )}
                  />
                </Grid2>
              ))}
            </Grid2>
          )}

          {/* Infinite Scroll Trigger */}
          <InfiniteScrollTrigger
            onLoadMore={fetchNextPage}
            hasMore={hasNextPage || false}
            isLoading={isFetchingNextPage}
            error={isError ? error : null}
            loadMoreText="Load more garments"
            loadingText="Loading more garments..."
            endText={`All ${totalCount || filteredGarments.length} garments loaded`}
            errorText="Failed to load more garments"
          />
        </>
      ) : (
        !isLoading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Box sx={{ mb: 3, color: 'text.disabled' }}>
              <i
                className="ri ri-t-shirt-line"
                style={{ fontSize: 64 }}
                aria-hidden
              />
            </Box>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No garments found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {search || selectedStage
                ? 'Try adjusting your filters or search terms'
                : 'Get started by creating your first garment'}
            </Typography>
          </Box>
        )
      )}
    </Box>
  );
}
