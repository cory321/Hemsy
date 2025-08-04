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
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Grid,
  Stack,
  Card,
  CardContent,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogContent,
  DialogTitle,
  alpha,
} from '@mui/material';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import ViewDayIcon from '@mui/icons-material/ViewDay';

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';

import FilterListIcon from '@mui/icons-material/FilterList';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RefreshIcon from '@mui/icons-material/Refresh';
import ViewAgendaIcon from '@mui/icons-material/ViewAgenda';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isSameMonth,
  isToday,
} from 'date-fns';
import {
  generateMonthDays,
  generateWeekDays,
  isPastDate,
  isShopOpen,
} from '@/lib/utils/calendar';
import { MonthViewDesktop } from './views/MonthViewDesktop';
import { WeekViewDesktop } from './views/WeekViewDesktop';
import { DayView } from './views/DayView';
import { ListView } from './views/ListView';
import { CalendarSettings } from './CalendarSettings';
import type { Appointment } from '@/types';

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
  onRefresh?: () => void;
}

export function CalendarDesktop({
  appointments,
  shopHours = [],
  onAppointmentClick,
  onDateClick,
  onRefresh,
}: CalendarDesktopProps) {
  const theme = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  // Filter appointments based on selected type
  const filteredAppointments = useMemo(() => {
    if (filterType === 'all') return appointments;
    return appointments.filter((apt) => apt.type === filterType);
  }, [appointments, filterType]);

  // Get upcoming appointments for sidebar
  const upcomingAppointments = useMemo(() => {
    const today = new Date();
    return appointments
      .filter((apt) => new Date(apt.date) >= today)
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          a.start_time.localeCompare(b.start_time)
      )
      .slice(0, 5);
  }, [appointments]);

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

  const handleAppointmentSelect = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    onAppointmentClick?.(appointment);
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    if (view !== 'day') {
      setView('day');
    }
    // Don't call parent onDateClick since we're handling navigation internally
    // The parent onDateClick is intended for creating appointments, not navigation
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

  // Mini calendar for navigation
  const renderMiniCalendar = () => {
    const days = generateMonthDays(currentDate);
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    return (
      <Card sx={{ mb: 2, height: 'auto', overflow: 'visible' }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Typography variant="subtitle2">
              {format(currentDate, 'MMMM yyyy')}
            </Typography>
            <Box>
              <IconButton
                size="small"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Grid container spacing={0.5}>
            {weekDays.map((day) => (
              <Grid item xs key={day} sx={{ textAlign: 'center' }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight="bold"
                >
                  {day}
                </Typography>
              </Grid>
            ))}
            {days.map((day, index) => {
              const hasAppointments = appointments.some(
                (apt) => apt.date === format(day, 'yyyy-MM-dd')
              );
              const isPast = isPastDate(day);
              const isOpen = isShopOpen(day, shopHours);

              return (
                <Grid item xs key={index}>
                  <Button
                    size="small"
                    fullWidth
                    onClick={() => handleDateSelect(day)}
                    sx={{
                      minWidth: 0,
                      p: 0.5,
                      fontSize: '0.75rem',
                      bgcolor: isPast
                        ? alpha(theme.palette.action.disabled, 0.08)
                        : !isOpen
                          ? alpha(theme.palette.action.disabled, 0.02)
                          : isToday(day)
                            ? 'primary.main'
                            : 'transparent',
                      color: isPast
                        ? 'text.disabled'
                        : isToday(day)
                          ? 'primary.contrastText'
                          : isSameMonth(day, currentDate)
                            ? 'text.primary'
                            : 'text.disabled',
                      '&:hover': {
                        bgcolor:
                          isPast || !isOpen
                            ? alpha(theme.palette.action.disabled, 0.12)
                            : isToday(day)
                              ? 'primary.dark'
                              : 'action.hover',
                      },
                      position: 'relative',
                    }}
                  >
                    {format(day, 'd')}
                    {hasAppointments && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 2,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          bgcolor: isToday(day)
                            ? 'primary.contrastText'
                            : 'primary.main',
                        }}
                      />
                    )}
                  </Button>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    );
  };

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
                  <IconButton onClick={handlePrevious}>
                    <ChevronLeftIcon />
                  </IconButton>
                  <Typography
                    variant="h5"
                    sx={{ minWidth: 200, textAlign: 'center' }}
                  >
                    {headerText}
                  </Typography>
                  <IconButton onClick={handleNext}>
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
            >
              <ToggleButton value="month" aria-label="month view">
                <CalendarViewMonthIcon sx={{ mr: 1 }} />
                Month
              </ToggleButton>
              <ToggleButton value="week" aria-label="week view">
                <ViewWeekIcon sx={{ mr: 1 }} />
                Week
              </ToggleButton>
              <ToggleButton value="day" aria-label="day view">
                <ViewDayIcon sx={{ mr: 1 }} />
                Day
              </ToggleButton>
              <ToggleButton value="list" aria-label="list view">
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
              <Tooltip title="Toggle side panel">
                <IconButton
                  onClick={() => setShowSidePanel(!showSidePanel)}
                  color={showSidePanel ? 'primary' : 'default'}
                >
                  <ViewAgendaIcon />
                </IconButton>
              </Tooltip>
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
                <IconButton onClick={onRefresh} aria-label="Refresh">
                  <RefreshIcon />
                </IconButton>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Filter Bar with Quick Stats */}
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
          <Grid item xs={12} lg={6}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap',
              }}
            >
              <FilterListIcon color="action" />
              <FormControl size="small" sx={{ minWidth: 200, maxWidth: 400 }}>
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
              <Typography variant="body2" color="text.secondary">
                {filteredAppointments.length} filtered
              </Typography>
            </Box>
          </Grid>

          {/* Quick Stats Section */}
          <Grid item xs={12} lg={6}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: { xs: 'flex-start', lg: 'flex-end' },
                gap: 3,
                flexWrap: 'wrap',
              }}
            >
              <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {appointments.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {
                    appointments.filter(
                      (apt) => apt.date === format(new Date(), 'yyyy-MM-dd')
                    ).length
                  }
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Today
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                <Typography variant="h5" color="primary" fontWeight="bold">
                  {
                    appointments.filter((apt) => {
                      const aptDate = new Date(apt.date);
                      const weekStart = generateWeekDays(new Date())[0];
                      const weekEnd = generateWeekDays(new Date())[6];
                      return aptDate >= weekStart && aptDate <= weekEnd;
                    }).length
                  }
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  This Week
                </Typography>
              </Box>
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
            pr: showSidePanel ? 2 : 0,
            transition: 'padding 0.3s ease-in-out',
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

        {/* Side Panel */}
        <Box
          sx={{
            width: showSidePanel ? 320 : 0,
            transition: 'width 0.3s ease-in-out',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          {showSidePanel && (
            <Paper
              elevation={0}
              sx={{
                width: 320,
                minHeight: '100%',
                overflowY: 'auto',
                p: 2,
                borderRadius: 2,
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {/* Mini Calendar */}
              {renderMiniCalendar()}

              {/* Selected Appointment Details */}
              {selectedAppointment && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Appointment Details
                    </Typography>
                    <Stack spacing={1}>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <EventIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {selectedAppointment.title}
                        </Typography>
                      </Box>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <AccessTimeIcon fontSize="small" color="action" />
                        <Typography variant="body2">
                          {format(
                            new Date(selectedAppointment.date),
                            'MMM d, yyyy'
                          )}{' '}
                          at {selectedAppointment.start_time}
                        </Typography>
                      </Box>
                      {selectedAppointment.client && (
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <PersonIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            {selectedAppointment.client.first_name}{' '}
                            {selectedAppointment.client.last_name}
                          </Typography>
                        </Box>
                      )}
                      <Chip
                        label={selectedAppointment.type.replace('_', ' ')}
                        size="small"
                        sx={{ alignSelf: 'flex-start' }}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {/* Upcoming Appointments */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Upcoming Appointments
                  </Typography>
                  <List dense disablePadding>
                    {upcomingAppointments.map((apt) => (
                      <ListItemButton
                        key={apt.id}
                        onClick={() => handleAppointmentSelect(apt)}
                        selected={selectedAppointment?.id === apt.id}
                        sx={{ borderRadius: 1, mb: 0.5 }}
                      >
                        <ListItemText
                          primary={apt.title}
                          secondary={
                            <>
                              {format(new Date(apt.date), 'MMM d')} at{' '}
                              {apt.start_time}
                              {apt.client &&
                                ` • ${apt.client.first_name} ${apt.client.last_name}`}
                            </>
                          }
                        />
                      </ListItemButton>
                    ))}
                    {upcomingAppointments.length === 0 && (
                      <Typography variant="body2" color="text.secondary">
                        No upcoming appointments
                      </Typography>
                    )}
                  </List>
                </CardContent>
              </Card>
            </Paper>
          )}
        </Box>
      </Box>

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
