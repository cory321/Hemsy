'use client';

import { Box, Container, ContainerProps } from '@mui/material';
import { ReactNode } from 'react';
import { useResponsive } from '@/hooks/useResponsive';

interface ResponsiveContainerProps extends Omit<ContainerProps, 'maxWidth'> {
  children: ReactNode;
  // Custom responsive max widths
  mobileMaxWidth?: false | 'xs' | 'sm';
  tabletMaxWidth?: false | 'sm' | 'md';
  desktopMaxWidth?: false | 'md' | 'lg' | 'xl';
  // Responsive padding
  mobilePadding?: number;
  tabletPadding?: number;
  desktopPadding?: number;
}

/**
 * A responsive container that adapts its max width and padding based on screen size
 */
export function ResponsiveContainer({
  children,
  mobileMaxWidth = false,
  tabletMaxWidth = 'sm',
  desktopMaxWidth = 'lg',
  mobilePadding = 2,
  tabletPadding = 3,
  desktopPadding = 3,
  sx,
  ...props
}: ResponsiveContainerProps) {
  const { isMobile, isTablet } = useResponsive();

  const getMaxWidth = () => {
    if (isMobile) return mobileMaxWidth;
    if (isTablet) return tabletMaxWidth;
    return desktopMaxWidth;
  };

  const getPadding = () => {
    if (isMobile) return mobilePadding;
    if (isTablet) return tabletPadding;
    return desktopPadding;
  };

  return (
    <Container
      maxWidth={getMaxWidth()}
      sx={{
        px: getPadding(),
        ...sx,
      }}
      {...props}
    >
      {children}
    </Container>
  );
}

interface ResponsiveBoxProps {
  children: ReactNode;
  // Display properties for different breakpoints
  mobileDisplay?: string;
  tabletDisplay?: string;
  desktopDisplay?: string;
  // Additional responsive properties
  sx?: Record<string, any>;
}

/**
 * A Box component with built-in responsive display utilities
 */
export function ResponsiveBox({
  children,
  mobileDisplay = 'block',
  tabletDisplay = 'block',
  desktopDisplay = 'block',
  sx = {},
}: ResponsiveBoxProps) {
  return (
    <Box
      sx={{
        display: {
          xs: mobileDisplay,
          sm: tabletDisplay,
          md: desktopDisplay,
        },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

interface ShowOnProps {
  children: ReactNode;
  mobile?: boolean;
  tablet?: boolean;
  desktop?: boolean;
  // Alternative: show on specific breakpoints
  breakpoints?: Array<'xs' | 'sm' | 'md' | 'lg' | 'xl'>;
}

/**
 * Conditionally render children based on screen size
 */
export function ShowOn({
  children,
  mobile,
  tablet,
  desktop,
  breakpoints,
}: ShowOnProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  if (breakpoints) {
    return (
      <Box
        sx={{
          display: {
            xs: breakpoints.includes('xs') ? 'block' : 'none',
            sm: breakpoints.includes('sm') ? 'block' : 'none',
            md: breakpoints.includes('md') ? 'block' : 'none',
            lg: breakpoints.includes('lg') ? 'block' : 'none',
            xl: breakpoints.includes('xl') ? 'block' : 'none',
          },
        }}
      >
        {children}
      </Box>
    );
  }

  const shouldShow =
    (mobile && isMobile) || (tablet && isTablet) || (desktop && isDesktop);

  if (!shouldShow) return null;

  return <>{children}</>;
}

interface HideOnProps {
  children: ReactNode;
  mobile?: boolean;
  tablet?: boolean;
  desktop?: boolean;
  // Alternative: hide on specific breakpoints
  breakpoints?: Array<'xs' | 'sm' | 'md' | 'lg' | 'xl'>;
}

/**
 * Conditionally hide children based on screen size
 */
export function HideOn({
  children,
  mobile,
  tablet,
  desktop,
  breakpoints,
}: HideOnProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  if (breakpoints) {
    return (
      <Box
        sx={{
          display: {
            xs: breakpoints.includes('xs') ? 'none' : 'block',
            sm: breakpoints.includes('sm') ? 'none' : 'block',
            md: breakpoints.includes('md') ? 'none' : 'block',
            lg: breakpoints.includes('lg') ? 'none' : 'block',
            xl: breakpoints.includes('xl') ? 'none' : 'block',
          },
        }}
      >
        {children}
      </Box>
    );
  }

  const shouldHide =
    (mobile && isMobile) || (tablet && isTablet) || (desktop && isDesktop);

  if (shouldHide) return null;

  return <>{children}</>;
}
