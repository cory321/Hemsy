/**
 * Query key factory for appointments
 * Follows @tanstack/query-key-factory pattern for type-safe query keys
 */

export type CalendarView = 'month' | 'week' | 'day' | 'list';

export interface AppointmentFilters {
  shopId: string;
  startDate: string;
  endDate: string;
  status?: string[];
  clientId?: string;
  type?: string;
}

export interface TimeRangeParams {
  shopId: string;
  startDate: string;
  endDate: string;
}

export interface ViewParams {
  shopId: string;
  year: number;
  month?: number;
  week?: number;
  date?: string;
}

export const appointmentKeys = {
  all: ['appointments'] as const,

  // List queries with filters
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (filters: AppointmentFilters) =>
    [...appointmentKeys.lists(), filters] as const,

  // Time-range specific keys (primary pattern)
  timeRanges: () => [...appointmentKeys.all, 'timeRange'] as const,
  timeRange: ({ shopId, startDate, endDate }: TimeRangeParams) =>
    [...appointmentKeys.timeRanges(), shopId, startDate, endDate] as const,

  // View-specific convenience keys
  views: () => [...appointmentKeys.all, 'view'] as const,

  monthView: ({ shopId, year, month }: ViewParams) =>
    [...appointmentKeys.views(), 'month', shopId, year, month] as const,

  weekView: ({ shopId, year, week }: ViewParams) =>
    [...appointmentKeys.views(), 'week', shopId, year, week] as const,

  dayView: ({ shopId, date }: ViewParams) =>
    [...appointmentKeys.views(), 'day', shopId, date] as const,

  // Single appointment
  details: () => [...appointmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,

  // Counts for calendar indicators
  counts: () => [...appointmentKeys.all, 'count'] as const,
  monthCounts: ({ shopId, year, month }: ViewParams) =>
    [...appointmentKeys.counts(), 'month', shopId, year, month] as const,

  // Shop hours and settings
  shopHours: (shopId: string) => ['shopHours', shopId] as const,
  calendarSettings: (shopId: string) => ['calendarSettings', shopId] as const,
} as const;

/**
 * Helper to invalidate all appointment queries for a shop
 */
export function getInvalidateQueries(shopId: string) {
  return [
    { queryKey: appointmentKeys.all },
    { queryKey: appointmentKeys.shopHours(shopId) },
  ];
}

/**
 * Helper to get queries that should be invalidated for a specific date range
 */
export function getInvalidateQueriesForDateRange(
  shopId: string,
  startDate: string,
  endDate: string
) {
  // We invalidate broadly to ensure consistency
  // React Query will only refetch queries that are active
  return [
    { queryKey: appointmentKeys.timeRanges() },
    { queryKey: appointmentKeys.views() },
    { queryKey: appointmentKeys.counts() },
  ];
}
