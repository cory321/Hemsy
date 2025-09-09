# Mobile-First Performance Optimization for Invoice Management

_Last updated: January 2025_

## Overview

This document outlines the comprehensive mobile-first performance optimization strategy for Hemsyoice Management feature, ensuring fast, responsive, and reliable payment experiences on mobile devices.

## Table of Contents

1. [Performance Architecture Overview](#performance-architecture-overview)
2. [Mobile-First Design Patterns](#mobile-first-design-patterns)
3. [Bundle Optimization](#bundle-optimization)
4. [Network Optimization](#network-optimization)
5. [Rendering Performance](#rendering-performance)
6. [Offline Capabilities](#offline-capabilities)
7. [Payment Form Optimization](#payment-form-optimization)
8. [Performance Monitoring](#performance-monitoring)

## Performance Architecture Overview

### Performance Budget

```typescript
// performance.config.ts
export const performanceBudget = {
  // Core Web Vitals targets
  LCP: 2000, // Largest Contentful Paint < 2s
  FID: 100, // First Input Delay < 100ms
  CLS: 0.1, // Cumulative Layout Shift < 0.1

  // Additional metrics
  TTI: 3500, // Time to Interactive < 3.5s
  FCP: 1200, // First Contentful Paint < 1.2s
  TBT: 200, // Total Blocking Time < 200ms

  // Resource budgets
  javascript: {
    initial: 150, // 150KB initial JS
    total: 300, // 300KB total JS
  },
  css: {
    initial: 50, // 50KB initial CSS
    total: 100, // 100KB total CSS
  },
  images: {
    perImage: 100, // 100KB per image
    total: 500, // 500KB total images
  },
};
```

### Mobile Performance Principles

1. **Progressive Enhancement**: Core functionality works without JavaScript
2. **Adaptive Loading**: Load resources based on device capabilities
3. **Touch-First**: Optimized for touch interactions
4. **Network-Aware**: Adapt to connection quality
5. **Battery-Conscious**: Minimize CPU/GPU usage

## Mobile-First Design Patterns

### Responsive Component Architecture

```typescript
// components/invoices/MobileOptimizedInvoiceList.tsx
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface MobileInvoiceListProps {
  initialInvoices: Invoice[];
  totalCount: number;
}

export const MobileOptimizedInvoiceList: React.FC<MobileInvoiceListProps> = ({
  initialInvoices,
  totalCount,
}) => {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [isLoading, setIsLoading] = useState(false);
  const networkStatus = useNetworkStatus();

  // Virtual scrolling for large lists
  const { ref: loadMoreRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px', // Preload before reaching bottom
  });

  // Adaptive batch size based on network
  const batchSize = useMemo(() => {
    switch (networkStatus.effectiveType) {
      case 'slow-2g':
      case '2g':
        return 5;
      case '3g':
        return 10;
      case '4g':
      default:
        return 20;
    }
  }, [networkStatus]);

  // Optimized render with minimal re-renders
  const renderInvoice = useCallback((invoice: Invoice) => (
    <MobileInvoiceCard
      key={invoice.id}
      invoice={invoice}
      // Use CSS containment for performance
      style={{ contain: 'layout style paint' }}
    />
  ), []);

  return (
    <div className="invoice-list-mobile">
      {/* Skeleton loading for perceived performance */}
      {isLoading && <InvoiceListSkeleton count={3} />}

      {/* Virtualized list */}
      <VirtualList
        items={invoices}
        renderItem={renderInvoice}
        itemHeight={120} // Fixed height for better performance
        overscan={2} // Render 2 items outside viewport
      />

      {/* Infinite scroll trigger */}
      {invoices.length < totalCount && (
        <div ref={loadMoreRef} className="load-more-trigger" />
      )}
    </div>
  );
};
```

### Touch-Optimized UI Components

```typescript
// components/ui/TouchOptimizedButton.tsx
import { forwardRef, useCallback } from 'react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface TouchButtonProps extends ButtonProps {
  hapticFeedback?: boolean;
}

export const TouchOptimizedButton = forwardRef<
  HTMLButtonElement,
  TouchButtonProps
>(({ onClick, hapticFeedback = true, children, ...props }, ref) => {
  const triggerHaptic = useHapticFeedback();

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    // Haptic feedback for better UX
    if (hapticFeedback && 'vibrate' in navigator) {
      triggerHaptic('light');
    }

    onClick?.(e);
  }, [onClick, hapticFeedback, triggerHaptic]);

  return (
    <button
      ref={ref}
      onClick={handleClick}
      className="touch-optimized-button"
      {...props}
      style={{
        // Minimum touch target size (48x48px)
        minHeight: '48px',
        minWidth: '48px',
        // Prevent double-tap zoom
        touchAction: 'manipulation',
        // Hardware acceleration
        transform: 'translateZ(0)',
        ...props.style,
      }}
    >
      {children}
    </button>
  );
});
```

### Responsive Grid System

```css
/* styles/responsive-grid.css */
.invoice-grid {
  display: grid;
  gap: 1rem;
  padding: 1rem;

  /* Mobile-first grid */
  grid-template-columns: 1fr;

  /* Tablet breakpoint */
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    padding: 1.5rem;
  }

  /* Desktop breakpoint */
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    padding: 2rem;
  }

  /* CSS containment for performance */
  contain: layout style;
}

/* Optimize for touch scrolling */
.scrollable-container {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;

  /* Momentum scrolling on iOS */
  scroll-behavior: smooth;

  /* GPU acceleration */
  will-change: scroll-position;
}
```

## Bundle Optimization

### Code Splitting Strategy

```typescript
// lib/invoices/dynamic-imports.ts
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load heavy components
export const InvoiceDetailView = dynamic(
  () => import('@/components/invoices/InvoiceDetailView'),
  {
    loading: () => <InvoiceDetailSkeleton />,
    ssr: true,
  }
);

// Lazy load Stripe only when needed
export const StripePaymentForm = dynamic(
  () => import('@/components/payments/StripePaymentForm'),
  {
    loading: () => <PaymentFormSkeleton />,
    ssr: false, // Client-only for Stripe Elements
  }
);

// Route-based code splitting
export const PaymentSuccessPage = dynamic(
  () => import('@/app/payments/success/page'),
  {
    loading: () => <SuccessPageSkeleton />,
  }
);

// Progressive enhancement for reports
export const InvoiceReports = dynamic(
  () => import('@/components/reports/InvoiceReports'),
  {
    loading: () => <ReportsSkeleton />,
    // Load only when viewport is desktop-sized
    ssr: false,
  }
);
```

### Tree Shaking and Dead Code Elimination

```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },

  webpack: (config, { isServer }) => {
    // Optimize Material UI imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@mui/material': '@mui/material/modern',
      '@mui/icons-material': '@mui/icons-material/esm',
    };

    // Remove unused locales
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      })
    );

    // Analyze bundle in development
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      );
    }

    return config;
  },
};
```

### Service Worker for Asset Caching

```typescript
// public/sw.js
const CACHE_NAME = 'hemsy-v1';
const STATIC_ASSETS = [
  '/fonts/roboto-latin-400.woff2',
  '/fonts/roboto-latin-500.woff2',
  '/icons/invoice-icon.svg',
  '/offline.html',
];

// Install and cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Network-first strategy for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls - network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache on network failure
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - cache first
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        return (
          cachedResponse ||
          fetch(request).then((response) => {
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response.clone());
              return response;
            });
          })
        );
      })
    );
  }
});
```

## Network Optimization

### Adaptive Data Fetching

```typescript
// hooks/useAdaptiveDataFetching.ts
import { useNetworkStatus } from './useNetworkStatus';
import { useDeviceMemory } from './useDeviceMemory';

export function useAdaptiveDataFetching() {
  const network = useNetworkStatus();
  const memory = useDeviceMemory();

  const getOptimalFetchStrategy = useCallback(() => {
    // Low-end device or slow network
    if (memory < 4 || network.effectiveType === '2g') {
      return {
        pageSize: 5,
        prefetch: false,
        highResImages: false,
        animations: false,
      };
    }

    // Mid-range device or 3G
    if (memory < 8 || network.effectiveType === '3g') {
      return {
        pageSize: 10,
        prefetch: true,
        highResImages: false,
        animations: true,
      };
    }

    // High-end device and fast network
    return {
      pageSize: 20,
      prefetch: true,
      highResImages: true,
      animations: true,
    };
  }, [network, memory]);

  return getOptimalFetchStrategy();
}

// Usage in invoice list
export function useInvoiceList() {
  const strategy = useAdaptiveDataFetching();

  return useQuery({
    queryKey: ['invoices', strategy.pageSize],
    queryFn: () => fetchInvoices({ limit: strategy.pageSize }),
    staleTime: strategy.prefetch ? 5 * 60 * 1000 : 60 * 1000,
    cacheTime: strategy.prefetch ? 10 * 60 * 1000 : 5 * 60 * 1000,
  });
}
```

### Request Batching and Deduplication

```typescript
// lib/api/request-batcher.ts
export class RequestBatcher {
  private queue = new Map<string, Promise<any>>();
  private batchTimeout: NodeJS.Timeout | null = null;

  async batch<T>(
    key: string,
    fetcher: () => Promise<T>,
    delay: number = 50
  ): Promise<T> {
    // Check if request already in flight
    if (this.queue.has(key)) {
      return this.queue.get(key)!;
    }

    // Create promise for this request
    const promise = new Promise<T>((resolve, reject) => {
      // Clear existing timeout
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
      }

      // Set new timeout for batch execution
      this.batchTimeout = setTimeout(async () => {
        try {
          const result = await fetcher();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.queue.delete(key);
        }
      }, delay);
    });

    this.queue.set(key, promise);
    return promise;
  }
}

// Usage for invoice operations
const batcher = new RequestBatcher();

export async function updateInvoiceStatus(invoiceId: string, status: string) {
  return batcher.batch(`update-invoice-${invoiceId}`, () =>
    serverUpdateInvoiceStatus({ invoiceId, status })
  );
}
```

### Optimistic Updates

```typescript
// hooks/useOptimisticInvoiceUpdate.ts
export function useOptimisticInvoiceUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateInvoiceStatus,

    onMutate: async ({ invoiceId, status }) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries(['invoice', invoiceId]);

      // Snapshot previous value
      const previousInvoice = queryClient.getQueryData<Invoice>([
        'invoice',
        invoiceId,
      ]);

      // Optimistically update
      queryClient.setQueryData(['invoice', invoiceId], (old: Invoice) => ({
        ...old,
        status,
        updatedAt: new Date().toISOString(),
      }));

      return { previousInvoice };
    },

    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousInvoice) {
        queryClient.setQueryData(
          ['invoice', variables.invoiceId],
          context.previousInvoice
        );
      }

      // Show error toast
      toast.error('Failed to update invoice. Please try again.');
    },

    onSettled: (data, error, variables) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries(['invoice', variables.invoiceId]);
    },
  });
}
```

## Rendering Performance

### Virtual Scrolling Implementation

```typescript
// components/ui/VirtualList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useCallback } from 'react';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number | ((index: number) => number);
  overscan?: number;
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  overscan = 5,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(
      (index: number) =>
        typeof itemHeight === 'function' ? itemHeight(index) : itemHeight,
      [itemHeight]
    ),
    overscan,
  });

  return (
    <div
      ref={parentRef}
      className="virtual-list-container"
      style={{
        height: '100%',
        overflow: 'auto',
        contain: 'strict',
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderItem(items[virtualItem.index], virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### React Concurrent Features

```typescript
// components/invoices/InvoiceListWithSuspense.tsx
import { Suspense, useDeferredValue, useTransition } from 'react';

export function InvoiceListWithSuspense() {
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const handleSearch = (value: string) => {
    // Non-blocking update
    startTransition(() => {
      setSearchTerm(value);
    });
  };

  return (
    <div className="invoice-list-container">
      <SearchInput
        onChange={handleSearch}
        isPending={isPending}
      />

      <Suspense fallback={<InvoiceListSkeleton />}>
        <InvoiceList searchTerm={deferredSearchTerm} />
      </Suspense>
    </div>
  );
}

// Skeleton component for loading state
export function InvoiceListSkeleton() {
  return (
    <div className="skeleton-container">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton-item">
          <div className="skeleton-line skeleton-title" />
          <div className="skeleton-line skeleton-subtitle" />
          <div className="skeleton-line skeleton-amount" />
        </div>
      ))}
    </div>
  );
}
```

### CSS Performance Optimization

```css
/* styles/performance.css */

/* Use CSS containment */
.invoice-card {
  contain: layout style paint;
  content-visibility: auto;
  contain-intrinsic-size: 0 120px;
}

/* Hardware acceleration for animations */
.slide-in {
  transform: translateX(-100%);
  will-change: transform;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-in.active {
  transform: translateX(0);
}

/* Reduce paint areas */
.status-badge {
  position: relative;
  z-index: 1;
  isolation: isolate;
}

/* Optimize touch interactions */
.touchable {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;
}

/* Progressive enhancement for animations */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High-performance scrolling */
.scroll-container {
  overflow-y: auto;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;

  /* Scroll anchoring */
  overflow-anchor: auto;

  /* Scroll snapping for cards */
  scroll-snap-type: y proximity;
}

.scroll-item {
  scroll-snap-align: start;
  scroll-margin-top: 1rem;
}
```

## Offline Capabilities

### Offline-First Data Architecture

```typescript
// lib/offline/invoice-sync.ts
import { openDB, DBSchema } from 'idb';

interface InvoiceDB extends DBSchema {
  invoices: {
    key: string;
    value: Invoice & {
      syncStatus: 'synced' | 'pending' | 'conflict';
      localTimestamp: number;
    };
    indexes: {
      'by-status': string;
      'by-sync': string;
    };
  };
  pendingActions: {
    key: string;
    value: {
      id: string;
      action: 'create' | 'update' | 'delete';
      payload: any;
      timestamp: number;
      retryCount: number;
    };
  };
}

export class OfflineInvoiceManager {
  private db: Promise<IDBDatabase>;

  constructor() {
    this.db = openDB<InvoiceDB>('hemsy-invoices', 1, {
      upgrade(db) {
        // Invoice store
        const invoiceStore = db.createObjectStore('invoices', {
          keyPath: 'id',
        });
        invoiceStore.createIndex('by-status', 'status');
        invoiceStore.createIndex('by-sync', 'syncStatus');

        // Pending actions store
        db.createObjectStore('pendingActions', {
          keyPath: 'id',
        });
      },
    });
  }

  async saveInvoice(invoice: Invoice, isLocal = false) {
    const db = await this.db;

    await db.put('invoices', {
      ...invoice,
      syncStatus: isLocal ? 'pending' : 'synced',
      localTimestamp: Date.now(),
    });
  }

  async syncPendingChanges() {
    const db = await this.db;
    const pendingActions = await db.getAll('pendingActions');

    for (const action of pendingActions) {
      try {
        await this.executeAction(action);
        await db.delete('pendingActions', action.id);
      } catch (error) {
        // Increment retry count
        action.retryCount++;

        if (action.retryCount > 3) {
          // Mark as failed after 3 retries
          console.error('Action failed permanently:', action);
          await db.delete('pendingActions', action.id);
        } else {
          await db.put('pendingActions', action);
        }
      }
    }
  }

  private async executeAction(action: any) {
    switch (action.action) {
      case 'create':
        return await createInvoice(action.payload);
      case 'update':
        return await updateInvoice(action.payload);
      case 'delete':
        return await deleteInvoice(action.payload.id);
    }
  }
}

// Sync manager hook
export function useOfflineSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<Error | null>(null);
  const manager = useRef(new OfflineInvoiceManager());

  useEffect(() => {
    const sync = async () => {
      if (!navigator.onLine) return;

      setIsSyncing(true);
      setSyncError(null);

      try {
        await manager.current.syncPendingChanges();
      } catch (error) {
        setSyncError(error as Error);
      } finally {
        setIsSyncing(false);
      }
    };

    // Sync on online event
    window.addEventListener('online', sync);

    // Periodic sync every 30 seconds
    const interval = setInterval(sync, 30000);

    // Initial sync
    sync();

    return () => {
      window.removeEventListener('online', sync);
      clearInterval(interval);
    };
  }, []);

  return { isSyncing, syncError };
}
```

### Offline UI Indicators

```typescript
// components/ui/OfflineIndicator.tsx
export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show "Back online" message briefly
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`offline-banner ${isOnline ? 'online' : 'offline'}`}
      role="status"
      aria-live="polite"
    >
      {isOnline ? (
        <>
          <CheckCircleIcon /> Back online
        </>
      ) : (
        <>
          <WifiOffIcon /> You're offline - changes will sync when connected
        </>
      )}
    </div>
  );
}
```

## Payment Form Optimization

### Mobile-Optimized Payment Experience

```typescript
// components/payments/MobilePaymentForm.tsx
export function MobilePaymentForm({ invoice }: { invoice: Invoice }) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const { isLandscape } = useOrientation();

  // Auto-focus management for mobile
  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);

    // Scroll to payment form on mobile
    if (window.innerWidth < 768) {
      setTimeout(() => {
        document.getElementById('payment-form')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);
    }
  };

  return (
    <form
      id="payment-form"
      className={`payment-form ${isLandscape ? 'landscape' : 'portrait'}`}
    >
      {/* Large touch targets for payment method selection */}
      <RadioGroup
        value={paymentMethod}
        onChange={handlePaymentMethodChange}
        className="payment-method-selector"
      >
        <FormControlLabel
          value="stripe"
          control={<Radio />}
          label={
            <div className="payment-method-label">
              <CreditCardIcon />
              <span>Credit/Debit Card</span>
            </div>
          }
          className="payment-method-option"
        />
        <FormControlLabel
          value="cash"
          control={<Radio />}
          label={
            <div className="payment-method-label">
              <MoneyIcon />
              <span>Cash</span>
            </div>
          }
          className="payment-method-option"
        />
      </RadioGroup>

      {/* Conditional payment forms */}
      {paymentMethod === 'stripe' && (
        <StripePaymentFields
          // Mobile-optimized props
          options={{
            style: {
              base: {
                fontSize: '16px', // Prevent zoom on iOS
                lineHeight: '24px',
                padding: '12px',
              },
            },
            hidePostalCode: false,
            // Enable Apple Pay / Google Pay
            wallets: {
              applePay: 'auto',
              googlePay: 'auto',
            },
          }}
        />
      )}

      {/* Sticky payment button for mobile */}
      <div className="payment-button-container">
        <Button
          type="submit"
          fullWidth
          size="large"
          variant="contained"
          className="payment-button"
        >
          Pay {formatCurrency(invoice.amount_cents)}
        </Button>
      </div>
    </form>
  );
}
```

### Autofill Optimization

```html
<!-- Payment form with proper autocomplete attributes -->
<form class="payment-form" autocomplete="on">
  <!-- Email -->
  <input
    type="email"
    name="email"
    autocomplete="email"
    inputmode="email"
    placeholder="Email"
  />

  <!-- Cardholder name -->
  <input
    type="text"
    name="name"
    autocomplete="cc-name"
    placeholder="Name on card"
  />

  <!-- Card number (handled by Stripe) -->
  <div id="card-number" data-autocomplete="cc-number"></div>

  <!-- Expiry (handled by Stripe) -->
  <div id="card-expiry" data-autocomplete="cc-exp"></div>

  <!-- CVC (handled by Stripe) -->
  <div id="card-cvc" data-autocomplete="cc-csc"></div>

  <!-- Billing postal code -->
  <input
    type="text"
    name="postal"
    autocomplete="postal-code"
    inputmode="numeric"
    pattern="[0-9]*"
    placeholder="ZIP"
  />
