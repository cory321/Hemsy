'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Skeleton,
  Alert,
  AlertTitle,
  Button,
  LinearProgress,
} from '@mui/material';
import { format } from 'date-fns';
import {
  useAppointmentsTimeRange,
  usePrefetchAdjacentWindows,
  calculateDateRange,
} from '@/lib/queries/appointment-queries';
import { CalendarDesktop } from './CalendarDesktop';
import { Calendar } from './Calendar';
import { useMediaQuery, useTheme } from '@mui/material';
import type { CalendarView } from '@/lib/queries/appointment-keys';
import type { Appointment } from '@/types';
import RefreshIcon from '@mui/icons-material/Refresh';

interface CalendarWithQueryProps {
  shopId: string;
  initialDate?: Date;
  initialView?: CalendarView;
  shopHours: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>;
  calendarSettings?: {
    buffer_time_minutes: number;
    default_appointment_duration: number;
  };
  focusAppointmentId?: string;
  onAppointmentClick?: (appointment: Appointment) => void;
  onDateClick?: (date: Date, time?: string) => void;
  onTimeSlotClick?: (date: Date, time?: string) => void;
}

function CalendarSkeleton({ view }: { view: CalendarView }) {
  const skeletonHeight = view === 'month' ? 600 : view === 'week' ? 500 : 400;

  return (
    <Box sx={{ p: 2 }}>
      {/* Header skeleton */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Skeleton variant="rectangular" width={120} height={40} />
        <Skeleton variant="rectangular" width={200} height={40} />
        <Skeleton variant="rectangular" width={120} height={40} />
      </Box>

      {/* Calendar skeleton */}
      <Skeleton
        variant="rectangular"
        width="100%"
        height={skeletonHeight}
        sx={{ borderRadius: 1 }}
      />
    </Box>
  );
}

export function CalendarWithQuery({
  shopId,
  initialDate = new Date(),
  initialView = 'month',
  shopHours,
  calendarSettings,
  focusAppointmentId,
  onAppointmentClick,
  onDateClick,
}: CalendarWithQueryProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentDate, setCurrentDate] = useState(initialDate);
  const [view, setView] = useState<CalendarView>(initialView);

  // Track the last requested date to avoid race conditions
  const lastRequestedDate = useRef(currentDate);
  const [cachedAppointments, setCachedAppointments] = useState<Appointment[]>(
    []
  );
  const [isNavigating, setIsNavigating] = useState(false);

  // Calculate date range based on current view
  const { startDate, endDate } = useMemo(() => {
    const range = calculateDateRange(currentDate, view);
    return range;
  }, [currentDate, view]);

  // Fetch appointments for current window
  const {
    data: appointments = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAppointmentsTimeRange(shopId, startDate, endDate, view);

  // Prefetch adjacent windows in the background
  usePrefetchAdjacentWindows(shopId, currentDate, view);

  // Update cached appointments when new data arrives
  // Only update if this is the data we actually requested (prevents race conditions)
  useEffect(() => {
    if (!isLoading && !isError) {
      setCachedAppointments(appointments);
      // Data finished loading
      if (!isFetching) {
        setIsNavigating(false);
      }
    }
  }, [appointments, isLoading, isError, isFetching]);

  // Navigation handlers
  const handleNavigate = useCallback(
    (direction: 'prev' | 'next' | 'today') => {
      let newDate: Date;

      switch (direction) {
        case 'today':
          newDate = new Date();
          break;
        case 'prev':
          newDate = new Date(currentDate);
          if (view === 'month') {
            // Fix: Set to first day of month before changing month to avoid date overflow
            newDate.setDate(1);
            newDate.setMonth(newDate.getMonth() - 1);
          } else if (view === 'week') {
            newDate.setDate(newDate.getDate() - 7);
          } else if (view === 'day') {
            newDate.setDate(newDate.getDate() - 1);
          }
          break;
        case 'next':
          newDate = new Date(currentDate);
          if (view === 'month') {
            // Fix: Set to first day of month before changing month to avoid date overflow
            newDate.setDate(1);
            newDate.setMonth(newDate.getMonth() + 1);
          } else if (view === 'week') {
            newDate.setDate(newDate.getDate() + 7);
          } else if (view === 'day') {
            newDate.setDate(newDate.getDate() + 1);
          }
          break;
      }

      // Update the last requested date to prevent race conditions
      lastRequestedDate.current = newDate;
      setCurrentDate(newDate);
    },
    [currentDate, view]
  );

  const handleViewChange = useCallback((newView: CalendarView) => {
    setView(newView);
  }, []);

  const handleDateClick = useCallback((date: Date) => {
    // This is a date click - navigate to day view
    lastRequestedDate.current = date;
    setCurrentDate(date);
    setView('day');
  }, []);

  const handleTimeSlotClick = useCallback(
    (date: Date, time?: string) => {
      // This is a time slot click - call parent's onDateClick for appointment creation
      onDateClick?.(date, time);
    },
    [onDateClick]
  );

  const handleRefresh = useCallback(
    (date?: Date) => {
      if (date) {
        // Update the last requested date to prevent race conditions
        lastRequestedDate.current = date;
        setCurrentDate(date);
        setIsNavigating(true);
      } else {
        setIsNavigating(true);
        refetch();
      }
    },
    [refetch]
  );

  // Error state
  if (isError) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => handleRefresh()}
              startIcon={<RefreshIcon />}
            >
              Retry
            </Button>
          }
        >
          <AlertTitle>Error loading appointments</AlertTitle>
          {error?.message || 'Failed to load appointments. Please try again.'}
        </Alert>
      </Box>
    );
  }

  // Determine which appointments to show
  // If we're loading but have cached appointments, show them to keep UI responsive
  // Only show skeleton on initial load or when we have no data at all
  const appointmentsToShow =
    (isLoading || isFetching) && cachedAppointments.length > 0
      ? cachedAppointments
      : appointments;

  // Debug logging

  const showSkeleton = isLoading && cachedAppointments.length === 0;

  // Show skeleton only on initial load
  if (showSkeleton) {
    return <CalendarSkeleton view={view} />;
  }

  // Success state - render calendar
  const CalendarComponent = isMobile ? Calendar : CalendarDesktop;

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Show loading indicator when fetching new data */}
      {isFetching && (
        <LinearProgress
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
          }}
        />
      )}
      <CalendarComponent
        appointments={appointmentsToShow}
        shopHours={shopHours}
        {...(calendarSettings && { calendarSettings })}
        {...(focusAppointmentId && { focusAppointmentId })}
        {...(onAppointmentClick && { onAppointmentClick })}
        onDateClick={handleDateClick}
        onTimeSlotClick={handleTimeSlotClick}
        onRefresh={handleRefresh}
        // Disable navigation and view controls while fetching to prevent rapid clicks
        isLoading={isFetching || isNavigating}
        currentDate={currentDate}
        view={view}
        onViewChange={handleViewChange}
      />
    </Box>
  );
}

// Export a memoized version for performance
export default CalendarWithQuery;
