# Responsive Design Guide for Hemsy

## Overview

Hemsy is built with a **mobile-first** responsive design approach. This guide explains how to implement responsive features that seamlessly adapt between mobile and desktop views.

## Key Responsive Components

### 1. Navigation System

The app automatically switches navigation patterns based on screen size:

- **Mobile (<600px)**: Bottom navigation bar with 6 main items
- **Tablet (600-900px)**: Top app bar with hamburger menu
- **Desktop (≥900px)**: Horizontal navigation bar at the top

The navigation is handled automatically by the `ResponsiveNav` component in the app layout.

### 2. Responsive Utilities

#### useResponsive Hook

```tsx
import { useResponsive } from '@/hooks/useResponsive';

function MyComponent() {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  return (
    <Box>
      {isMobile && <MobileView />}
      {isTablet && <TabletView />}
      {isDesktop && <DesktopView />}
    </Box>
  );
}
```

#### Conditional Rendering

```tsx
import { ShowOn, HideOn } from '@/components/layout';

// Show complex features only on desktop
<ShowOn desktop>
  <AdvancedFilterPanel />
</ShowOn>

// Simplified mobile interface
<HideOn desktop>
  <SimpleFilterButton />
</HideOn>
```

### 3. Responsive Layouts

#### Container with Adaptive Width

```tsx
import { ResponsiveContainer } from '@/components/layout';

<ResponsiveContainer
  mobileMaxWidth={false} // Full width on mobile
  desktopMaxWidth="lg" // Constrained on desktop
>
  <YourContent />
</ResponsiveContainer>;
```

#### Responsive Grid System

```tsx
import {
  ResponsiveGridContainer,
  ResponsiveGridItem,
} from '@/components/layout';

<ResponsiveGridContainer>
  <ResponsiveGridItem mobile={12} tablet={6} desktop={4}>
    <Card />
  </ResponsiveGridItem>
  {/* Items stack on mobile, 2 columns on tablet, 3 on desktop */}
</ResponsiveGridContainer>;
```

### 4. Pre-built Patterns

```tsx
import { ResponsivePatterns } from '@/components/layout';

// Two-column layout (stacks on mobile)
<ResponsivePatterns.TwoColumn>
  <LeftContent />
  <RightContent />
</ResponsivePatterns.TwoColumn>

// Sidebar layout
<ResponsivePatterns.Sidebar
  sidebar={<FilterPanel />}
  content={<MainContent />}
/>
```

## Common Responsive Patterns

### 1. Adaptive Buttons

```tsx
const { isMobile } = useResponsive();

// Icon button on mobile, full button on desktop
{
  isMobile ? (
    <IconButton color="primary">
      <AddIcon />
    </IconButton>
  ) : (
    <Button variant="contained" startIcon={<AddIcon />}>
      Add New Order
    </Button>
  );
}
```

### 2. Responsive Typography

```tsx
<Typography
  variant="h4"
  sx={{
    fontSize: {
      xs: '1.5rem', // Mobile
      sm: '2rem', // Tablet
      md: '2.5rem', // Desktop
    },
  }}
>
  Page Title
</Typography>
```

### 3. Adaptive Spacing

```tsx
<Stack
  direction={{ xs: 'column', sm: 'row' }}
  spacing={{ xs: 2, sm: 3, md: 4 }}
>
  {children}
</Stack>
```

### 4. Responsive Tables

```tsx
// Mobile: Card view
// Desktop: Table view
{
  isMobile ? (
    <Stack spacing={2}>
      {data.map((item) => (
        <MobileCard key={item.id} {...item} />
      ))}
    </Stack>
  ) : (
    <Table>
      {data.map((item) => (
        <TableRow key={item.id} {...item} />
      ))}
    </Table>
  );
}
```

## Best Practices

1. **Mobile-First Development**
   - Design for mobile screens first
   - Enhance progressively for larger screens
   - Test on real devices when possible

2. **Touch-Friendly Interfaces**
   - Minimum touch target: 44x44px
   - Adequate spacing between interactive elements
   - Swipe gestures for mobile navigation

3. **Performance Optimization**
   - Lazy load heavy components on mobile
   - Use responsive images with appropriate sizes
   - Minimize JavaScript execution on lower-end devices

4. **Content Prioritization**
   - Show essential information first on mobile
   - Use progressive disclosure for complex features
   - Implement "show more" patterns for lengthy content

5. **Testing Checklist**
   - [ ] Test on mobile (320px - 600px)
   - [ ] Test on tablet (600px - 900px)
   - [ ] Test on desktop (900px+)
   - [ ] Test orientation changes
   - [ ] Test with slow network conditions

## Implementation Examples

### Order List Page

```tsx
function OrderList() {
  const { isMobile } = useResponsive();

  return (
    <ResponsiveContainer>
      {/* Mobile: Simplified header */}
      {/* Desktop: Full header with filters */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        mb={3}
      >
        <Typography variant="h4">Orders</Typography>
        <ShowOn desktop>
          <FilterBar />
        </ShowOn>
      </Stack>

      {/* Mobile: Card list */}
      {/* Desktop: Data table */}
      {isMobile ? <OrderCardList /> : <OrderDataTable />}
    </ResponsiveContainer>
  );
}
```

### Client Profile

```tsx
function ClientProfile() {
  return (
    <ResponsiveContainer>
      <ResponsivePatterns.Sidebar
        sidebar={
          <Card>
            <ClientInfo />
            <HideOn mobile>
              <ClientStats />
            </HideOn>
          </Card>
        }
        content={
          <Stack spacing={3}>
            <ShowOn mobile>
              <ClientStats />
            </ShowOn>
            <OrderHistory />
            <AppointmentsList />
          </Stack>
        }
      />
    </ResponsiveContainer>
  );
}
```

## Debugging Tips

1. Use Chrome DevTools device emulation
2. Test with real devices when possible
3. Use the `useBreakpoint()` hook to display current breakpoint:

   ```tsx
   const breakpoint = useBreakpoint();
   console.log('Current breakpoint:', breakpoint);
   ```

4. Material UI breakpoint viewer (development only):
   ```tsx
   {
     process.env.NODE_ENV === 'development' && (
       <Box sx={{ position: 'fixed', bottom: 10, right: 10 }}>
         Breakpoint: {useBreakpoint()}
       </Box>
     );
   }
   ```

## Summary

The responsive system in Hemsy provides:

- Automatic navigation adaptation
- Powerful responsive hooks and utilities
- Pre-built layout patterns
- Consistent breakpoint management
- Mobile-first design principles

By using these tools and patterns, you can create interfaces that work seamlessly across all device sizes while maintaining a consistent user experience.
