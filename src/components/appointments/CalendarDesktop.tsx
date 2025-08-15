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
  Grid,
  Stack,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import ViewDayIcon from '@mui/icons-material/ViewDay';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';

import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from 'date-fns';
import { generateWeekDays } from '@/lib/utils/calendar';
import { MonthViewDesktop } from './views/MonthViewDesktop';
import { WeekViewDesktop } from './views/WeekViewDesktop';
import { DayView } from './views/DayView';
import { ListView } from './views/ListView';
import { CalendarSettings } from './CalendarSettings';
import type { Appointment } from '@/types';
import { useThrottle } from '../../hooks/useThrottle';

export type CalendarView = 'month' | 'week' | 'day' | 'list';

interface CalendarDesktopProps {
  appointments: Appointment[];
  shopHours: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>;
  onAppointmentClick?: (appointment: Appointment) => void;
  onDateClick?: (date: Date, time?: string) => void;
  onRefresh?: (date?: Date) => void;
  isLoading?: boolean;
  currentDate?: Date;
  view?: CalendarView;
  onViewChange?: (view: CalendarView) => void;
  focusAppointmentId?: string;
}

export function CalendarDesktop({
  appointments,
  shopHours = [],
  onAppointmentClick,
  onDateClick,
  onRefresh,
  isLoading = false,
  currentDate: controlledDate,
  view: controlledView,
  onViewChange,
  focusAppointmentId,
}: CalendarDesktopProps) {
  const theme = useTheme();
  // Use controlled values if provided, otherwise manage state internally
  const [internalDate, setInternalDate] = useState(new Date());
  const [internalView, setInternalView] = useState<CalendarView>('month');
  const currentDate = controlledDate ?? internalDate;
  const view = controlledView ?? internalView;
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // Filter appointments based on selected type and status
  const filteredAppointments = useMemo(() => {
    let filtered = appointments;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((apt) => apt.type === filterType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((apt) => apt.status === filterStatus);
    }

    return filtered;
  }, [appointments, filterType, filterStatus]);

  // Navigation handlers
  const throttledHandlePrevious = useThrottle(() => {
    let newDate: Date;
    switch (view) {
      case 'month':
        newDate = subMonths(currentDate, 1);
        break;
      case 'week':
        newDate = subWeeks(currentDate, 1);
        break;
      case 'day':
        newDate = subDays(currentDate, 1);
        break;
      default:
        newDate = currentDate;
    }
    // Only update internal state if not controlled
    if (!controlledDate) {
      setInternalDate(newDate);
    }
    onRefresh?.(newDate);
  }, 400);

  const throttledHandleNext = useThrottle(() => {
    let newDate: Date;
    switch (view) {
      case 'month':
        newDate = addMonths(currentDate, 1);
        break;
      case 'week':
        newDate = addWeeks(currentDate, 1);
        break;
      case 'day':
        newDate = addDays(currentDate, 1);
        break;
      default:
        newDate = currentDate;
    }
    // Only update internal state if not controlled
    if (!controlledDate) {
      setInternalDate(newDate);
    }
    onRefresh?.(newDate);
  }, 400);

  const handleToday = useCallback(() => {
    const today = new Date();
    // Only update internal state if not controlled
    if (!controlledDate) {
      setInternalDate(today);
    }
    onRefresh?.(today);
  }, [onRefresh, controlledDate]);

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: CalendarView | null
  ) => {
    // When clicking an already-selected view, MUI passes null. We still want to trigger a refresh
    const nextView = newView ?? view;
    // Only update internal state if not controlled and the view actually changed
    if (!controlledView && newView && newView !== view) {
      setInternalView(nextView);
    }
    // Notify parent of the chosen view (use current if null)
    onViewChange?.(nextView);
    onRefresh?.(currentDate);
  };

  const handleAppointmentSelect = (appointment: Appointment) => {
    onAppointmentClick?.(appointment);
  };

  const handleDateSelect = (date: Date) => {
    // Only update internal state if not controlled
    if (!controlledDate) {
      setInternalDate(date);
    }
    if (view !== 'day') {
      // Only update internal state if not controlled
      if (!controlledView) {
        setInternalView('day');
      }
      // Notify parent if controlled
      onViewChange?.('day');
    }
    // If controlled, notify parent about the date click
    // This allows the parent to handle navigation and other logic
    if (controlledDate || controlledView) {
      onDateClick?.(date);
    }
  };

  // Get formatted header based on view
  const headerText = useMemo(() => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'week':
        const weekDays = generateWeekDays(currentDate);
        const weekStart = weekDays[0];
        const weekEnd = weekDays[6];
        return weekStart && weekEnd
          ? `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
          : '';
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'list':
        return 'All Appointments';
      default:
        return '';
    }
  }, [currentDate, view]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 'calc(100vh - 200px)',
        position: 'relative',
      }}
    >
      {/* Fixed Header Controls - Always full width */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          bgcolor: 'background.default',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Grid
          container
          alignItems="center"
          spacing={2}
          sx={{
            flexWrap: { xs: 'wrap', lg: 'nowrap' },
          }}
        >
          <Grid item xs={12} md={4}>
            {/* Navigation */}
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ justifyContent: { xs: 'center', md: 'flex-start' } }}
            >
              {view !== 'list' && (
                <>
                  <IconButton
                    onClick={throttledHandlePrevious}
                    disabled={isLoading}
                  >
                    <ChevronLeftIcon />
                  </IconButton>
                  <Typography
                    variant="h5"
                    sx={{ minWidth: 200, textAlign: 'center' }}
                  >
                    {headerText}
                  </Typography>
                  <IconButton
                    onClick={throttledHandleNext}
                    disabled={isLoading}
                  >
                    <ChevronRightIcon />
                  </IconButton>
                </>
              )}
              {view === 'list' && (
                <Typography variant="h5">{headerText}</Typography>
              )}
            </Stack>
          </Grid>

          <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
            {/* View Toggle */}
            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={handleViewChange}
              size="medium"
              disabled={isLoading}
            >
              <ToggleButton
                value="month"
                aria-label="month view"
                disabled={isLoading}
              >
                <CalendarViewMonthIcon sx={{ mr: 1 }} />
                Month
              </ToggleButton>
              <ToggleButton
                value="week"
                aria-label="week view"
                disabled={isLoading}
              >
                <ViewWeekIcon sx={{ mr: 1 }} />
                Week
              </ToggleButton>
              <ToggleButton
                value="day"
                aria-label="day view"
                disabled={isLoading}
              >
                <ViewDayIcon sx={{ mr: 1 }} />
                Day
              </ToggleButton>
              <ToggleButton
                value="list"
                aria-label="list view"
                disabled={isLoading}
              >
                <ViewAgendaIcon sx={{ mr: 1 }} />
                Agenda
              </ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
            {/* Action Buttons */}
            <Stack
              direction="row"
              spacing={1}
              justifyContent="flex-end"
              sx={{ flexWrap: 'wrap', gap: 1 }}
            >
              <Button
                startIcon={<TodayIcon />}
                onClick={handleToday}
                variant="outlined"
              >
                Today
              </Button>
              <Tooltip title="Calendar settings">
                <IconButton
                  onClick={() => setSettingsDialogOpen(true)}
                  color="default"
                  aria-label="Calendar settings"
                >
                  <SettingsIcon />
                </IconButton>
              </Tooltip>
              {onRefresh && (
                <IconButton
                  onClick={() => onRefresh(currentDate)}
                  aria-label="Refresh"
                >
                  <RefreshIcon />
                </IconButton>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Filter Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          borderRadius: 2,
          bgcolor: 'background.default',
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Filter Section */}
          <Grid item xs={12}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <FilterListIcon color="action" />
              <FormControl size="small" sx={{ minWidth: 200, maxWidth: 300 }}>
                <InputLabel id="filter-by-type-label">
                  Filter by type
                </InputLabel>
                <Select
                  labelId="filter-by-type-label"
                  value={filterType}
                  label="Filter by type"
                  onChange={(e) => setFilterType(e.target.value)}
                  inputProps={{ 'aria-label': 'Filter by type' }}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="fitting">Fitting</MenuItem>
                  <MenuItem value="consultation">Consultation</MenuItem>
                  <MenuItem value="pickup">Pickup</MenuItem>
                  <MenuItem value="delivery">Delivery</MenuItem>
                  <MenuItem value="alteration">Alteration</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 200, maxWidth: 300 }}>
                <InputLabel id="filter-by-status-label">
                  Filter by status
                </InputLabel>
                <Select
                  labelId="filter-by-status-label"
                  value={filterStatus}
                  label="Filter by status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                  inputProps={{ 'aria-label': 'Filter by status' }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="declined">Declined</MenuItem>
                  <MenuItem value="canceled">Canceled</MenuItem>
                  <MenuItem value="no_show">No Show</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" color="text.secondary">
                {filteredAppointments.length} filtered
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content Area with Side Panel */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          minHeight: 0, // Important for proper overflow handling
        }}
      >
        {/* Main Calendar Area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            pr: 0,
            minWidth: 0, // Prevent flex items from overflowing
          }}
        >
          {/* Calendar Views */}
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              overflow: 'auto',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              maxWidth: '100%',
              mx: 'auto',
              width: '100%',
              minHeight: 0,
            }}
          >
            {view === 'month' && (
              <MonthViewDesktop
                currentDate={currentDate}
                appointments={filteredAppointments}
                shopHours={shopHours}
                onAppointmentClick={handleAppointmentSelect}
                onDateClick={handleDateSelect}
              />
            )}
            {view === 'week' && (
              <WeekViewDesktop
                currentDate={currentDate}
                appointments={filteredAppointments}
                shopHours={shopHours}
                onAppointmentClick={handleAppointmentSelect}
                onDateClick={handleDateSelect}
                {...(onDateClick && { onTimeSlotClick: onDateClick })}
              />
            )}
            {view === 'day' && (
              <DayView
                currentDate={currentDate}
                appointments={filteredAppointments}
                shopHours={shopHours}
                onAppointmentClick={handleAppointmentSelect}
                {...(onDateClick && { onTimeSlotClick: onDateClick })}
                {...(focusAppointmentId && { focusAppointmentId })}
              />
            )}
            {view === 'list' && (
              <ListView
                appointments={filteredAppointments}
                onAppointmentClick={handleAppointmentSelect}
              />
            )}
          </Paper>
        </Box>
      </Box>

      {/* Calendar Settings Dialog */}
      <Dialog
        open={settingsDialogOpen}
        onClose={() => setSettingsDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Calendar Settings
          <IconButton
            aria-label="close"
            onClick={() => setSettingsDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <CalendarSettings onSave={() => setSettingsDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