</form>
```

## Performance Monitoring

### Real User Monitoring (RUM)

```typescript
// lib/monitoring/performance-monitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Observe Core Web Vitals
    if ('PerformanceObserver' in window) {
      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.set('LCP', lastEntry.startTime);
        this.reportMetric('LCP', lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-input') {
            const fid = entry.processingStart - entry.startTime;
            this.metrics.set('FID', fid);
            this.reportMetric('FID', fid);
          }
        });
      }).observe({ entryTypes: ['first-input'] });

      // CLS
      let clsValue = 0;
      let clsEntries: PerformanceEntry[] = [];

      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsEntries.push(entry);
            clsValue += entry.value;
            this.metrics.set('CLS', clsValue);
          }
        });
      }).observe({ entryTypes: ['layout-shift'] });
    }
  }

  reportMetric(name: string, value: number) {
    // Send to analytics
    if (window.gtag) {
      window.gtag('event', name, {
        value: Math.round(value),
        metric_id: `${name}_${Date.now()}`,
        page_path: window.location.pathname,
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value.toFixed(2)}ms`);
    }
  }

  // Custom timing API
  startTiming(label: string) {
    performance.mark(`${label}-start`);
  }

  endTiming(label: string) {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);

    const measure = performance.getEntriesByName(label)[0];
    if (measure) {
      this.reportMetric(label, measure.duration);
    }
  }
}

// Usage
const perfMonitor = new PerformanceMonitor();

// Track custom metrics
export function trackPaymentPerformance() {
  perfMonitor.startTiming('payment-form-load');

  // After form loads
  perfMonitor.endTiming('payment-form-load');

  // Track payment processing time
  perfMonitor.startTiming('payment-processing');

  // After payment completes
  perfMonitor.endTiming('payment-processing');
}
```

### Performance Budget Monitoring

```typescript
// scripts/performance-budget.ts
import { chromium } from 'playwright';

async function checkPerformanceBudget(url: string) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
  });

  const page = await context.newPage();

  // Enable performance metrics
  await page.coverage.startJSCoverage();
  await page.coverage.startCSSCoverage();

  // Navigate and measure
  const navigationStart = Date.now();
  await page.goto(url, { waitUntil: 'networkidle' });
  const navigationEnd = Date.now();

  // Get metrics
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as any;
    const paint = performance.getEntriesByType('paint');

    return {
      FCP: paint.find((p) => p.name === 'first-contentful-paint')?.startTime,
      LCP: navigation.loadEventEnd - navigation.fetchStart,
      TTI: navigation.domInteractive - navigation.fetchStart,
      totalJS: performance
        .getEntriesByType('resource')
        .filter((r) => r.name.endsWith('.js'))
        .reduce((sum, r) => sum + r.transferSize, 0),
      totalCSS: performance
        .getEntriesByType('resource')
        .filter((r) => r.name.endsWith('.css'))
        .reduce((sum, r) => sum + r.transferSize, 0),
    };
  });

  // Check against budget
  const budget = {
    FCP: 1200,
    LCP: 2000,
    TTI: 3500,
    totalJS: 300 * 1024,
    totalCSS: 100 * 1024,
  };

  const violations = [];

  for (const [metric, value] of Object.entries(metrics)) {
    if (value > budget[metric]) {
      violations.push({
        metric,
        actual: value,
        budget: budget[metric],
        exceeded: ((value / budget[metric] - 1) * 100).toFixed(1),
      });
    }
  }

  await browser.close();

  return { metrics, violations };
}

// Run budget check in CI
if (require.main === module) {
  checkPerformanceBudget(process.env.TEST_URL || 'http://localhost:3000').then(
    ({ violations }) => {
      if (violations.length > 0) {
        console.error('Performance budget violations:', violations);
        process.exit(1);
      } else {
        console.log('All performance metrics within budget!');
      }
    }
  );
}
```

## Conclusion

This mobile-first performance optimization strategy ensures:

- **Fast Load Times**: < 2s LCP on 3G networks
- **Responsive Interactions**: < 100ms input delay
- **Smooth Scrolling**: 60fps with virtual scrolling
- **Offline Resilience**: Full functionality without network
- **Optimized Payments**: Touch-friendly, fast payment forms
- **Battery Efficiency**: Minimal CPU/GPU usage

The architecture prioritizes the mobile experience while progressively enhancing for more capable devices, ensuring all seamstresses can efficiently manage invoices and collect payments regardless of their device or network conditions.
