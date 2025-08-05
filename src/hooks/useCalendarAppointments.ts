'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useAppointments } from '@/providers/AppointmentProvider';
import { CalendarView } from '@/lib/queries/appointment-keys';
import { calculateDateRange } from '@/lib/queries/appointment-queries';
import {
  format,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from 'date-fns';
import { Appointment } from '@/types';

interface UseCalendarAppointmentsOptions {
  shopId: string;
  initialDate?: Date;
  view: CalendarView;
  prefetchAdjacent?: boolean;
}

interface UseCalendarAppointmentsReturn {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  navigateNext: () => void;
  navigatePrevious: () => void;
  navigateToDate: (date: Date) => void;
  isDateRangeLoaded: boolean;
}

export function useCalendarAppointments({
  shopId,
  initialDate = new Date(),
  view,
  prefetchAdjacent = true,
}: UseCalendarAppointmentsOptions): UseCalendarAppointmentsReturn {
  const {
    state,
    loadAppointments,
    getAppointmentsForDateRange,
    isDateRangeLoaded,
  } = useAppointments();

  const [currentDate, setCurrentDate] = useState(initialDate);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the current request to prevent race conditions
  const loadingRef = useRef<{
    requestId: string;
    dateRange: { startDate: string; endDate: string };
  } | null>(null);

  // Calculate the current date range based on view
  const dateRange = useMemo(() => {
    return calculateDateRange(currentDate, view);
  }, [currentDate, view]);

  // Get appointments for the current date range
  const appointments = useMemo(() => {
    return getAppointmentsForDateRange(dateRange.startDate, dateRange.endDate);
  }, [getAppointmentsForDateRange, dateRange]);

  // Check if the current range is loaded
  const rangeLoaded = useMemo(() => {
    return isDateRangeLoaded(dateRange.startDate, dateRange.endDate);
  }, [isDateRangeLoaded, dateRange]);

  // Load appointments for the current date range
  const loadCurrentRange = useCallback(async () => {
    if (rangeLoaded) {
      return; // Already loaded
    }

    const requestId = `${shopId}-${dateRange.startDate}-${dateRange.endDate}-${Date.now()}`;
    loadingRef.current = { requestId, dateRange };

    setIsLoading(true);
    setError(null);

    try {
      await loadAppointments(shopId, dateRange);
    } catch (err) {
      if (loadingRef.current?.requestId === requestId) {
        setError(
          err instanceof Error ? err.message : 'Failed to load appointments'
        );
      }
    } finally {
      if (loadingRef.current?.requestId === requestId) {
        setIsLoading(false);
        loadingRef.current = null;
      }
    }
  }, [shopId, dateRange, rangeLoaded, loadAppointments]);

  // Prefetch adjacent date ranges
  const prefetchAdjacentRanges = useCallback(async () => {
    if (!prefetchAdjacent) return;

    const adjacentRanges: Array<{ startDate: string; endDate: string }> = [];

    switch (view) {
      case 'month': {
        // Prefetch previous and next month
        const prevMonth = subMonths(currentDate, 1);
        const nextMonth = addMonths(currentDate, 1);
        adjacentRanges.push(
          calculateDateRange(prevMonth, 'month'),
          calculateDateRange(nextMonth, 'month')
        );
        break;
      }
      case 'week': {
        // Prefetch previous and next week
        const prevWeek = subWeeks(currentDate, 1);
        const nextWeek = addWeeks(currentDate, 1);
        adjacentRanges.push(
          calculateDateRange(prevWeek, 'week'),
          calculateDateRange(nextWeek, 'week')
        );
        break;
      }
      case 'day': {
        // Prefetch previous and next 3 days
        for (let i = 1; i <= 3; i++) {
          adjacentRanges.push(
            calculateDateRange(subDays(currentDate, i), 'day'),
            calculateDateRange(addDays(currentDate, i), 'day')
          );
        }
        break;
      }
    }

    // Load adjacent ranges in the background
    for (const range of adjacentRanges) {
      if (!isDateRangeLoaded(range.startDate, range.endDate)) {
        loadAppointments(shopId, range).catch(() => {
          // Silent fail for prefetch
        });
      }
    }
  }, [
    prefetchAdjacent,
    view,
    currentDate,
    shopId,
    isDateRangeLoaded,
    loadAppointments,
  ]);

  // Load appointments when date range changes
  useEffect(() => {
    loadCurrentRange();
  }, [loadCurrentRange]);

  // Prefetch adjacent ranges after current range is loaded
  useEffect(() => {
    if (rangeLoaded && !isLoading) {
      prefetchAdjacentRanges();
    }
  }, [rangeLoaded, isLoading, prefetchAdjacentRanges]);

  // Navigation functions
  const navigateNext = useCallback(() => {
    switch (view) {
      case 'month':
        setCurrentDate((prev) => addMonths(prev, 1));
        break;
      case 'week':
        setCurrentDate((prev) => addWeeks(prev, 1));
        break;
      case 'day':
        setCurrentDate((prev) => addDays(prev, 1));
        break;
    }
  }, [view]);

  const navigatePrevious = useCallback(() => {
    switch (view) {
      case 'month':
        setCurrentDate((prev) => subMonths(prev, 1));
        break;
      case 'week':
        setCurrentDate((prev) => subWeeks(prev, 1));
        break;
      case 'day':
        setCurrentDate((prev) => subDays(prev, 1));
        break;
    }
  }, [view]);

  const navigateToDate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  const refetch = useCallback(async () => {
    // Force reload by clearing the loaded range first
    const requestId = `${shopId}-${dateRange.startDate}-${dateRange.endDate}-${Date.now()}`;
    loadingRef.current = { requestId, dateRange };

    setIsLoading(true);
    setError(null);

    try {
      await loadAppointments(shopId, dateRange);
    } catch (err) {
      if (loadingRef.current?.requestId === requestId) {
        setError(
          err instanceof Error ? err.message : 'Failed to load appointments'
        );
      }
    } finally {
      if (loadingRef.current?.requestId === requestId) {
        setIsLoading(false);
        loadingRef.current = null;
      }
    }
  }, [shopId, dateRange, loadAppointments]);

  // Get any errors from the state
  const stateError = useMemo(() => {
    for (const [, err] of state.errors) {
      return err;
    }
    return null;
  }, [state.errors]);

  return {
    appointments,
    isLoading,
    error: error || stateError,
    refetch,
    currentDate,
    setCurrentDate,
    navigateNext,
    navigatePrevious,
    navigateToDate,
    isDateRangeLoaded: rangeLoaded,
  };
}
