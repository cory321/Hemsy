'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, useEffect, useRef } from 'react';

// Configure query client with optimized defaults for calendar use case
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: how long until a query is considered stale
        staleTime: 5 * 60 * 1000, // 5 minutes

        // GC time: how long to keep unused data in cache
        gcTime: 30 * 60 * 1000, // 30 minutes

        // Retry configuration
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry up to 3 times with exponential backoff
          return failureCount < 3;
        },

        // Refetch configuration
        refetchOnWindowFocus: false, // Disable for calendar to prevent unnecessary refetches
        refetchOnReconnect: 'always',

        // Network mode
        networkMode: 'offlineFirst', // Use cache first, then network
      },

      mutations: {
        // Retry failed mutations once
        retry: 1,

        // Network mode for mutations
        networkMode: 'always', // Always require network for mutations
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

// Setup garbage collection for old queries with proper cleanup
function setupQueryGarbageCollection(
  queryClient: QueryClient
): (() => void) | undefined {
  if (typeof window === 'undefined') return;

  const GARBAGE_COLLECTION_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const MAX_AGE = 60 * 60 * 1000; // 1 hour

  const intervalId = setInterval(() => {
    const queries = queryClient.getQueryCache().getAll();
    const now = Date.now();

    queries.forEach((query) => {
      const queryKey = query.queryKey;

      // Garbage collect old queries of all types, not just appointments
      // This prevents memory leaks from accumulating queries
      if (
        query.state.dataUpdatedAt < now - MAX_AGE &&
        query.getObserversCount() === 0 // No active observers
      ) {
        queryClient.removeQueries({ queryKey: query.queryKey, exact: true });
      }
    });

    // Also clean up mutation cache
    const mutations = queryClient.getMutationCache().getAll();
    mutations.forEach((mutation) => {
      if (
        mutation.state.status === 'success' ||
        mutation.state.status === 'error'
      ) {
        // Remove completed mutations older than 5 minutes
        const mutationAge = now - (mutation.state.submittedAt || 0);
        if (mutationAge > GARBAGE_COLLECTION_INTERVAL) {
          queryClient.getMutationCache().remove(mutation);
        }
      }
    });
  }, GARBAGE_COLLECTION_INTERVAL);

  // Return cleanup function
  return () => clearInterval(intervalId);
}

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  // NOTE: Avoid useState for query client if you don't expect to change it
  const [queryClient] = useState(() => getQueryClient());
  const cleanupRef = useRef<(() => void) | undefined>(undefined);

  // Setup garbage collection with proper cleanup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      cleanupRef.current = setupQueryGarbageCollection(queryClient);
    }

    return () => {
      // Clean up the garbage collection interval on unmount
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}
