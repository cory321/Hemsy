'use client';

import { Box, Typography, Grid, Paper, useTheme, alpha } from '@mui/material';
import { format, isSameDay, isToday } from 'date-fns';
import {
  generateWeekDays,
  getAppointmentColor,
  formatTime,
  isShopOpen,
} from '@/lib/utils/calendar';
import type { Appointment } from '@/types';

interface WeekViewProps {
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

export function WeekView({
  currentDate,
  appointments,
  shopHours,
  onAppointmentClick,
  onDateClick,
}: WeekViewProps) {
  const theme = useTheme();
  const weekDays = generateWeekDays(currentDate);

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

  // Generate time slots for the grid (8 AM to 8 PM)
  const timeSlots = [];
  for (let hour = 8; hour <= 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Grid container sx={{ minWidth: { xs: 700, md: 'auto' } }}>
        {/* Time column */}
        <Grid
          item
          xs={1}
          sx={{ borderRight: `1px solid ${theme.palette.divider}` }}
        >
          <Box
            sx={{
              height: 60,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          />
          {timeSlots.map((time) => (
            <Box
              key={time}
              sx={{
                height: 60,
                p: 1,
                borderBottom: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {formatTime(time)}
              </Typography>
            </Box>
          ))}
        </Grid>

        {/* Day columns */}
        {weekDays.map((day, dayIndex) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayAppointments = (appointmentsByDate[dateStr] || []).sort(
            (a, b) => a.start_time.localeCompare(b.start_time)
          );
          const isCurrentDay = isToday(day);
          const isOpen = isShopOpen(day, shopHours);

          return (
            <Grid
              item
              xs
              key={dayIndex}
              sx={{
                borderRight:
                  dayIndex < 6 ? `1px solid ${theme.palette.divider}` : 'none',
                bgcolor: !isOpen
                  ? alpha(theme.palette.action.disabled, 0.05)
                  : 'background.paper',
              }}
            >
              {/* Day header */}
              <Box
                sx={{
                  height: 60,
                  p: 1,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  textAlign: 'center',
                  bgcolor: isCurrentDay
                    ? alpha(theme.palette.primary.main, 0.1)
                    : 'inherit',
                  cursor: 'pointer',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
                onClick={() => onDateClick?.(day)}
              >
                <Typography variant="caption" color="text.secondary">
                  {format(day, 'EEE')}
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight={isCurrentDay ? 'bold' : 'normal'}
                  color={isCurrentDay ? 'primary' : 'text.primary'}
                >
                  {format(day, 'd')}
                </Typography>
              </Box>

              {/* Time slots */}
              <Box sx={{ position: 'relative' }}>
                {timeSlots.map((time) => (
                  <Box
                    key={time}
                    sx={{
                      height: 60,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  />
                ))}

                {/* Appointments */}
                {dayAppointments.map((appointment) => {
                  const startHour = parseInt(
                    appointment.start_time.split(':')[0]
                  );
                  const startMinute = parseInt(
                    appointment.start_time.split(':')[1]
                  );
                  const endHour = parseInt(appointment.end_time.split(':')[0]);
                  const endMinute = parseInt(
                    appointment.end_time.split(':')[1]
                  );

                  const top = (startHour - 8) * 60 + startMinute;
                  const height =
                    (endHour - startHour) * 60 + (endMinute - startMinute);

                  return (
                    <Paper
                      key={appointment.id}
                      elevation={2}
                      sx={{
                        position: 'absolute',
                        top: `${top}px`,
                        left: 4,
                        right: 4,
                        height: `${height}px`,
                        bgcolor: getAppointmentColor(appointment.type),
                        color: 'white',
                        p: 0.5,
                        cursor: 'pointer',
                        overflow: 'hidden',
                        zIndex: 1,
                        '&:hover': {
                          zIndex: 2,
                          boxShadow: theme.shadows[4],
                        },
                      }}
                      onClick={() => onAppointmentClick?.(appointment)}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        {formatTime(appointment.start_time)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {appointment.title}
                      </Typography>
                    </Paper>
                  );
                })}
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
