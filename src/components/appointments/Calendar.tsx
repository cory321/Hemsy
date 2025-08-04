'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Typography,
  Button,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import ListIcon from '@mui/icons-material/List';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from 'date-fns';
import { generateMonthDays, generateWeekDays } from '@/lib/utils/calendar';
import { MonthView } from './views/MonthView';
import { WeekView } from './views/WeekView';
import { DayView } from './views/DayView';
import { ListView } from './views/ListView';
import { CalendarSettings } from './CalendarSettings';
import type { Appointment } from '@/types';

export type CalendarView = 'month' | 'week' | 'day' | 'list';

interface CalendarProps {
  appointments: Appointment[];
  shopHours?: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>;
  onAppointmentClick?: (appointment: Appointment) => void;
  onDateClick?: (date: Date, time?: string) => void;
  onRefresh?: () => void;
}

export function Calendar({
  appointments,
  shopHours = [],
  onAppointmentClick,
  onDateClick,
  onRefresh,
}: CalendarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>(isMobile ? 'day' : 'month');
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    switch (view) {
      case 'month':
        setCurrentDate((date) => subMonths(date, 1));
        break;
      case 'week':
        setCurrentDate((date) => subWeeks(date, 1));
        break;
      case 'day':
        setCurrentDate((date) => subDays(date, 1));
        break;
    }
    onRefresh?.();
  }, [view, onRefresh]);

  const handleNext = useCallback(() => {
    switch (view) {
      case 'month':
        setCurrentDate((date) => addMonths(date, 1));
        break;
      case 'week':
        setCurrentDate((date) => addWeeks(date, 1));
        break;
      case 'day':
        setCurrentDate((date) => addDays(date, 1));
        break;
    }
    onRefresh?.();
  }, [view, onRefresh]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
    onRefresh?.();
  }, [onRefresh]);

  const handleViewChange = (
    _: React.MouseEvent<HTMLElement>,
    newView: CalendarView | null
  ) => {
    if (newView) {
      setView(newView);
      onRefresh?.();
    }
  };

  // Get formatted header based on view
  const headerText = useMemo(() => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        const weekStart = generateWeekDays(currentDate)[0];
        const weekEnd = generateWeekDays(currentDate)[6];
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'list':
        return 'All Appointments';
      default:
        return '';
    }
  }, [currentDate, view]);

  return (
    <Box>
      {/* Calendar Header */}
      <Paper
        sx={{
          p: 2,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        {/* Navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {view !== 'list' && (
            <>
              <IconButton onClick={handlePrevious} size="small">
                <ChevronLeftIcon />
              </IconButton>
              <Typography
                variant="h6"
                sx={{ minWidth: isMobile ? 'auto' : 200, textAlign: 'center' }}
              >
                {headerText}
              </Typography>
              <IconButton onClick={handleNext} size="small">
                <ChevronRightIcon />
              </IconButton>
              <Button
                startIcon={<TodayIcon />}
                onClick={handleToday}
                size="small"
                variant="outlined"
                sx={{ ml: 1, display: { xs: 'none', sm: 'flex' } }}
              >
                Today
              </Button>
              <IconButton
                onClick={handleToday}
                size="small"
                sx={{ display: { xs: 'flex', sm: 'none' } }}
              >
                <TodayIcon />
              </IconButton>
            </>
          )}
          {view === 'list' && (
            <Typography variant="h6">{headerText}</Typography>
          )}
        </Box>

        {/* View Toggle and Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={handleViewChange}
            size="small"
          >
            <ToggleButton value="month" aria-label="month view">
              {isMobile ? <CalendarViewMonthIcon /> : 'Month'}
            </ToggleButton>
            <ToggleButton value="week" aria-label="week view">
              {isMobile ? <ViewWeekIcon /> : 'Week'}
            </ToggleButton>
            <ToggleButton value="day" aria-label="day view">
              {isMobile ? <ViewDayIcon /> : 'Day'}
            </ToggleButton>
            <ToggleButton value="list" aria-label="list view">
              {isMobile ? <ListIcon /> : 'List'}
            </ToggleButton>
          </ToggleButtonGroup>
          <IconButton
            onClick={() => setSettingsDialogOpen(true)}
            size="small"
            color="default"
            aria-label="Calendar settings"
          >
            <SettingsIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Calendar Views */}
      <Paper sx={{ overflow: 'hidden' }}>
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            appointments={appointments}
            shopHours={shopHours}
            onAppointmentClick={onAppointmentClick}
            onDateClick={onDateClick}
          />
        )}
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            appointments={appointments}
            shopHours={shopHours}
            onAppointmentClick={onAppointmentClick}
            onDateClick={onDateClick}
          />
        )}
        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            appointments={appointments}
            shopHours={shopHours}
            onAppointmentClick={onAppointmentClick}
            onTimeSlotClick={(date, time) => onDateClick?.(date, time)}
          />
        )}
        {view === 'list' && (
          <ListView
            appointments={appointments}
            onAppointmentClick={onAppointmentClick}
          />
        )}
      </Paper>

      {/* Calendar Settings Dialog */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Calendar Settings</DialogTitle>
        <DialogContent>
          <CalendarSettings onSave={() => setSettingsDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
