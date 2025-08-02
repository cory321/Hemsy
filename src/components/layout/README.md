# Responsive Layout System

This directory contains the responsive layout components and utilities for Threadfolio V2.

## Overview

The responsive system is built on Material UI's breakpoint system and provides:

- Automatic navigation switching (bottom nav on mobile, side nav on desktop)
- Responsive hooks for easy breakpoint detection
- Utility components for responsive layouts
- Pre-built responsive patterns

## Breakpoints

Our breakpoints align with Material UI defaults:

- `xs`: 0px (mobile)
- `sm`: 600px (tablet)
- `md`: 900px (desktop)
- `lg`: 1200px (large desktop)
- `xl`: 1536px (extra large)

## Core Components

### ResponsiveNav

The main navigation wrapper that automatically switches between:

- **Mobile (<600px)**: Bottom navigation
- **Tablet (600-900px)**: Top app bar with hamburger menu
- **Desktop (>900px)**: Horizontal top navigation bar

Usage:

```tsx
<ResponsiveNav>{/* Your page content */}</ResponsiveNav>
```

### ResponsiveContainer

A container that adapts its max width and padding based on screen size.

```tsx
<ResponsiveContainer
  mobileMaxWidth={false} // full width on mobile
  tabletMaxWidth="sm" // max-width: 600px on tablet
  desktopMaxWidth="lg" // max-width: 1200px on desktop
  mobilePadding={2} // theme.spacing(2) on mobile
  tabletPadding={3} // theme.spacing(3) on tablet
  desktopPadding={3} // theme.spacing(3) on desktop
>
  {/* Content */}
</ResponsiveContainer>
```

### ShowOn / HideOn

Conditionally render content based on screen size.

```tsx
// Show only on desktop
<ShowOn desktop>
  <DetailedView />
</ShowOn>

// Hide on mobile
<HideOn mobile>
  <ComplexTable />
</HideOn>

// Show on specific breakpoints
<ShowOn breakpoints={['md', 'lg', 'xl']}>
  <AdvancedFeatures />
</ShowOn>
```

### ResponsiveGrid

Simplified responsive grid components.

```tsx
<ResponsiveGridContainer mobileSpacing={2} desktopSpacing={4}>
  <ResponsiveGridItem mobile={12} tablet={6} desktop={4}>
    <Card />
  </ResponsiveGridItem>
</ResponsiveGridContainer>
```

### ResponsivePatterns

Pre-built common layout patterns:

```tsx
// Two column layout
<ResponsivePatterns.TwoColumn>
  <LeftContent />
  <RightContent />
</ResponsivePatterns.TwoColumn>

// Sidebar layout
<ResponsivePatterns.Sidebar
  sidebar={<Navigation />}
  content={<MainContent />}
/>

// Card grid
<ResponsivePatterns.CardGrid>
  <CardGridItem><Card1 /></CardGridItem>
  <CardGridItem><Card2 /></CardGridItem>
</ResponsivePatterns.CardGrid>
```

## Hooks

### useResponsive

Main hook for responsive behavior:

```tsx
const {
  isMobile, // < 600px
  isTablet, // 600-900px
  isDesktop, // >= 900px
  isLargeDesktop, // >= 1200px
  isMobileOrTablet, // < 900px
  isTabletOrDesktop, // >= 600px
  breakpoints, // raw breakpoint values
} = useResponsive();
```

### useBreakpoint

Get the current breakpoint name:

```tsx
const breakpoint = useBreakpoint(); // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
```

## Best Practices

1. **Mobile-First Design**: Start with mobile layout and enhance for larger screens
2. **Use Semantic Components**: Prefer `ShowOn`/`HideOn` over manual media queries
3. **Test All Breakpoints**: Always test xs, sm, md, and lg breakpoints
4. **Consistent Spacing**: Use responsive spacing props for consistent layouts
5. **Performance**: Use CSS-based responsive utilities (sx prop) when possible

## Examples

### Responsive Button

```tsx
// Full button on desktop, icon button on mobile
<>
  <ShowOn desktop>
    <Button variant="contained" startIcon={<AddIcon />}>
      New Order
    </Button>
  </ShowOn>
  <HideOn desktop>
    <IconButton color="primary">
      <AddIcon />
    </IconButton>
  </HideOn>
</>
```

### Responsive Typography

```tsx
<Typography
  variant="h4"
  sx={{
    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
  }}
>
  Responsive Heading
</Typography>
```

### Responsive Stack

```tsx
<Stack
  direction={{ xs: 'column', sm: 'row' }}
  spacing={{ xs: 2, sm: 3, md: 4 }}
  alignItems={{ xs: 'stretch', sm: 'center' }}
>
  {children}
</Stack>
```
