# Hemsy Style Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Brand Identity](#brand-identity)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Component Patterns](#component-patterns)
7. [Responsive Design](#responsive-design)
8. [Iconography](#iconography)
9. [Motion & Animation](#motion--animation)
10. [Loading & Error States](#loading--error-states)
11. [Accessibility Standards](#accessibility-standards)
12. [Design Tokens](#design-tokens)
13. [Implementation Guidelines](#implementation-guidelines)
14. [Gaps & Inconsistencies](#gaps--inconsistencies)

## Introduction

This style guide defines the visual language and design system for Hemsy, a mobile-first PWA for seamstresses and tailoring businesses. It ensures consistency across all user interfaces and provides implementation guidance for developers.

### Core Design Principles

1. **Mobile-First**: Every design decision prioritizes mobile experience
2. **Warm & Crafted**: Visual language inspired by textile and fabric tones
3. **Professional yet Approachable**: Balance business needs with user comfort
4. **Accessible**: WCAG 2.1 AA compliant for all users
5. **Performance-Conscious**: Optimized for slow networks and older devices
6. **Speed & Efficiency**: Help users achieve goals quickly with minimal friction
7. **Opinionated Defaults**: Thoughtful default settings reduce decision fatigue
8. **Focus & Clarity**: Uncluttered interfaces with unambiguous labels and instructions
9. **Meticulous Craft**: Precision and polish in every UI element

## Brand Identity

### Brand Values

- **Craftsmanship**: Attention to detail in every interface element
- **Warmth**: Inviting color palette that reflects the textile industry
- **Efficiency**: Streamlined workflows for busy professionals
- **Trust**: Consistent, reliable user experience

### Visual Personality

The Hemsy brand embodies the warmth of a professional tailoring studio with modern digital efficiency. Our interfaces feel handcrafted yet systematic, personal yet scalable.

## Color System

### Primary Palette - Rose/Burgundy Tones

```css
--color-primary-main: #b85563; /* Rose red - main actions & CTAs */
--color-primary-light: #d99a9e; /* Light dusty rose - hover states */
--color-primary-dark: #8b3a42; /* Deep burgundy - pressed states */
--color-primary-contrast: #ffffff; /* White text on primary */
```

### Secondary Palette - Terracotta/Sienna Tones

```css
--color-secondary-main: #cc8b70; /* Terracotta - secondary actions */
--color-secondary-light: #e4a896; /* Light salmon - accents */
--color-secondary-dark: #b8765a; /* Burnt sienna - depth */
--color-secondary-contrast: #ffffff; /* White text on secondary */
```

### Semantic Colors

```css
--color-error: #8b3a42; /* Deep burgundy - serious but not alarming */
--color-warning: #cc8b70; /* Terracotta - attention without panic */
--color-info: #d08585; /* Salmon pink - friendly information */
--color-success: #7c9885; /* Muted sage green - calm confirmation */
```

### Background Colors

```css
--color-background-default: #fffefc; /* Warm cream - main app background */
--color-background-paper: #ffffff; /* Pure white - cards & elevated surfaces */
--color-background-nav: #a34357; /* Navigation bar burgundy */
```

### Text Colors

```css
--color-text-primary: #3a1619; /* Very dark burgundy - main content */
--color-text-secondary: #8b3a42; /* Deep burgundy - secondary text */
--color-text-disabled: rgba(0, 0, 0, 0.38);
```

### Grey Scale

```css
--color-grey-50: #fafafa;
--color-grey-100: #f5f5f5;
--color-grey-200: #eeeeee;
--color-grey-300: #e0e0e0;
--color-grey-400: #bdbdbd;
--color-grey-500: #9e9e9e;
--color-grey-600: #757575;
--color-grey-700: #616161;
--color-grey-800: #424242;
--color-grey-900: #212121;
```

### Usage Guidelines

- **Primary colors** for main CTAs and important actions
- **Secondary colors** for supporting actions and accents
- **Semantic colors** maintain consistency with user expectations
- **High contrast** ensures readability (minimum 4.5:1 for normal text)

## Typography

### Font Family

```css
font-family:
  'ui-rounded',
  'SF Pro Rounded',
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  Roboto,
  'Helvetica Neue',
  Arial,
  sans-serif;
```

### Type Scale

```css
/* Mobile First Scale */
--type-h1: 2rem; /* 32px - Page titles */
--type-h2: 1.5rem; /* 24px - Section headers */
--type-h3: 1.25rem; /* 20px - Card titles */
--type-h4: 1.125rem; /* 18px - Subsection headers */
--type-h5: 1rem; /* 16px - Emphasized body */
--type-h6: 0.875rem; /* 14px - Small headers */
--type-body1: 1rem; /* 16px - Main content */
--type-body2: 0.875rem; /* 14px - Secondary content */
--type-caption: 0.75rem; /* 12px - Captions & labels */
--type-button: 0.875rem; /* 14px - Button text */
```

### Responsive Typography

```typescript
// Desktop adjustments (≥900px)
@media (min-width: 900px) {
  --type-h1: 3rem;      /* 48px */
  --type-h2: 2.125rem;  /* 34px */
  --type-h3: 1.5rem;    /* 24px */
  --type-h4: 1.25rem;   /* 20px */
}
```

### Font Weights

```css
--weight-light: 300;
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
```

### Line Heights

```css
--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;
```

## Spacing & Layout

### Base Unit

```css
--spacing-unit: 8px; /* All spacing based on 8px grid */
```

### Spacing Scale

```css
--spacing-xs: 4px; /* 0.5 units */
--spacing-sm: 8px; /* 1 unit */
--spacing-md: 16px; /* 2 units */
--spacing-lg: 24px; /* 3 units */
--spacing-xl: 32px; /* 4 units */
--spacing-2xl: 48px; /* 6 units */
--spacing-3xl: 64px; /* 8 units */
```

### Responsive Spacing

```typescript
// Mobile (<600px)
mobilePadding: 2,    // 16px
mobileSpacing: 2,    // 16px

// Tablet (600-900px)
tabletPadding: 3,    // 24px
tabletSpacing: 3,    // 24px

// Desktop (>900px)
desktopPadding: 3,   // 24px
desktopSpacing: 4,   // 32px
```

### Container Widths

```css
--max-width-xs: 444px;
--max-width-sm: 600px;
--max-width-md: 900px;
--max-width-lg: 1200px;
--max-width-xl: 1536px;
```

### Border Radius

```css
--radius-small: 4px;
--radius-default: 8px;
--radius-large: 12px;
--radius-round: 50%;
```

## Component Patterns

### Buttons

#### Primary Button

```css
min-height: 44px; /* Touch-friendly */
border-radius: 8px;
background: var(--color-primary-main);
color: white;
font-weight: 500;
padding: 0 16px;
```

#### Button Variants

- **Contained**: Solid background, high emphasis
- **Outlined**: Border only, medium emphasis
- **Text**: No border/background, low emphasis
- **Icon Button**: 44x44px minimum touch target
- **Destructive**: Red background for dangerous actions

### Component States

All interactive components must include these states:

```css
/* Default */
opacity: 1;
cursor: pointer;

/* Hover */
opacity: 0.9;
transform: translateY(-1px);
transition: all 200ms ease-out;

/* Active/Pressed */
transform: translateY(0);
opacity: 0.95;

/* Focus (Keyboard) */
outline: 2px solid var(--color-primary-main);
outline-offset: 2px;

/* Disabled */
opacity: 0.38;
cursor: not-allowed;
pointer-events: none;
```

### Cards

```css
background: var(--color-background-paper);
border-radius: 8px;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
padding: 24px;
```

### Text Fields

```css
min-height: 44px; /* Touch-friendly */
border-radius: 8px;
background: var(--color-background-paper);
```

### Navigation

#### Mobile Bottom Navigation

```css
height: 64px;
background: #a34357;
box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.1);
```

#### Desktop Top Navigation

```css
height: 64px;
background: #fffefc;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
```

### Dialogs & Modals

```css
max-width: 600px (mobile);
max-width: 800px (desktop);
border-radius: 12px;
padding: 24px;
```

### Chips & Badges

```css
height: 24px;
border-radius: 12px;
font-size: 0.75rem;
padding: 0 8px;
```

### Lists

- **Spacing**: 16px between items
- **Dividers**: 1px solid var(--color-grey-200)
- **Hover**: Background var(--color-grey-50)

## Responsive Design

### Breakpoints

```css
--breakpoint-xs: 0px; /* Mobile */
--breakpoint-sm: 600px; /* Tablet */
--breakpoint-md: 900px; /* Desktop */
--breakpoint-lg: 1200px; /* Large Desktop */
--breakpoint-xl: 1536px; /* Extra Large */
```

### Navigation Patterns

- **Mobile (<600px)**: Bottom navigation with 6 items
- **Tablet (600-900px)**: Top app bar with hamburger menu
- **Desktop (≥900px)**: Horizontal top navigation

### Grid System

```typescript
// Mobile: Single column
mobile={12}

// Tablet: 2 columns
tablet={6}

// Desktop: 3-4 columns
desktop={4}
```

### Responsive Components

- **Tables**: Convert to cards on mobile
- **Complex forms**: Stack fields vertically on mobile
- **Button groups**: Convert to dropdown on mobile
- **Sidebars**: Convert to bottom sheets on mobile

## Iconography

### Icon System

- **Library**: Material Icons (Material UI)
- **Size**: 24px default, 20px small, 28px large
- **Color**: Inherit from parent text color
- **Touch Target**: Minimum 44x44px for interactive icons

### Common Icons

```typescript
// Navigation
Home, Person, ShoppingBag, CalendarMonth, Dashboard, Menu

// Actions
Add, Edit, Delete, Save, Cancel, Search, Filter, Sort

// Status
CheckCircle, Error, Warning, Info, Pending

// Services
Star (frequently used), AccessTime (hourly), AttachMoney (price)
```

### Icon Guidelines

- Use filled variants for selected/active states
- Use outlined variants for default states
- Maintain consistent metaphors across the app
- Always include aria-labels for accessibility

## Visual Hierarchy & White Space

### Hierarchy Principles

1. **Size**: Larger elements draw more attention
2. **Weight**: Bold text creates emphasis
3. **Color**: Primary colors for CTAs, muted for secondary
4. **Spacing**: More space = more importance
5. **Position**: Top-left gets noticed first (LTR languages)

### White Space Guidelines

```css
/* Content Breathing Room */
--content-padding-mobile: 16px;
--content-padding-desktop: 24px;

/* Section Separation */
--section-spacing-mobile: 32px;
--section-spacing-desktop: 48px;

/* Element Grouping */
--related-items: 8px; /* Tightly related */
--loose-items: 16px; /* Loosely related */
--unrelated-items: 24px; /* Different sections */
```

### Visual Weight

- **Primary Actions**: Full color, larger size
- **Secondary Actions**: Outlined or text only
- **Tertiary Info**: Smaller, muted colors
- **Disabled State**: 38% opacity

## Motion & Animation

### Transition Timing

```css
--duration-instant: 100ms;
--duration-fast: 150-200ms; /* Micro-interactions */
--duration-normal: 250-300ms; /* State changes */
--duration-slow: 400ms; /* Page transitions */

/* Easing Functions */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1); /* Standard */
--ease-out: cubic-bezier(0, 0, 0.2, 1); /* Enter */
--ease-in: cubic-bezier(0.4, 0, 1, 1); /* Exit */
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275); /* Playful */
```

### Micro-interactions

```css
/* Button Press */
button:active {
  transform: scale(0.98);
  transition: transform 100ms ease-out;
}

/* Card Hover */
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transition: all 200ms ease-out;
}

/* Focus Ring Animation */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 0;
  animation: focus-ring 200ms ease-out;
}

@keyframes focus-ring {
  from {
    outline-offset: 0;
  }
  to {
    outline-offset: 2px;
  }
}
```

### Common Animations

- **Page transitions**: Fade in/out (200ms)
- **Dialog open/close**: Scale + fade (250-300ms)
- **Accordion expand**: Height transition (250ms)
- **Loading spinners**: Continuous rotation (1s)
- **Toast notifications**: Slide + fade (200ms)
- **Skeleton screens**: Shimmer effect (1.5s loop)

### Animation Principles

- **Purpose Over Polish**: Every animation must improve UX
- **Performance First**: Use CSS transforms over position changes
- **Respect Preferences**: Honor `prefers-reduced-motion`
- **Mobile Considerations**: Reduce or remove on scroll
- **Consistency**: Same actions = same animations

## Loading & Error States

### Loading Patterns

#### Page Loading

```typescript
<Box sx={{ display: 'flex', justifyContent: 'center', minHeight: '50vh' }}>
  <CircularProgress />
</Box>
```

#### Skeleton Loading

Skeleton screens provide better perceived performance than spinners:

```typescript
// Match content structure exactly
<Skeleton variant="text" width={200} height={32} />  // Title
<Skeleton variant="text" width="100%" height={20} /> // Description
<Skeleton variant="rectangular" height={200} />      // Image
<Skeleton variant="circular" width={40} height={40} /> // Avatar

// Shimmer animation
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 25%,
    #e0e0e0 50%,
    #f0f0f0 75%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}
```

#### Progressive Loading Strategy

1. **Initial Load**: Show skeleton for entire view
2. **Partial Data**: Replace skeletons as data arrives
3. **Complete**: Remove all loading indicators
4. **Error Recovery**: Show error state with retry

#### Loading Text

- "Loading..." for initial loads
- "Loading more..." for pagination
- "Saving..." for form submissions
- "Processing..." for calculations
- "Uploading..." for file transfers

### Error States

#### Error Messages

```typescript
<Alert severity="error">
  {errorMessage}
</Alert>
```

#### Empty States

```typescript
<Box sx={{ textAlign: 'center', py: 4 }}>
  <Typography variant="h6">No results found</Typography>
  <Typography variant="body2" color="text.secondary">
    Try adjusting your filters
  </Typography>
</Box>
```

### Success States

```typescript
// Toast notification
toast.success('Order created successfully');

// Inline alert
<Alert severity="success">Changes saved</Alert>
```

## Accessibility Standards

### WCAG 2.1 AA Compliance

#### Color Contrast

- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text**: Minimum 3:1 contrast ratio
- **Interactive elements**: Minimum 3:1 against background

#### Keyboard Navigation

- All interactive elements keyboard accessible
- Visible focus indicators (2px outline)
- Logical tab order
- Skip links for navigation

#### Screen Readers

- Semantic HTML structure
- Proper heading hierarchy
- ARIA labels for icons and buttons
- Live regions for dynamic content

#### Touch Targets

- **Minimum size**: 44x44px
- **Spacing**: 8px minimum between targets
- **Error recovery**: Confirmation for destructive actions

### Testing Requirements

```typescript
// Automated testing with axe-core
- Run on every page
- Fix all critical/serious issues
- Document any false positives

// Manual testing
- Keyboard navigation
- Screen reader testing
- Color contrast verification
- Mobile touch testing
```

## Design Tokens

### Token Structure

```typescript
interface DesignTokens {
  color: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  breakpoint: BreakpointTokens;
  shadow: ShadowTokens;
  radius: RadiusTokens;
  transition: TransitionTokens;
}
```

### Implementation

Design tokens are implemented in:

- `/src/constants/colors.ts` - Color palette
- `/src/components/providers/ThemeProvider.tsx` - MUI theme
- Component-level sx props for responsive values

## Data Table Design Patterns

### Table Structure

```css
/* Table Layout */
--table-header-height: 48px;
--table-row-height: 52px;
--table-cell-padding: 16px;
--table-compact-padding: 8px;
```

### Table Best Practices

#### Column Alignment

- **Text**: Left-aligned
- **Numbers**: Right-aligned
- **Dates**: Left-aligned
- **Actions**: Right-aligned or center
- **Status**: Center with badges

#### Visual Hierarchy

```css
/* Headers */
th {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Row Hover */
tr:hover {
  background: var(--color-grey-50);
}

/* Zebra Striping (optional) */
tr:nth-child(even) {
  background: rgba(0, 0, 0, 0.02);
}
```

#### Interactive Features

- **Sorting**: Clickable headers with arrow indicators
- **Filtering**: Inline filters or filter bar above table
- **Search**: Global search above table
- **Selection**: Checkboxes with bulk action toolbar
- **Pagination**: Prefer pagination over infinite scroll for data integrity

#### Mobile Tables

```typescript
// Convert to cards on mobile
if (isMobile) {
  return <MobileCardView />;
} else {
  return <DesktopTableView />;
}
```

### Specific Table Patterns

#### Clients Table

- Primary: Client name (clickable link)
- Secondary: Email, phone
- Status: Active/inactive badge
- Actions: Edit, view orders, archive

#### Orders Table

- Primary: Order number
- Secondary: Client name, date
- Status: Stage indicator with color
- Amount: Right-aligned with currency
- Actions: View, edit, invoice

#### Services Table

- Primary: Service name
- Secondary: Description (truncated)
- Price: Right-aligned
- Frequency: Badge indicator
- Actions: Edit, delete, duplicate

## Configuration Panel Patterns

### Settings Organization

#### Progressive Disclosure

```typescript
// Basic settings visible by default
<BasicSettings />

// Advanced behind accordion/toggle
<Accordion>
  <AccordionSummary>Advanced Settings</AccordionSummary>
  <AccordionDetails>
    <AdvancedSettings />
  </AccordionDetails>
</Accordion>
```

#### Grouping Strategy

1. **By Frequency**: Most used settings first
2. **By Workflow**: Group related tasks
3. **By Impact**: Dangerous settings separated
4. **By User Role**: Hide admin-only settings

### Form Patterns

#### Field Types by Data

- **Text**: Standard input with validation
- **Toggle**: Boolean on/off states
- **Select**: 3-7 predefined options
- **Radio**: 2-5 mutually exclusive options
- **Slider**: Numeric ranges with visual feedback
- **Date/Time**: Native pickers on mobile

#### Validation & Feedback

```css
/* Success State */
.field-success {
  border-color: var(--color-success);
}

/* Error State */
.field-error {
  border-color: var(--color-error);
  background: rgba(139, 58, 66, 0.05);
}

/* Helper Text */
.helper-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 4px;
}
```

#### Save Patterns

- **Auto-save**: For non-critical settings
- **Explicit Save**: For business-critical data
- **Save Confirmation**: Toast or inline message
- **Undo Option**: For destructive changes

## CSS Architecture

### Methodology: CSS-in-JS with Material UI

Our approach uses Material UI's `sx` prop for component styling:

```typescript
// Component-level styling
<Box sx={{
  color: 'primary.main',
  p: 2,  // theme.spacing(2)
  mb: 3, // margin-bottom: theme.spacing(3)
  borderRadius: 1, // theme.shape.borderRadius
}}/>
```

### Token Usage

Always reference theme values instead of hard-coding:

```typescript
// ❌ BAD
sx={{ color: '#B85563', padding: '16px' }}

// ✅ GOOD
sx={{ color: 'primary.main', p: 2 }}
```

### Performance Guidelines

1. **Prefer sx prop** over inline styles
2. **Use responsive arrays** for breakpoints
3. **Avoid deep nesting** of sx props
4. **Extract complex styles** to theme variants
5. **Lazy load** heavy components

### Maintainability

```typescript
// Extract repeated patterns
const cardStyles = {
  p: 3,
  borderRadius: 2,
  bgcolor: 'background.paper',
  boxShadow: 1,
};

// Reuse across components
<Card sx={cardStyles} />
```

## Implementation Guidelines

### Component Creation

1. Start with mobile design
2. Use theme values, not hard-coded colors
3. Implement loading and error states
4. Add accessibility attributes
5. Write tests alongside implementation

### Responsive Implementation

```typescript
// Use responsive props
sx={{
  fontSize: { xs: '1rem', md: '1.25rem' },
  padding: { xs: 2, sm: 3, md: 4 },
  display: { xs: 'block', md: 'flex' }
}}
```

### Theme Usage

```typescript
// Always use theme values
sx={{
  color: 'primary.main',
  bgcolor: 'background.paper',
  spacing: 2,
  borderRadius: 1
}}
```

## Performance & Optimization

### Critical Metrics

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms

### Performance Guidelines

#### Images

```typescript
// Use Next.js Image for optimization
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={100}
  loading="lazy"
  placeholder="blur"
/>
```

#### Code Splitting

```typescript
// Lazy load heavy components
const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  {
    loading: () => <Skeleton />,
    ssr: false
  }
);
```

#### CSS Performance

- Use CSS transforms over position changes
- Avoid complex selectors
- Minimize reflows and repaints
- Use `will-change` sparingly
- Prefer CSS animations over JavaScript

#### Mobile Performance

- Reduce JavaScript bundle size
- Minimize network requests
- Use service workers for caching
- Implement virtual scrolling for long lists
- Optimize touch interactions

## Information Architecture

### Navigation Principles

1. **Maximum 3 Clicks**: Any feature accessible within 3 clicks
2. **Clear Labels**: Avoid jargon, use user's language
3. **Consistent Placement**: Navigation always in same location
4. **Visual Feedback**: Show current location clearly
5. **Predictable Behavior**: Similar items behave similarly

### Content Organization

#### For Seamstresses (Primary Users)

- **Priority 1**: Active orders & appointments
- **Priority 2**: Client management
- **Priority 3**: Services & pricing
- **Priority 4**: Business insights
- **Priority 5**: Settings & configuration

#### Mobile Navigation (6 Core Items)

1. Dashboard - Overview & quick actions
2. Clients - Customer management
3. Orders - Order tracking & management
4. Appointments - Calendar & scheduling
5. Garments - Garment tracking
6. More - Settings, services, reports

## Gaps & Inconsistencies

### 🔴 Critical Issues

#### 1. Mixed Component Libraries

- **Issue**: Using both MUI components and custom Radix/shadcn components
- **Impact**: Inconsistent styling and behavior
- **TODO**: Standardize on Material UI or complete migration to custom components

#### 2. Inconsistent Toast Implementation

- **Issue**: Two different toast systems (react-hot-toast and custom)
- **Files**: `/src/hooks/useToast.ts` and `/src/hooks/use-toast.ts`
- **TODO**: Consolidate to single toast system

#### 3. Navigation Bar Color Inconsistency

- **Issue**: Custom navigation color (#A34357) doesn't match main palette
- **TODO**: Align navigation colors with primary palette or document as intentional brand element

### 🟡 Medium Priority

#### 4. ~~Missing Animation System~~ ✅ ADDRESSED

- **Status**: Animation guidelines now documented
- **Next Steps**: Implement animation utilities library

#### 5. Loading State Standardization

- **Issue**: Inconsistent use of spinners vs skeletons
- **TODO**: Enforce skeleton screens for content, spinners for actions
- **Priority**: Implement progressive loading strategy

#### 6. Form Validation Patterns

- **Issue**: No consistent validation UI patterns
- **Status**: Basic patterns documented
- **TODO**: Create validation component library

#### 7. Data Visualization

- **Issue**: No chart/graph standards defined
- **TODO**: Define color schemes and patterns for data viz

### 🟢 Enhancements

#### 8. Dark Mode Support

- **Issue**: Only light mode currently supported
- **TODO**: Define dark mode color palette and implementation

#### 9. Print Styles

- **Issue**: No print-specific styles defined
- **TODO**: Add print stylesheet for invoices and reports

#### 10. Icon Consistency

- **Issue**: Mix of Material Icons and custom SVGs
- **TODO**: Audit and standardize icon usage

#### 11. Micro-interactions

- **Issue**: Limited hover/active state feedback
- **TODO**: Define consistent interaction feedback patterns

#### 12. Typography Hierarchy

- **Issue**: Inconsistent use of heading levels
- **TODO**: Enforce semantic heading structure

### Implementation Checklist

When implementing new features, ensure:

- [ ] Mobile-first responsive design
- [ ] Uses design tokens from theme
- [ ] Includes loading states
- [ ] Includes error states
- [ ] Includes empty states
- [ ] Meets WCAG 2.1 AA standards
- [ ] Has proper TypeScript types
- [ ] Follows spacing grid system
- [ ] Uses consistent animation patterns
- [ ] Includes unit tests
- [ ] Documented in component library

## Quick Reference Card

### Essential Values

```css
/* Colors */
Primary: #b85563
Secondary: #cc8b70
Error: #8b3a42
Success: #7c9885
Background: #fffefc

/* Spacing (8px base) */
xs: 4px, sm: 8px, md: 16px
lg: 24px, xl: 32px, 2xl: 48px

/* Typography */
Body: 1rem (16px)
Small: 0.875rem (14px)
H1: 2rem mobile / 3rem desktop

/* Breakpoints */
Mobile: <600px
Tablet: 600-900px
Desktop: ≥900px

/* Touch Targets */
Minimum: 44x44px
Spacing: 8px between

/* Animation */
Fast: 150-200ms
Normal: 250-300ms
Easing: cubic-bezier(0.4, 0, 0.2, 1)

/* Border Radius */
Small: 4px
Default: 8px
Large: 12px
```

### Component Checklist

- [ ] Mobile-first design
- [ ] All 5 states (default, hover, active, focus, disabled)
- [ ] Loading state (skeleton or spinner)
- [ ] Error state with recovery
- [ ] Empty state with guidance
- [ ] WCAG AA compliant
- [ ] Touch-friendly (44px targets)
- [ ] Keyboard navigable
- [ ] Theme tokens used (no hard-coded values)
- [ ] Responsive behavior defined
- [ ] Animation respects reduced-motion
- [ ] TypeScript typed
- [ ] Unit tested

## Version History

- **v2.0.0** (2024-01-13): Major update with S-tier patterns
  - Added Visual Hierarchy guidelines
  - Enhanced Animation system
  - Added Data Table patterns
  - Added Configuration Panel patterns
  - Added Performance guidelines
  - Added Information Architecture
  - Added Quick Reference Card

- **v1.0.0** (2024-01-13): Initial style guide creation
  - Documented existing patterns
  - Identified gaps and inconsistencies
  - Created implementation guidelines

## Resources

### Internal Documentation

- `/docs/responsive-design-guide.md` - Responsive implementation details
- `/docs/COLOR_PALETTE_IMPLEMENTATION.md` - Color system details
- `/src/components/layout/README.md` - Layout component documentation

### External Resources

- [Material UI Documentation](https://mui.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Guidelines](https://material.io/design)

---

_This style guide is a living document. Update it as the design system evolves._
