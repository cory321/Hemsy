'use client';

import {
  useQuery,
  useQueryClient,
  useMutation,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from 'date-fns';
import {
  appointmentKeys,
  type TimeRangeParams,
  type CalendarView,
} from './appointment-keys';
import {
  getAppointmentsByTimeRange,
  getAppointmentCounts,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  type CreateAppointmentData,
  type UpdateAppointmentData,
} from '@/lib/actions/appointments';
import type { Appointment } from '@/types';

// Configuration for different view types
const VIEW_CONFIG = {
  month: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
  week: {
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  },
  day: {
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  list: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
};

/**
 * Calculate date range for a given view and date
 */
export function calculateDateRange(date: Date, view: CalendarView) {
  switch (view) {
    case 'month':
      return {
        startDate: format(startOfMonth(date), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(date), 'yyyy-MM-dd'),
      };
    case 'week':
      return {
        startDate: format(startOfWeek(date, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
        endDate: format(endOfWeek(date, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
      };
    case 'day':
      return {
        startDate: format(date, 'yyyy-MM-dd'),
        endDate: format(date, 'yyyy-MM-dd'),
      };
    case 'list':
      // List view shows 3 months
      return {
        startDate: format(date, 'yyyy-MM-dd'),
        endDate: format(addMonths(date, 3), 'yyyy-MM-dd'),
      };
  }
}

/**
 * Calculate adjacent windows for prefetching
 */
export function calculateAdjacentWindows(date: Date, view: CalendarView) {
  switch (view) {
    case 'month': {
      const prev = subMonths(date, 1);
      const next = addMonths(date, 1);
      return {
        prev: calculateDateRange(prev, view),
        next: calculateDateRange(next, view),
      };
    }
    case 'week': {
      const prev = subWeeks(date, 1);
      const next = addWeeks(date, 1);
      return {
        prev: calculateDateRange(prev, view),
        next: calculateDateRange(next, view),
      };
    }
    case 'day': {
      const prev = subDays(date, 1);
      const next = addDays(date, 1);
      return {
        prev: calculateDateRange(prev, view),
        next: calculateDateRange(next, view),
      };
    }
    default:
      return { prev: null, next: null };
  }
}

/**
 * Hook to fetch appointments for a time range
 */
export function useAppointmentsTimeRange(
  shopId: string,
  startDate: string,
  endDate: string,
  view: CalendarView = 'month',
  options?: Omit<UseQueryOptions<Appointment[]>, 'queryKey' | 'queryFn'>
) {
  const config = VIEW_CONFIG[view];

  console.log('🔄 useAppointmentsTimeRange called:', {
    shopId,
    startDate,
    endDate,
    view,
  });

  return useQuery<Appointment[]>({
    queryKey: appointmentKeys.timeRange({ shopId, startDate, endDate }),
    queryFn: () => getAppointmentsByTimeRange(shopId, startDate, endDate),
    staleTime: config.staleTime,
    gcTime: config.gcTime,
    ...options,
  });
}

/**
 * Hook to prefetch adjacent windows in the background
 */
export function usePrefetchAdjacentWindows(
  shopId: string,
  currentDate: Date,
  view: CalendarView
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Don't prefetch for list view
    if (view === 'list') return;

    const prefetchTimer = setTimeout(() => {
      const { prev, next } = calculateAdjacentWindows(currentDate, view);
      const config = VIEW_CONFIG[view];

      // Prefetch previous window
      if (prev) {
        queryClient.prefetchQuery({
          queryKey: appointmentKeys.timeRange({
            shopId,
            startDate: prev.startDate,
            endDate: prev.endDate,
          }),
          queryFn: () =>
            getAppointmentsByTimeRange(shopId, prev.startDate, prev.endDate),
          staleTime: config.staleTime,
          gcTime: config.gcTime,
        });
      }

      // Prefetch next window
      if (next) {
        queryClient.prefetchQuery({
          queryKey: appointmentKeys.timeRange({
            shopId,
            startDate: next.startDate,
            endDate: next.endDate,
          }),
          queryFn: () =>
            getAppointmentsByTimeRange(shopId, next.startDate, next.endDate),
          staleTime: config.staleTime,
          gcTime: config.gcTime,
        });
      }
    }, 100); // Small delay to prioritize current view

    return () => clearTimeout(prefetchTimer);
  }, [shopId, currentDate, view, queryClient]);
}

/**
 * Hook to get appointment counts for month view
 */
export function useAppointmentCounts(
  shopId: string,
  year: number,
  month: number,
  options?: Omit<
    UseQueryOptions<Record<string, number>>,
    'queryKey' | 'queryFn'
  >
) {
  const startDate = format(new Date(year, month - 1, 1), 'yyyy-MM-dd');
  const endDate = format(new Date(year, month, 0), 'yyyy-MM-dd');

  return useQuery({
    queryKey: appointmentKeys.monthCounts({ shopId, year, month }),
    queryFn: () => getAppointmentCounts(shopId, startDate, endDate),
    staleTime: VIEW_CONFIG.month.staleTime,
    gcTime: VIEW_CONFIG.month.gcTime,
    ...options,
  });
}

/**
 * Hook to create an appointment with optimistic updates
 */
export function useCreateAppointment(
  options?: UseMutationOptions<Appointment, Error, CreateAppointmentData>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAppointment,

    onMutate: async (newAppointment) => {
      // Calculate which queries to update
      const { startDate, endDate } = calculateDateRange(
        new Date(newAppointment.date),
        'month'
      );

      const queryKey = appointmentKeys.timeRange({
        shopId: newAppointment.shopId,
        startDate,
        endDate,
      });

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousAppointments =
        queryClient.getQueryData<Appointment[]>(queryKey);

      // Optimistically update
      if (previousAppointments) {
        const optimisticAppointment: Appointment = {
          id: `temp-${Date.now()}`,
          shop_id: newAppointment.shopId,
          client_id: newAppointment.clientId || '',
          date: newAppointment.date,
          start_time: newAppointment.startTime,
          end_time: newAppointment.endTime,
          type: newAppointment.type,
          status: 'confirmed',
          ...(newAppointment.notes && { notes: newAppointment.notes }),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(newAppointment.clientId && {
            client: {
              id: newAppointment.clientId,
              shop_id: newAppointment.shopId,
              first_name: '',
              last_name: '',
              email: '',
              phone_number: '',
              accept_email: false,
              accept_sms: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          }),
        };

        queryClient.setQueryData<Appointment[]>(queryKey, (old = []) => {
          return [...old, optimisticAppointment].sort((a, b) => {
            const dateCompare = a.date.localeCompare(b.date);
            if (dateCompare !== 0) return dateCompare;
            return a.start_time.localeCompare(b.start_time);
          });
        });
      }

      return { previousAppointments, queryKey };
    },

    onError: (err, newAppointment, context: any) => {
      // Revert optimistic update on error
      if (context?.previousAppointments) {
        queryClient.setQueryData(
          context.queryKey,
          context.previousAppointments
        );
      }
    },

    onSettled: async (data, error, variables) => {
      // Invalidate and refetch
      const { startDate, endDate } = calculateDateRange(
        new Date(variables.date),
        'month'
      );

      await queryClient.invalidateQueries({
        queryKey: appointmentKeys.timeRange({
          shopId: variables.shopId,
          startDate,
          endDate,
        }),
      });

      // Also invalidate counts
      const date = new Date(variables.date);
      await queryClient.invalidateQueries({
        queryKey: appointmentKeys.monthCounts({
          shopId: variables.shopId,
          year: date.getFullYear(),
          month: date.getMonth() + 1,
        }),
      });
    },

    ...options,
  });
}

/**
 * Hook to update an appointment
 */
export function useUpdateAppointment(
  options?: UseMutationOptions<Appointment, Error, UpdateAppointmentData>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAppointment,

    onSuccess: async (data, variables) => {
      // Invalidate affected date ranges
      const dates = [variables.date];
      if (variables.originalDate && variables.originalDate !== variables.date) {
        dates.push(variables.originalDate);
      }

      for (const dateStr of dates) {
        if (!dateStr) continue;
        const { startDate, endDate } = calculateDateRange(
          new Date(dateStr),
          'month'
        );

        await queryClient.invalidateQueries({
          queryKey: appointmentKeys.timeRange({
            shopId: data.shop_id,
            startDate,
            endDate,
          }),
        });

        const d = new Date(dateStr);
        await queryClient.invalidateQueries({
          queryKey: appointmentKeys.monthCounts({
            shopId: data.shop_id,
            year: d.getFullYear(),
            month: d.getMonth() + 1,
          }),
        });
      }

      // Invalidate detail query
      await queryClient.invalidateQueries({
        queryKey: appointmentKeys.detail(variables.id),
      });
    },

    ...options,
  });
}

/**
 * Hook to delete an appointment
 */
export function useDeleteAppointment(
  options?: UseMutationOptions<
    void,
    Error,
    { id: string; shopId: string; date: string }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) => deleteAppointment(id),

    onSuccess: async (_, variables) => {
      // Invalidate affected queries
      const { startDate, endDate } = calculateDateRange(
        new Date(variables.date),
        'month'
      );

      await queryClient.invalidateQueries({
        queryKey: appointmentKeys.timeRange({
          shopId: variables.shopId,
          startDate,
          endDate,
        }),
      });

      const date = new Date(variables.date);
      await queryClient.invalidateQueries({
        queryKey: appointmentKeys.monthCounts({
          shopId: variables.shopId,
          year: date.getFullYear(),
          month: date.getMonth() + 1,
        }),
      });

      // Remove from cache
      queryClient.removeQueries({
        queryKey: appointmentKeys.detail(variables.id),
      });
    },

    ...options,
  });
}

/**
 * Hook to get appointments for a specific month
 */
export function useAppointmentsForMonth(
  shopId: string,
  year: number,
  month: number,
  options?: Omit<UseQueryOptions<Appointment[]>, 'queryKey' | 'queryFn'>
) {
  const date = new Date(year, month - 1, 1);
  const { startDate, endDate } = calculateDateRange(date, 'month');

  return useAppointmentsTimeRange(shopId, startDate, endDate, 'month', options);
}

/**
 * Hook to get appointments for a specific week
 */
export function useAppointmentsForWeek(
  shopId: string,
  date: Date,
  options?: Omit<UseQueryOptions<Appointment[]>, 'queryKey' | 'queryFn'>
) {
  const { startDate, endDate } = calculateDateRange(date, 'week');

  return useAppointmentsTimeRange(shopId, startDate, endDate, 'week', options);
}

/**
 * Hook to get appointments for a specific day
 */
export function useAppointmentsForDay(
  shopId: string,
  date: Date,
  options?: Omit<UseQueryOptions<Appointment[]>, 'queryKey' | 'queryFn'>
) {
  const { startDate, endDate } = calculateDateRange(date, 'day');

  return useAppointmentsTimeRange(shopId, startDate, endDate, 'day', options);
}
