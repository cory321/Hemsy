'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Grid,
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
} from '@mui/material';

import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
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

export default function GarmentsPage() {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortField, setSortField] =
    useState<GetGarmentsPaginatedParams['sortField']>('due_date');
  const [shopId, setShopId] = useState<string | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const { userId } = useAuth();
  const { user } = useUser();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
        setInitialLoading(false);
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
  } = useGarmentsSearch(shopId || '', {
    sortField: sortField as GetGarmentsPaginatedParams['sortField'],
    sortOrder,
    stage: selectedStage as GarmentStage | undefined,
  });

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

  if (initialLoading || (!shopId && !isError)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
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
            stage={{ name: 'View All', count: totalCount || 0 }}
            isSelected={!selectedStage}
            onClick={() => {
              setSelectedStage(null);
              setSearch('');
            }}
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
              onClick={() => {
                setSelectedStage(stage.name);
                setSearch('');
              }}
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
              setSelectedStage(
                e.target.value === 'all' ? null : e.target.value
              );
              setSearch('');
            }}
            label="Stage"
          >
            <MenuItem value="all">View All ({totalCount || 0})</MenuItem>
            {GARMENT_STAGES.map((stage) => (
              <MenuItem key={stage.name} value={stage.name}>
                {stage.displayName} ({garmentCounts[stage.name] || 0})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {isLoading && !garments.length ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
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
              <Typography variant="h4">All Garments</Typography>
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
                    <Grid
                      container
                      spacing={3}
                      columns={{ xs: 4, sm: 8, md: 12, lg: 20 }}
                    >
                      {clientGarments.map((garment) => (
                        <Grid item xs={4} sm={4} md={4} lg={4} key={garment.id}>
                          <GarmentCard
                            garment={garment}
                            orderId={garment.order_id}
                            stageColor={getStageColor(
                              (garment.stage_name || 'New') as any
                            )}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                );
              })}
            </Box>
          ) : (
            // Regular grid view
            <Grid
              container
              spacing={3}
              columns={{ xs: 4, sm: 8, md: 12, lg: 20 }}
            >
              {filteredGarments.map((garment) => (
                <Grid item xs={4} sm={4} md={4} lg={4} key={garment.id}>
                  <GarmentCard
                    garment={garment}
                    orderId={garment.order_id}
                    stageColor={getStageColor(
                      (garment.stage_name || 'New') as any
                    )}
                  />
                </Grid>
              ))}
            </Grid>
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
      )}
    </Box>
  );
}
