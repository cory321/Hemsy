'use client';

import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

/**
 * Custom hook for responsive design utilities
 * Provides easy access to common breakpoint checks
 */
export function useResponsive() {
  const theme = useTheme();

  // Breakpoint checks
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600px - 900px
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // >= 900px
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up('lg')); // >= 1200px

  // Common responsive patterns
  const isMobileOrTablet = useMediaQuery(theme.breakpoints.down('md')); // < 900px
  const isTabletOrDesktop = useMediaQuery(theme.breakpoints.up('sm')); // >= 600px

  // Specific breakpoint checks
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.only('xl'));

  // Custom breakpoint checks
  const isSmUp = useMediaQuery(theme.breakpoints.up('sm'));
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const isLgUp = useMediaQuery(theme.breakpoints.up('lg'));

  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const isMdDown = useMediaQuery(theme.breakpoints.down('md'));
  const isLgDown = useMediaQuery(theme.breakpoints.down('lg'));

  return {
    // Main responsive states
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,

    // Combined states
    isMobileOrTablet,
    isTabletOrDesktop,

    // Specific breakpoints
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,

    // Directional breakpoints
    isSmUp,
    isMdUp,
    isLgUp,
    isSmDown,
    isMdDown,
    isLgDown,

    // Raw breakpoint values
    breakpoints: theme.breakpoints.values,
  };
}

/**
 * Hook to get the current breakpoint name
 */
export function useBreakpoint(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' {
  const theme = useTheme();
  const keys = [...theme.breakpoints.keys].reverse();

  return (
    keys.reduce((output, key) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const matches = useMediaQuery(theme.breakpoints.up(key));
      return !output && matches ? key : output;
    }, null) ?? 'xs'
  );
}
