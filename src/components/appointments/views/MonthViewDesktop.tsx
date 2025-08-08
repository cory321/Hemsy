'use client';

import {
  Box,
  Typography,
  Paper,
  useTheme,
  alpha,
  Tooltip,
  Stack,
} from '@mui/material';
import { format, isSameMonth, isToday, getWeek } from 'date-fns';
import {
  generateMonthDays,
  getAppointmentColor,
  isShopOpen,
  formatTime,
  isPastDate,
  canCreateAppointment,
} from '@/lib/utils/calendar';
import type { Appointment } from '@/types';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface MonthViewDesktopProps {
  currentDate: Date;
  appointments: Appointment[];
  shopHours: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>;
  onAppointmentClick?: (appointment: Appointment) => void;
  onDateClick?: (date: Date) => void;
}

export function MonthViewDesktop({
  currentDate,
  appointments,
  shopHours,
  onAppointmentClick,
  onDateClick,
}: MonthViewDesktopProps) {
  const theme = useTheme();
  const days = generateMonthDays(currentDate);
  const weekDays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  // Group appointments by date
  const appointmentsByDate = appointments.reduce(
    (acc, appointment) => {
      const dateKey = appointment.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(appointment);
      return acc;
    },
    {} as Record<string, Appointment[]>
  );

  // Sort appointments by time
  Object.keys(appointmentsByDate).forEach((date) => {
    const appointments = appointmentsByDate[date];
    if (appointments) {
      appointments.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
  });

  return (
    <Box
      sx={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 3,
        bgcolor: 'background.default',
      }}
    >
      {/* Fixed header with week days */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 1,
          mb: 2,
          pb: 2,
          borderBottom: `2px solid ${theme.palette.divider}`,
        }}
      >
        {weekDays.map((day) => (
          <Box key={day} sx={{ textAlign: 'center' }}>
            <Typography
              variant="subtitle1"
              fontWeight="bold"
              color="text.secondary"
              sx={{
                textTransform: 'uppercase',
                fontSize: '0.875rem',
                letterSpacing: '0.5px',
              }}
            >
              {day}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Calendar grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridTemplateRows: `repeat(${Math.ceil(days.length / 7)}, minmax(140px, auto))`,
          gap: 1,
          minHeight: `${Math.ceil(days.length / 7) * 140}px`,
        }}
      >
        {days.map((day, index) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayAppointments = appointmentsByDate[dateStr] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          const isOpen = isShopOpen(day, shopHours);
          const isPast = isPastDate(day);
          const canCreate = canCreateAppointment(day, shopHours);
          const weekNumber = index % 7 === 0 ? getWeek(day) : null;

          return (
            <Paper
              key={index}
              elevation={0}
              sx={{
                p: 1.5,
                bgcolor: isPast
                  ? alpha(theme.palette.action.disabled, 0.08)
                  : !isOpen && isCurrentMonth
                    ? alpha(theme.palette.action.disabled, 0.02)
                    : isCurrentDay
                      ? alpha(theme.palette.primary.main, 0.04)
                      : 'background.paper',
                border: `1px solid ${
                  isCurrentDay
                    ? theme.palette.primary.main
                    : theme.palette.divider
                }`,
                borderWidth: isCurrentDay ? 2 : 1,
                opacity: isCurrentMonth ? 1 : 0.5,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '140px',
                '&:hover': {
                  bgcolor: !canCreate
                    ? alpha(theme.palette.action.disabled, 0.12)
                    : alpha(theme.palette.primary.main, 0.04),
                  boxShadow: theme.shadows[4],
                  zIndex: 1,
                },
              }}
              onClick={() => onDateClick?.(day)}
            >
              {/* Date header */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  mb: 1,
                }}
              >
                {/* Week number on first day of each week */}
                {weekNumber !== null && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      fontWeight: 500,
                    }}
                  >
                    {`W${weekNumber}`}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: isCurrentDay ? 'bold' : 'medium',
                      color: isPast
                        ? 'text.disabled'
                        : isCurrentDay
                          ? 'primary.main'
                          : 'text.primary',
                      lineHeight: 1,
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>
                  {/* Show month name on first day */}
                  {format(day, 'd') === '1' && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ ml: 0.5 }}
                    >
                      {format(day, 'MMM')}
                    </Typography>
                  )}
                </Box>
                {dayAppointments.length > 0 && (
                  <Box
                    sx={{
                      px: 1,
                      py: 0.25,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      borderRadius: 1,
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="primary"
                      fontWeight="medium"
                    >
                      {dayAppointments.length}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Shop status */}
              {!isOpen && isCurrentMonth && (
                <Box
                  sx={{
                    px: 1,
                    py: 0.25,
                    mb: 0.5,
                    bgcolor: alpha(theme.palette.error.main, 0.1),
                    borderRadius: 0.5,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Typography
                    variant="caption"
                    color="error.main"
                    fontWeight="medium"
                  >
                    Closed
                  </Typography>
                </Box>
              )}

              {/* Appointments list */}
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <Stack spacing={0.5}>
                  {dayAppointments.slice(0, 3).map((apt) => (
                    <Tooltip
                      key={apt.id}
                      title={
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {apt.client
                              ? `${apt.client.first_name} ${apt.client.last_name}`
                              : 'No Client'}
                          </Typography>
                          <Typography variant="caption" display="block">
                            {formatTime(apt.start_time)} -{' '}
                            {formatTime(apt.end_time)}
                          </Typography>
                          {apt.client && (
                            <Typography variant="caption" display="block">
                              {apt.client.first_name} {apt.client.last_name}
                            </Typography>
                          )}
                          {apt.notes && (
                            <Typography
                              variant="caption"
                              display="block"
                              sx={{ mt: 0.5 }}
                            >
                              {apt.notes}
                            </Typography>
                          )}
                        </Box>
                      }
                      placement="top"
                      arrow
                    >
                      <Box
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick?.(apt);
                        }}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 0.5,
                          py: 0.25,
                          borderRadius: 0.5,
                          bgcolor: getAppointmentColor(apt.type),
                          color: 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: theme.shadows[2],
                          },
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight="bold"
                          sx={{ fontSize: '0.7rem', lineHeight: 1 }}
                        >
                          {formatTime(apt.start_time)}
                        </Typography>
                        {apt.status === 'confirmed' && (
                          <CheckCircleIcon
                            sx={{ fontSize: 10, color: 'white' }}
                          />
                        )}
                      </Box>
                    </Tooltip>
                  ))}
                  {dayAppointments.length > 3 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: '0.7rem',
                        fontStyle: 'italic',
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDateClick?.(day);
                      }}
                    >
                      +{dayAppointments.length - 3} more
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}
