'use client';

import React from 'react';
import Grid2 from '@mui/material/Grid2';
import { Box, Typography } from '@mui/material';
import GarmentCard from '@/components/garments/GarmentCard';
import { InfiniteScrollTrigger } from '@/components/common/InfiniteScrollTrigger';
import type { GarmentListItem } from '@/lib/actions/garments-paginated';
import GarmentCardSkeletonGrid from '@/components/garments/GarmentCardSkeleton';

interface GarmentsListProps {
  garments: GarmentListItem[];
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onStageUpdate?: (garmentId: string, newStage: string) => void;
  totalCount?: number | undefined;
  error?: Error | null;
}

export default function GarmentsList({
  garments,
  isLoading,
  hasMore,
  onLoadMore,
  totalCount,
  error,
}: GarmentsListProps) {
  return (
    <Box
      sx={{
        // Enable scroll anchoring to maintain scroll position during content changes
        overflowAnchor: 'auto',
      }}
    >
      <Grid2
        container
        spacing={3}
        columns={{ xs: 4, sm: 8, md: 12, lg: 20 }}
        sx={{
          // Optimize grid rendering
          minHeight: 0,
        }}
      >
        {garments.map((g) => (
          <Grid2 key={g.id} size={{ xs: 4, sm: 4, md: 4, lg: 4 }}>
            <GarmentCard garment={g as any} orderId={g.order_id} />
          </Grid2>
        ))}
      </Grid2>

      {/* Show loading skeleton when loading more */}
      {isLoading && garments.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <GarmentCardSkeletonGrid count={4} />
        </Box>
      )}

      {garments.length > 0 && hasMore && onLoadMore && (
        <InfiniteScrollTrigger
          onLoadMore={onLoadMore}
          hasMore={hasMore}
          isLoading={!!isLoading}
          error={error ?? null}
          loadMoreText="Load more garments"
          loadingText="Loading more garments..."
          endText="All garments loaded"
          showFallbackPagination={false}
        />
      )}

      {!garments.length && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="body1" color="text.secondary">
            No garments found
            {typeof totalCount === 'number' ? ` (0/${totalCount})` : ''}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
