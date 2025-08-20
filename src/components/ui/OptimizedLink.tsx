'use client';

import { forwardRef } from 'react';
import Link, { LinkProps } from 'next/link';
import { Box, CircularProgress } from '@mui/material';
import { useLinkStatus } from 'next/link';

interface OptimizedLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  showLoadingIndicator?: boolean;
}

// Create a wrapper that shows loading state for individual links
function LinkWithStatus({
  children,
  href,
  showLoadingIndicator = false,
  ...props
}: OptimizedLinkProps) {
  const { pending } = useLinkStatus();

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <Link href={href} {...props}>
        {children}
      </Link>
      {showLoadingIndicator && pending && (
        <CircularProgress
          size={16}
          sx={{
            position: 'absolute',
            right: -24,
            color: 'primary.main',
          }}
        />
      )}
    </Box>
  );
}

// Optimized link with prefetch control for dynamic routes
export const OptimizedLink = forwardRef<HTMLAnchorElement, OptimizedLinkProps>(
  function OptimizedLink({ children, href, prefetch, ...props }, ref) {
    // For dynamic routes (containing []), consider disabling prefetch
    // to avoid unnecessary server work
    const isDynamicRoute = typeof href === 'string' && href.includes('[');
    const shouldPrefetch = prefetch !== undefined ? prefetch : !isDynamicRoute;

    return (
      <Link ref={ref} href={href} prefetch={shouldPrefetch} {...props}>
        {children}
      </Link>
    );
  }
);

export { LinkWithStatus };
