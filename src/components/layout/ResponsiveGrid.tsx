'use client';

import { Grid, GridProps } from '@mui/material';
import { ReactNode } from 'react';

interface ResponsiveGridItemProps extends Omit<GridProps, 'item'> {
  children: ReactNode;
  // Simplified responsive API
  mobile?: number; // columns on mobile (xs)
  tablet?: number; // columns on tablet (sm)
  desktop?: number; // columns on desktop (md+)
  largeDesktop?: number; // columns on large desktop (lg+)
}

/**
 * Responsive grid item with simplified column sizing
 */
export function ResponsiveGridItem({
  children,
  mobile = 12,
  tablet,
  desktop,
  largeDesktop,
  ...props
}: ResponsiveGridItemProps) {
  return (
    <Grid
      item
      xs={mobile}
      sm={tablet || mobile}
      md={desktop || tablet || mobile}
      lg={largeDesktop || desktop || tablet || mobile}
      {...props}
    >
      {children}
    </Grid>
  );
}

interface ResponsiveGridContainerProps extends Omit<GridProps, 'container'> {
  children: ReactNode;
  // Responsive spacing
  mobileSpacing?: number;
  tabletSpacing?: number;
  desktopSpacing?: number;
}

/**
 * Responsive grid container with adaptive spacing
 */
export function ResponsiveGridContainer({
  children,
  mobileSpacing = 2,
  tabletSpacing = 3,
  desktopSpacing = 4,
  ...props
}: ResponsiveGridContainerProps) {
  return (
    <Grid
      container
      spacing={{
        xs: mobileSpacing,
        sm: tabletSpacing,
        md: desktopSpacing,
      }}
      {...props}
    >
      {children}
    </Grid>
  );
}

// Common responsive grid patterns
export const ResponsivePatterns = {
  /**
   * Two column layout on desktop, single column on mobile
   */
  TwoColumn: ({
    children,
    ...props
  }: { children: [ReactNode, ReactNode] } & GridProps) => (
    <ResponsiveGridContainer {...props}>
      <ResponsiveGridItem mobile={12} desktop={6}>
        {children[0]}
      </ResponsiveGridItem>
      <ResponsiveGridItem mobile={12} desktop={6}>
        {children[1]}
      </ResponsiveGridItem>
    </ResponsiveGridContainer>
  ),

  /**
   * Three column layout on desktop, single column on mobile
   */
  ThreeColumn: ({
    children,
    ...props
  }: { children: [ReactNode, ReactNode, ReactNode] } & GridProps) => (
    <ResponsiveGridContainer {...props}>
      <ResponsiveGridItem mobile={12} tablet={6} desktop={4}>
        {children[0]}
      </ResponsiveGridItem>
      <ResponsiveGridItem mobile={12} tablet={6} desktop={4}>
        {children[1]}
      </ResponsiveGridItem>
      <ResponsiveGridItem mobile={12} tablet={12} desktop={4}>
        {children[2]}
      </ResponsiveGridItem>
    </ResponsiveGridContainer>
  ),

  /**
   * Sidebar layout: 3/9 split on desktop, stacked on mobile
   */
  Sidebar: ({
    sidebar,
    content,
    ...props
  }: { sidebar: ReactNode; content: ReactNode } & GridProps) => (
    <ResponsiveGridContainer {...props}>
      <ResponsiveGridItem mobile={12} desktop={3}>
        {sidebar}
      </ResponsiveGridItem>
      <ResponsiveGridItem mobile={12} desktop={9}>
        {content}
      </ResponsiveGridItem>
    </ResponsiveGridContainer>
  ),

  /**
   * Card grid: Responsive card layout
   */
  CardGrid: ({ children, ...props }: { children: ReactNode } & GridProps) => (
    <ResponsiveGridContainer {...props}>{children}</ResponsiveGridContainer>
  ),
};

// Export a component for card items in a grid
export function CardGridItem({
  children,
  ...props
}: { children: ReactNode } & GridProps) {
  return (
    <ResponsiveGridItem
      mobile={12}
      tablet={6}
      desktop={4}
      largeDesktop={3}
      {...props}
    >
      {children}
    </ResponsiveGridItem>
  );
}
