# Hemsy Coding Standards

## Table of Contents

1. [Introduction](#1-introduction)
2. [Core Principles](#2-core-principles)
3. [TypeScript Standards](#3-typescript-standards)
4. [React & Next.js Patterns](#4-react-nextjs-patterns)
5. [Component Architecture](#5-component-architecture)
6. [Server Actions & Data Operations](#6-server-actions-data-operations)
7. [Testing Standards (MANDATORY)](#7-testing-standards-mandatory)
8. [Mobile-First Development](#8-mobile-first-development)
9. [Accessibility Standards](#9-accessibility-standards)
10. [Performance Guidelines](#10-performance-guidelines)
11. [Error Handling & Logging](#11-error-handling-logging)
12. [Security Best Practices](#12-security-best-practices)
13. [Code Organization](#13-code-organization)
14. [Git Workflow & Commits](#14-git-workflow-commits)
15. [Documentation Standards](#15-documentation-standards)

## 1. Introduction

This document defines the coding standards for all developers and AI agents working on Hemsy. These standards are **mandatory** and ensure consistency, maintainability, and quality across the codebase.

**Note**: Hemsy is a mobile-first web application built with Next.js. While we prioritize mobile user experience and performance, we are not implementing PWA features or offline functionality at this time to reduce complexity.

### Key Documents to Read First

- `PRD.md` - Product Requirements Document
- `architecture.md` - System Architecture Overview
- `docs/TESTING_GUIDE.md` - Comprehensive Testing Guide

### Tech Stack Reference

- **Runtime**: Node.js 22.17.1 (LTS)
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript (strict mode)
- **UI Library**: Material UI v6
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk
- **Payments**: Stripe
- **Styling**: CSS Modules + Material UI Theme

## 2. Core Principles

### 2.1 Mobile-First Design

**MANDATORY**: All features must be designed and implemented mobile-first.

```typescript
// ❌ BAD: Desktop-first thinking
<Grid container spacing={3}>
  <Grid item xs={12} md={4}>...</Grid>
</Grid>

// ✅ GOOD: Mobile-first with progressive enhancement
<Box sx={{
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' },
  gap: { xs: 2, md: 3 }
}}>
```

### 2.2 Test-Driven Development

**MANDATORY**: No feature is complete without tests. Tests must be written BEFORE or ALONGSIDE implementation.

### 2.3 Type Safety

Use TypeScript strictly. No `any` types unless absolutely necessary and documented.

### 2.4 Performance First

Design all features with performance in mind. Optimize for fast load times and smooth interactions.

## 3. TypeScript Standards

### 3.1 Strict Configuration

```typescript
// tsconfig.json must include:
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 3.2 Type Definitions

```typescript
// ❌ BAD: Implicit or loose types
const processOrder = (data) => { ... }
const status: string = getStatus()

// ✅ GOOD: Explicit, strict types
interface OrderData {
  clientId: string
  items: OrderItem[]
  totalAmount: number
}

const processOrder = (data: OrderData): Promise<Order> => { ... }
const status: OrderStatus = getStatus() // Use enums or literal types
```

### 3.3 Enums and Constants

```typescript
// Use const assertions for literal types
export const ORDER_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type OrderStatus = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];
```

## 4. React & Next.js Patterns

### 4.1 Component Structure

```typescript
// ✅ GOOD: Functional component with proper typing
interface ButtonProps {
  variant?: 'primary' | 'secondary'
  size?: 'small' | 'medium' | 'large'
  onClick?: () => void
  children: React.ReactNode
  disabled?: boolean
}

export function Button({
  variant = 'primary',
  size = 'medium',
  onClick,
  children,
  disabled = false
}: ButtonProps) {
  return (
    <MuiButton
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      sx={{
        // Mobile-first responsive styles
        padding: { xs: 1, sm: 1.5, md: 2 }
      }}
    >
      {children}
    </MuiButton>
  )
}
```

### 4.2 Server Components by Default

```typescript
// ✅ GOOD: Server Component (default)
// app/clients/page.tsx
export default async function ClientsPage() {
  const clients = await getClients() // Server-side data fetching
  return <ClientsList clients={clients} />
}

// Mark client components explicitly
// components/ClientsList.tsx
'use client'

export function ClientsList({ clients }: { clients: Client[] }) {
  // Client-side interactivity
}
```

### 4.3 Data Fetching Patterns

```typescript
// ✅ GOOD: Server Actions for mutations
// lib/actions/clients.ts
'use server';

export async function createClient(
  data: ClientFormData
): Promise<ActionResult<Client>> {
  try {
    // Validate input
    const validated = clientSchema.parse(data);

    // Check permissions
    const { userId } = await auth();
    if (!userId) throw new Error('Unauthorized');

    // Perform operation
    const client = await db.clients.create({
      data: {
        ...validated,
        user_id: userId,
      },
    });

    // Revalidate cache
    revalidatePath('/clients');

    return { success: true, data: client };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

## 5. Component Architecture

### 5.1 Component Organization

```
src/components/
├── ui/                    # Basic UI components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
├── features/              # Feature-specific components
│   ├── clients/
│   │   ├── ClientCard.tsx
│   │   ├── ClientForm.tsx
│   │   └── ClientsList.tsx
├── layout/                # Layout components
│   ├── ResponsiveNav.tsx
│   └── ResponsiveContainer.tsx
└── providers/             # Context providers
    └── ThemeProvider.tsx
```

### 5.2 Component Best Practices

```typescript
// ✅ GOOD: Composable, testable component
interface ClientCardProps {
  client: Client
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  variant?: 'default' | 'compact'
}

export function ClientCard({
  client,
  onEdit,
  onDelete,
  variant = 'default'
}: ClientCardProps) {
  return (
    <Card
      sx={{
        // Mobile-first responsive design
        padding: { xs: 2, sm: 3 },
        '&:active': {
          // Touch feedback for mobile
          backgroundColor: 'action.selected'
        }
      }}
    >
      <CardContent>
        <Typography variant="h6" component="h2">
          {client.name}
        </Typography>
        {/* Accessible touch targets */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          {onEdit && (
            <IconButton
              onClick={() => onEdit(client.id)}
              aria-label={`Edit ${client.name}`}
              size="large" // 48px touch target
            >
              <EditIcon />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}
```

## 6. Server Actions & Data Operations

### 6.1 Server Action Structure

```typescript
// lib/actions/orders.ts
'use server';

import { z } from 'zod';
import { auth } from '@clerk/nextjs';
import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Input validation schema
const createOrderSchema = z.object({
  clientId: z.string().uuid(),
  garmentId: z.string().uuid(),
  serviceIds: z.array(z.string().uuid()).min(1),
  notes: z.string().optional(),
  dueDate: z.string().datetime(),
});

export async function createOrder(
  input: unknown
): Promise<ActionResult<Order>> {
  try {
    // 1. Authenticate
    const { userId } = await auth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    // 2. Validate input
    const data = createOrderSchema.parse(input);

    // 3. Initialize Supabase client
    const supabase = createServerClient();

    // 4. Verify ownership (RLS backup check)
    const { data: client } = await supabase
      .from('clients')
      .select('id')
      .eq('id', data.clientId)
      .eq('user_id', userId)
      .single();

    if (!client) {
      return { success: false, error: 'Client not found' };
    }

    // 5. Perform operation
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        ...data,
        user_id: userId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // 6. Revalidate cache
    revalidatePath('/orders');
    revalidatePath(`/clients/${data.clientId}`);

    return { success: true, data: order };
  } catch (error) {
    console.error('Create order error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid input',
        fieldErrors: error.flatten().fieldErrors,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create order',
    };
  }
}
```

### 6.2 Optimistic Updates for Better UX

Optimistic updates provide immediate UI feedback for better user experience, reducing perceived latency.

```typescript
// components/features/orders/OrderForm.tsx
'use client'

import { useOptimistic } from 'react'
import { createOrder } from '@/lib/actions/orders'

export function OrderForm({ clientId }: { clientId: string }) {
  const [optimisticOrders, addOptimisticOrder] = useOptimistic(
    orders,
    (state, newOrder: Order) => [...state, newOrder]
  )

  async function handleSubmit(formData: FormData) {
    const tempOrder: Order = {
      id: `temp-${Date.now()}`,
      // ... other fields
      status: 'pending'
    }

    // Optimistically add order
    addOptimisticOrder(tempOrder)

    // Perform server action
    const result = await createOrder(formData)

    if (!result.success) {
      // Handle error and revert optimistic update
      toast.error(result.error)
    }
  }

  return (
    <form action={handleSubmit}>
      {/* Form fields */}
    </form>
  )
}
```

## 7. Testing Standards (MANDATORY)

### 7.1 Test Coverage Requirements

**MANDATORY MINIMUMS:**

- Unit Tests: 80% coverage
- Integration Tests: All Server Actions
- E2E Tests: Critical user journeys
- Accessibility Tests: All pages

### 7.2 Unit Testing

```typescript
// components/ui/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies correct variant styles', () => {
    const { rerender } = render(<Button variant="primary">Test</Button>)
    expect(screen.getByRole('button')).toHaveClass('MuiButton-containedPrimary')

    rerender(<Button variant="secondary">Test</Button>)
    expect(screen.getByRole('button')).toHaveClass('MuiButton-containedSecondary')
  })
})
```

### 7.3 Integration Testing Server Actions

```typescript
// lib/actions/clients.test.ts
import { createClient, updateClient, deleteClient } from './clients';
import { createServerClient } from '@/lib/supabase/server';

jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(() => ({ userId: 'test-user-id' })),
}));

jest.mock('@/lib/supabase/server');

describe('Client Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createClient', () => {
    it('creates client with valid data', async () => {
      const mockClient = {
        id: 'client-123',
        name: 'John Doe',
        email: 'john@example.com',
        user_id: 'test-user-id',
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockClient, error: null }),
      };

      (createServerClient as jest.Mock).mockReturnValue(mockSupabase);

      const result = await createClient({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
      });

      expect(result).toEqual({ success: true, data: mockClient });
      expect(mockSupabase.from).toHaveBeenCalledWith('clients');
    });

    it('handles validation errors', async () => {
      const result = await createClient({
        name: '', // Invalid: empty name
        email: 'invalid-email', // Invalid: bad email format
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid input');
      expect(result.fieldErrors).toBeDefined();
    });

    it('handles unauthorized requests', async () => {
      jest.mocked(auth).mockResolvedValueOnce({ userId: null } as any);

      const result = await createClient({
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(result).toEqual({ success: false, error: 'Unauthorized' });
    });
  });
});
```

### 7.4 E2E Testing

```typescript
// __tests__/e2e/client-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Client Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/sign-in');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('create new client - mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to clients
    await page.click('[aria-label="Open navigation menu"]');
    await page.click('text=Clients');
    await page.waitForURL('/clients');

    // Click add button
    await page.click('[aria-label="Add new client"]');
    await page.waitForURL('/clients/new');

    // Fill form
    await page.fill('[name="name"]', 'Jane Smith');
    await page.fill('[name="email"]', 'jane@example.com');
    await page.fill('[name="phone"]', '555-0123');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page).toHaveURL(/\/clients\/[a-z0-9-]+/);
    await expect(page.locator('h1')).toContainText('Jane Smith');
  });

  test('search and filter clients', async ({ page }) => {
    await page.goto('/clients');

    // Search
    await page.fill('[aria-label="Search clients"]', 'John');
    await page.waitForTimeout(300); // Debounce

    // Verify filtered results
    const clientCards = page.locator('[data-testid="client-card"]');
    await expect(clientCards).toHaveCount(1);
    await expect(clientCards.first()).toContainText('John Doe');
  });
});
```

### 7.5 Accessibility Testing

```typescript
// __tests__/a11y/pages.test.tsx
import { axe } from 'jest-axe';
import { render } from '@testing-library/react';
import ClientsPage from '@/app/(app)/clients/page';

describe('Accessibility', () => {
  it('Clients page has no accessibility violations', async () => {
    const { container } = render(await ClientsPage());
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## 8. Mobile-First Development

### 8.1 Responsive Design Patterns

```typescript
// ✅ GOOD: Mobile-first responsive utilities
import { useMediaQuery, useTheme } from '@mui/material';

export function useResponsive() {
  const theme = useTheme();

  return {
    isMobile: useMediaQuery(theme.breakpoints.down('sm')),
    isTablet: useMediaQuery(theme.breakpoints.between('sm', 'md')),
    isDesktop: useMediaQuery(theme.breakpoints.up('md')),

    // Touch device detection
    hasTouch: 'ontouchstart' in window,
  };
}
```

### 8.2 Touch-Optimized Interfaces

```typescript
// ✅ GOOD: Touch-friendly component
export function ActionButton({ onPress, children }: ActionButtonProps) {
  return (
    <Button
      onClick={onPress}
      sx={{
        // Minimum 48px touch target
        minHeight: 48,
        minWidth: 48,

        // Visual feedback for touch
        '&:active': {
          transform: 'scale(0.98)',
          transition: 'transform 0.1s'
        },

        // Prevent text selection on touch
        userSelect: 'none',
        WebkitUserSelect: 'none',

        // Larger padding on mobile
        padding: { xs: 2, sm: 1.5 }
      }}
    >
      {children}
    </Button>
  )
}
```

### 8.3 Mobile Navigation Patterns

```typescript
// ✅ GOOD: Bottom navigation for mobile
export function MobileNav() {
  const pathname = usePathname()

  return (
    <BottomNavigation
      value={pathname}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        // Account for iOS safe area
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <BottomNavigationAction
        label="Dashboard"
        value="/dashboard"
        icon={<DashboardIcon />}
      />
      <BottomNavigationAction
        label="Clients"
        value="/clients"
        icon={<PeopleIcon />}
      />
      <BottomNavigationAction
        label="Orders"
        value="/orders"
        icon={<ReceiptIcon />}
      />
      <BottomNavigationAction
        label="More"
        value="/more"
        icon={<MoreHorizIcon />}
      />
    </BottomNavigation>
  )
}
```

## 9. Accessibility Standards

### 9.1 WCAG 2.1 AA Compliance

```typescript
// ✅ GOOD: Accessible form with proper labels and error handling
export function AccessibleForm() {
  const [errors, setErrors] = useState<Record<string, string>>({})

  return (
    <form aria-label="Create new client">
      <TextField
        id="client-name"
        name="name"
        label="Client Name"
        required
        error={!!errors.name}
        helperText={errors.name}
        inputProps={{
          'aria-describedby': errors.name ? 'name-error' : undefined,
          'aria-invalid': !!errors.name
        }}
      />

      {errors.name && (
        <span id="name-error" role="alert" className="sr-only">
          {errors.name}
        </span>
      )}

      <Button
        type="submit"
        aria-busy={isSubmitting}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating...' : 'Create Client'}
      </Button>
    </form>
  )
}
```

### 9.2 Keyboard Navigation

```typescript
// ✅ GOOD: Keyboard-navigable dropdown
export function KeyboardDropdown({ options, onSelect }: DropdownProps) {
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev =>
          prev < options.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev =>
          prev > 0 ? prev - 1 : options.length - 1
        )
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0) {
          onSelect(options[focusedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
    }
  }

  return (
    <Menu
      onKeyDown={handleKeyDown}
      autoFocus
      role="listbox"
      aria-label="Select an option"
    >
      {options.map((option, index) => (
        <MenuItem
          key={option.id}
          role="option"
          aria-selected={index === focusedIndex}
          tabIndex={index === focusedIndex ? 0 : -1}
          ref={el => {
            if (index === focusedIndex && el) {
              el.focus()
            }
          }}
        >
          {option.label}
        </MenuItem>
      ))}
    </Menu>
  )
}
```

## 10. Performance Guidelines

### 10.1 Code Splitting

```typescript
// ✅ GOOD: Lazy load heavy components
const HeavyChart = dynamic(() => import('@/components/charts/OrdersChart'), {
  loading: () => <Skeleton height={400} />,
  ssr: false // Disable SSR for client-only components
})

// Route-based code splitting happens automatically with Next.js App Router
```

### 10.2 Image Optimization

```typescript
// ✅ GOOD: Optimized image loading
import Image from 'next/image'

export function ClientAvatar({ client }: { client: Client }) {
  return (
    <Image
      src={client.avatarUrl || '/default-avatar.png'}
      alt={`${client.name} avatar`}
      width={48}
      height={48}
      sizes="(max-width: 768px) 48px, 64px"
      priority={false} // Only use priority for above-the-fold images
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..." // Generate with plaiceholder
    />
  )
}
```

### 10.3 Data Fetching Optimization

```typescript
// ✅ GOOD: Parallel data fetching
export default async function DashboardPage() {
  // Fetch data in parallel
  const [clients, orders, appointments] = await Promise.all([
    getRecentClients(),
    getPendingOrders(),
    getUpcomingAppointments()
  ])

  return (
    <DashboardLayout>
      <Suspense fallback={<ClientsSkeleton />}>
        <ClientsList clients={clients} />
      </Suspense>

      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersList orders={orders} />
      </Suspense>

      <Suspense fallback={<AppointmentsSkeleton />}>
        <AppointmentsList appointments={appointments} />
      </Suspense>
    </DashboardLayout>
  )
}
```

## 11. Error Handling & Logging

### 11.1 Error Boundaries

```typescript
// components/ErrorBoundary.tsx
'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error reporting service
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="error-container">
      <h2>Something went wrong!</h2>
      <details>
        <summary>Error details</summary>
        <pre>{error.message}</pre>
      </details>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### 11.2 Structured Logging

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: Record<string, any>) => {
    console.log(
      JSON.stringify({
        level: 'info',
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    );
  },

  error: (message: string, error?: Error, meta?: Record<string, any>) => {
    console.error(
      JSON.stringify({
        level: 'error',
        message,
        error: error?.message,
        stack: error?.stack,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    );
  },

  warn: (message: string, meta?: Record<string, any>) => {
    console.warn(
      JSON.stringify({
        level: 'warn',
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    );
  },
};

// Usage in Server Actions
export async function createOrder(data: OrderData) {
  logger.info('Creating order', { clientId: data.clientId });

  try {
    const order = await db.orders.create(data);
    logger.info('Order created successfully', { orderId: order.id });
    return { success: true, data: order };
  } catch (error) {
    logger.error('Failed to create order', error as Error, {
      clientId: data.clientId,
    });
    return { success: false, error: 'Failed to create order' };
  }
}
```

## 12. Security Best Practices

### 12.1 Input Validation

```typescript
// ✅ GOOD: Comprehensive input validation
import { z } from 'zod';

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const clientSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .trim(),

  email: z.string().email('Invalid email address').toLowerCase().trim(),

  phone: z.string().regex(phoneRegex, 'Invalid phone number').optional(),

  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),

  // Sanitize HTML content
  description: z.string().transform((val) =>
    sanitizeHtml(val, {
      allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br'],
      allowedAttributes: {},
    })
  ),
});
```

### 12.2 Authentication & Authorization

```typescript
// ✅ GOOD: Proper auth checks in Server Actions
export async function deleteClient(clientId: string): Promise<ActionResult> {
  // 1. Authenticate user
  const { userId } = await auth();
  if (!userId) {
    return { success: false, error: 'Unauthorized' };
  }

  // 2. Verify ownership
  const supabase = createServerClient();
  const { data: client } = await supabase
    .from('clients')
    .select('id, user_id')
    .eq('id', clientId)
    .single();

  if (!client || client.user_id !== userId) {
    return { success: false, error: 'Client not found' };
  }

  // 3. Check for dependencies
  const { count: ordersCount } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId);

  if (ordersCount > 0) {
    return {
      success: false,
      error: 'Cannot delete client with existing orders',
    };
  }

  // 4. Perform deletion
  const { error } = await supabase.from('clients').delete().eq('id', clientId);

  if (error) {
    logger.error('Failed to delete client', error);
    return { success: false, error: 'Failed to delete client' };
  }

  revalidatePath('/clients');
  return { success: true };
}
```

### 12.3 Data Sanitization

```typescript
// ✅ GOOD: Sanitize user-generated content
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeUserContent(content: string): string {
  return DOMPurify.sanitize(content, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false
  })
}

// Use in components
export function ClientNotes({ notes }: { notes: string }) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: sanitizeUserContent(notes)
      }}
    />
  )
}
```

## 13. Code Organization

### 13.1 Project Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── (app)/               # Authenticated app routes
│   ├── (auth)/              # Auth pages (sign-in/up)
│   ├── (marketing)/         # Public marketing pages
│   └── api/                 # API routes (if needed)
├── components/              # React components
│   ├── ui/                  # Base UI components
│   ├── features/            # Feature-specific components
│   ├── layout/              # Layout components
│   └── providers/           # Context providers
├── lib/                     # Core business logic
│   ├── actions/             # Server Actions
│   ├── db/                  # Database queries
│   ├── supabase/           # Supabase client setup
│   ├── validations/        # Zod schemas
│   └── utils/              # Utility functions
├── hooks/                   # Custom React hooks
├── types/                   # TypeScript type definitions
├── styles/                  # Global styles
└── config/                  # Configuration files
```

### 13.2 Import Organization

```typescript
// ✅ GOOD: Organized imports
// 1. React/Next.js imports
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// 2. External libraries
import { z } from 'zod';
import { format } from 'date-fns';
import { toast } from 'sonner';

// 3. UI components
import { Button, TextField, Card } from '@mui/material';

// 4. Internal components
import { PageHeader } from '@/components/layout/PageHeader';
import { ClientCard } from '@/components/features/clients/ClientCard';

// 5. Lib imports
import { createClient } from '@/lib/actions/clients';
import { clientSchema } from '@/lib/validations/client';

// 6. Types
import type { Client, ActionResult } from '@/types';

// 7. Styles
import styles from './ClientForm.module.css';
```

## 14. Git Workflow & Commits

### 14.1 Branch Naming

```bash
# Feature branches
feature/add-client-search
feature/invoice-pdf-export

# Bug fixes
fix/order-calculation-error
fix/mobile-nav-overflow

# Refactoring
refactor/client-form-validation
refactor/server-action-error-handling

# Testing
test/client-management-e2e
test/order-actions-unit
```

### 14.2 Commit Messages

```bash
# ✅ GOOD: Conventional commits
feat(clients): add search and filter functionality
fix(orders): correct total calculation for multiple services
test(auth): add integration tests for sign-up flow
docs(api): update server action documentation
refactor(ui): extract reusable form components
perf(images): optimize client avatar loading
chore(deps): update material-ui to v6.2.0

# Include BREAKING CHANGE for major changes
feat(api)!: change client ID format to UUID

BREAKING CHANGE: Client IDs are now UUIDs instead of incremental integers.
Migration script included in migrations/v2.0.0.sql
```

### 14.3 Pull Request Template

```markdown
## Description

Brief description of changes and why they were made.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass (if applicable)
- [ ] Manual testing completed
- [ ] Accessibility tested

## Mobile Testing

- [ ] Tested on mobile viewport (375px)
- [ ] Tested on tablet viewport (768px)
- [ ] Touch interactions work correctly
- [ ] No horizontal scroll issues

## Checklist

- [ ] My code follows the project coding standards
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] New and existing unit tests pass locally
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)

[Add screenshots for UI changes]
```

## 15. Documentation Standards

### 15.1 Code Documentation

````typescript
/**
 * Creates a new client in the database
 *
 * @param data - The client data to create
 * @returns Promise with success status and created client or error
 *
 * @example
 * ```typescript
 * const result = await createClient({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   phone: '+1234567890'
 * })
 *
 * if (result.success) {
 *   console.log('Client created:', result.data)
 * } else {
 *   console.error('Error:', result.error)
 * }
 * ```
 */
export async function createClient(
  data: ClientFormData
): Promise<ActionResult<Client>> {
  // Implementation
}
````

### 15.2 Component Documentation

````typescript
/**
 * ClientCard - Displays client information in a card format
 *
 * @component
 * @example
 * ```tsx
 * <ClientCard
 *   client={client}
 *   onEdit={(id) => router.push(`/clients/${id}/edit`)}
 *   onDelete={handleDelete}
 *   variant="compact"
 * />
 * ```
 */
interface ClientCardProps {
  /** The client data to display */
  client: Client;

  /** Callback when edit button is clicked */
  onEdit?: (id: string) => void;

  /** Callback when delete button is clicked */
  onDelete?: (id: string) => void;

  /** Visual variant of the card */
  variant?: 'default' | 'compact';
}
````

### 15.3 README Files

Each major feature should have a README:

````markdown
# Client Management Feature

## Overview

The client management feature allows users to create, read, update, and delete client records.

## Components

- `ClientsList` - Displays paginated list of clients
- `ClientCard` - Individual client display component
- `ClientForm` - Form for creating/editing clients
- `ClientSearch` - Search and filter functionality

## Server Actions

- `createClient` - Creates new client
- `updateClient` - Updates existing client
- `deleteClient` - Soft deletes client
- `getClients` - Retrieves paginated clients

## Testing

```bash
# Run unit tests
npm test clients

# Run E2E tests
npm run test:e2e -- client-management
```
````

## Permissions

- Users can only see their own clients
- Supabase RLS policies enforce data isolation

````

## Appendix: Quick Reference

### Essential Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler

# Testing
npm test            # Run all tests
npm run test:watch  # Watch mode
npm run test:coverage # Coverage report
npm run test:e2e    # E2E tests

# Code Quality
npm run format      # Format with Prettier
npm run lint:fix    # Fix ESLint issues
````

### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### Required VS Code Extensions

- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Jest Runner
- Playwright Test for VSCode

---

**Remember**: These standards are MANDATORY. Every piece of code must follow these guidelines. When in doubt, prioritize code quality, testing, and user experience.
