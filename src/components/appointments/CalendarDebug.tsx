'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { appointmentKeys } from '@/lib/queries/appointment-keys';

export function CalendarDebug({ shopId }: { shopId: string }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Log all appointment queries in the cache
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    console.group('🔍 Calendar Debug Info');

    // Check React Query setup
    console.log('React Query Client exists:', !!queryClient);
    console.log('Total queries in cache:', queries.length);

    // Log appointment-related queries
    const appointmentQueries = queries.filter(
      (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'appointments'
    );

    console.log('Appointment queries:', appointmentQueries.length);

    appointmentQueries.forEach((query, index) => {
      console.group(`Query ${index + 1}`);
      console.log('Key:', query.queryKey);
      console.log('State:', query.state.status);
      console.log('Data exists:', !!query.state.data);
      console.log('Error:', query.state.error);
      console.log(
        'Last updated:',
        new Date(query.state.dataUpdatedAt).toLocaleString()
      );
      console.groupEnd();
    });

    // Check if shop ID is being passed correctly
    console.log('Shop ID:', shopId);

    // Monitor query cache updates
    const unsubscribe = cache.subscribe((event) => {
      if (
        event.type === 'observerResultsUpdated' &&
        Array.isArray(event.query.queryKey) &&
        event.query.queryKey[0] === 'appointments'
      ) {
        console.log('📡 Query update:', {
          key: event.query.queryKey,
          status: event.query.state.status,
          error: event.query.state.error,
        });
      }
    });

    console.groupEnd();

    return () => unsubscribe();
  }, [queryClient, shopId]);

  return null;
}
