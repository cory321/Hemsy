'use client';

import React, { useEffect, useRef } from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import { useInView } from '@/hooks/useInView';

interface InfiniteScrollTriggerProps {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  error?: Error | null;
  loadMoreText?: string;
  loadingText?: string;
  endText?: string;
  errorText?: string;
  // For accessibility - provide fallback pagination
  showFallbackPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function InfiniteScrollTrigger({
  onLoadMore,
  hasMore,
  isLoading,
  error,
  loadMoreText = 'Load more garments',
  loadingText = 'Loading more garments...',
  endText = 'All garments loaded',
  errorText = 'Failed to load garments',
  showFallbackPagination = true,
  currentPage = 1,
  totalPages,
  onPageChange,
}: InfiniteScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Simple, reliable intersection observer settings
  const { isInView } = useInView(triggerRef as React.RefObject<Element>, {
    threshold: 0.1,
    rootMargin: '100px',
  });

  // Auto-load when trigger is in view - keep it simple
  useEffect(() => {
    if (isInView && hasMore && !isLoading && !loadingRef.current) {
      loadingRef.current = true;
      onLoadMore();
      // Reset loading ref after load completes
      setTimeout(() => {
        loadingRef.current = false;
      }, 1000);
    }
  }, [isInView, hasMore, isLoading, onLoadMore]);

  // Announce loading state to screen readers
  const statusMessage = isLoading
    ? loadingText
    : error
      ? errorText
      : !hasMore
        ? endText
        : '';

  return (
    <>
      {/* Invisible trigger element for intersection observer */}
      <div
        ref={triggerRef}
        style={{
          height: 1,
          width: '100%',
          // Ensure the element doesn't cause layout shifts
          position: 'relative',
          marginTop: -1,
          // Act as scroll anchor to maintain position during content loading
          overflowAnchor: 'auto',
        }}
      />

      {/* Visual loading/status indicator */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          gap: 2,
        }}
      >
        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              {loadingText}
            </Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="error" gutterBottom>
              {errorText}
            </Typography>
            <Button onClick={onLoadMore} size="small" variant="outlined">
              Try again
            </Button>
          </Box>
        )}

        {!hasMore && !isLoading && !error && (
          <Typography variant="body2" color="text.secondary">
            {endText}
          </Typography>
        )}

        {/* Manual load more button for accessibility */}
        {hasMore && !isLoading && !error && (
          <Button
            onClick={onLoadMore}
            variant="outlined"
            size="small"
            sx={{
              // Hide visually but keep for screen readers and keyboard nav
              position: 'absolute',
              left: '-9999px',
              '&:focus': {
                position: 'static',
                left: 'auto',
              },
            }}
          >
            {loadMoreText}
          </Button>
        )}

        {/* Fallback pagination for accessibility */}
        {showFallbackPagination && totalPages && totalPages > 1 && (
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              mt: 2,
              // Only show on focus for accessibility
              opacity: 0,
              '&:focus-within': {
                opacity: 1,
              },
            }}
            role="navigation"
            aria-label="Pagination"
          >
            <Button
              size="small"
              disabled={currentPage === 1}
              onClick={() => onPageChange?.(currentPage - 1)}
            >
              Previous
            </Button>
            <Typography
              variant="body2"
              sx={{ display: 'flex', alignItems: 'center', px: 2 }}
            >
              Page {currentPage} of {totalPages}
            </Typography>
            <Button
              size="small"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange?.(currentPage + 1)}
            >
              Next
            </Button>
          </Box>
        )}
      </Box>

      {/* Screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>
    </>
  );
}
