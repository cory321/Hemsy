import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  getClientAppointments,
  getClientAppointmentsPage,
} from '@/lib/actions/appointments-refactored';
import type { Appointment, AppointmentStatus } from '@/types';

export const clientAppointmentKeys = {
  all: (clientId: string) => ['appointments', 'client', clientId] as const,
  list: (
    clientId: string,
    filters?: { includeCompleted?: boolean; statuses?: AppointmentStatus[] }
  ) => [...clientAppointmentKeys.all(clientId), 'list', filters] as const,
};

export function useClientAppointments(
  shopId: string,
  clientId: string,
  options?: { includeCompleted?: boolean; statuses?: AppointmentStatus[] }
) {
  return useQuery({
    queryKey: clientAppointmentKeys.list(clientId, options),
    // The current server action signature is (shopId, clientId, includeCompleted)
    // We pass includeCompleted; server-side status filtering can be added later.
    queryFn: async () => {
      const includeCompleted = !!options?.includeCompleted;
      const raw = await getClientAppointments(
        shopId,
        clientId,
        includeCompleted
      );
      // Adapt to the spec shape when we enhance server action: return { appointments, total, hasMore }
      return {
        appointments: raw as Appointment[],
        total: (raw as Appointment[])?.length ?? 0,
        hasMore: false,
      };
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useInfiniteClientAppointments(
  shopId: string,
  clientId: string,
  options?: {
    includeCompleted?: boolean;
    statuses?: AppointmentStatus[];
    timeframe?: 'upcoming' | 'past' | 'all';
    pageSize?: number;
  }
) {
  const pageSize = options?.pageSize ?? 10;
  return useInfiniteQuery({
    queryKey: [
      ...clientAppointmentKeys.list(clientId, {
        includeCompleted: options?.includeCompleted,
        statuses: options?.statuses,
      }),
      'infinite',
      options?.timeframe ?? 'all',
      pageSize,
    ],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const page = await getClientAppointmentsPage(shopId, clientId, {
        includeCompleted: options?.includeCompleted,
        statuses: options?.statuses,
        timeframe: options?.timeframe,
        limit: pageSize,
        offset: Number(pageParam) || 0,
      });
      return page;
    },
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextOffset : undefined,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
