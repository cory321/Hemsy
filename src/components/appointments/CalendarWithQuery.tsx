'use client';

import { useState, useMemo, useCallback } from 'react';
import { Box, Skeleton, Alert, AlertTitle, Button } from '@mui/material';
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
  onAppointmentClick?: (appointment: Appointment) => void;
  onDateClick?: (date: Date, time?: string) => void;
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
  onAppointmentClick,
  onDateClick,
}: CalendarWithQueryProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [currentDate, setCurrentDate] = useState(initialDate);
  const [view, setView] = useState<CalendarView>(initialView);

  // Calculate date range based on current view
  const { startDate, endDate } = useMemo(() => {
    const range = calculateDateRange(currentDate, view);
    console.log('📆 Date Range Calculation:', {
      currentDate: currentDate.toISOString(),
      currentMonth: currentDate.getMonth(),
      currentYear: currentDate.getFullYear(),
      startDate: range.startDate,
      endDate: range.endDate,
      view,
    });
    return range;
  }, [currentDate, view]);

  // Fetch appointments for current window
  const {
    data: appointments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAppointmentsTimeRange(shopId, startDate, endDate, view);

  // Prefetch adjacent windows in the background
  usePrefetchAdjacentWindows(shopId, currentDate, view);

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

      console.log('📅 Navigation:', {
        direction,
        oldDate: currentDate.toISOString(),
        newDate: newDate.toISOString(),
        view,
        oldMonth: currentDate.getMonth(),
        newMonth: newDate.getMonth(),
        oldYear: currentDate.getFullYear(),
        newYear: newDate.getFullYear(),
      });
      setCurrentDate(newDate);
    },
    [currentDate, view]
  );

  const handleViewChange = useCallback((newView: CalendarView) => {
    setView(newView);
  }, []);

  const handleRefresh = useCallback(
    (date?: Date) => {
      if (date) {
        console.log('🔄 Refresh with new date:', date.toISOString());
        setCurrentDate(date);
      } else {
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
              onClick={handleRefresh}
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

  // Loading state - show skeleton
  if (isLoading) {
    return <CalendarSkeleton view={view} />;
  }

  // Success state - render calendar
  const CalendarComponent = isMobile ? Calendar : CalendarDesktop;

  return (
    <CalendarComponent
      appointments={appointments}
      shopHours={shopHours}
      onAppointmentClick={onAppointmentClick}
      onDateClick={onDateClick}
      onRefresh={handleRefresh}
    />
  );
}

// Export a memoized version for performance
export default CalendarWithQuery;
