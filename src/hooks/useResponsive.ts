import { useMediaQuery, useTheme } from '@mui/material';

export const useResponsive = () => {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isTouchDevice =
    typeof window !== 'undefined' && 'ontouchstart' in window;

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    currentBreakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
  };
};

// Alias for backward compatibility
export const useBreakpoint = useResponsive;
