'use client';

import {
  Box,
  Typography,
  Grid,
  Paper,
  useTheme,
  alpha,
  useMediaQuery,
} from '@mui/material';
import { format, isSameDay, isToday } from 'date-fns';
import {
  generateWeekDays,
  getAppointmentColor,
  formatTime,
  isShopOpen,
  isPastDate,
  canCreateAppointment,
} from '@/lib/utils/calendar';
import AddIcon from '@mui/icons-material/Add';
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
  onTimeSlotClick?: (date: Date, time?: string) => void;
}

export function WeekView({
  currentDate,
  appointments,
  shopHours,
  onAppointmentClick,
  onDateClick,
  onTimeSlotClick,
}: WeekViewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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

  // Generate time slots for the grid based on shop hours with 30-minute increments
  const timeSlots: string[] = [];

  // Find the earliest open time and latest close time across all days
  const openDays = shopHours.filter((h) => !h.is_closed);
  const earliestHour = openDays.reduce((earliest, hours) => {
    if (!hours.open_time) return earliest;
    const hour = parseInt(hours.open_time.split(':')[0] || '0');
    return Math.min(earliest, hour);
  }, 24);
  const latestHour = openDays.reduce((latest, hours) => {
    if (!hours.close_time) return latest;
    const hour = parseInt(hours.close_time.split(':')[0] || '0');
    return Math.max(latest, hour);
  }, 0);

  // Default to 8 AM - 6 PM if no shop hours found
  const gridStartHour = earliestHour === 24 ? 8 : earliestHour;
  const gridEndHour = latestHour === 0 ? 18 : latestHour;

  for (let hour = gridStartHour; hour <= gridEndHour; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < gridEndHour) {
      // Don't add :30 slot for the last hour
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
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
              height: 40, // Reduced height for 30-minute slots
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          />
          {timeSlots.map((time) => (
            <Box
              key={time}
              sx={{
                height: 40, // Reduced height for 30-minute slots
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
                {timeSlots.map((time) => {
                  // Check if this time slot has appointments (30-minute slot checking)
                  const slotAppointments = dayAppointments.filter((apt) => {
                    const [aptStartHour, aptStartMinute] = apt.start_time
                      .split(':')
                      .map(Number);
                    const [aptEndHour, aptEndMinute] = apt.end_time
                      .split(':')
                      .map(Number);
                    const [slotHour, slotMinute] = time.split(':').map(Number);

                    // Convert times to minutes for easier comparison
                    const aptStartMinutes = aptStartHour * 60 + aptStartMinute;
                    const aptEndMinutes = aptEndHour * 60 + aptEndMinute;
                    const slotStartMinutes = slotHour * 60 + slotMinute;
                    const slotEndMinutes = slotStartMinutes + 30; // 30-minute slot

                    // Check if appointment overlaps with this 30-minute slot
                    return (
                      aptStartMinutes < slotEndMinutes &&
                      aptEndMinutes > slotStartMinutes
                    );
                  });

                  const isPast = isPastDate(day);
                  const canCreate = canCreateAppointment(day, shopHours);
                  const canClickTimeSlot =
                    onTimeSlotClick &&
                    slotAppointments.length === 0 &&
                    canCreate;

                  return (
                    <Box
                      key={time}
                      sx={{
                        height: 40, // Reduced height for 30-minute slots
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        cursor: canClickTimeSlot ? 'pointer' : 'default',
                        bgcolor: isPast
                          ? alpha(theme.palette.action.disabled, 0.03)
                          : 'inherit',
                        position: 'relative',
                        '&:hover':
                          canClickTimeSlot && !isMobile
                            ? {
                                bgcolor: alpha(
                                  theme.palette.primary.main,
                                  0.04
                                ),
                                '& .add-appointment-hint': {
                                  opacity: 1,
                                },
                              }
                            : undefined,
                      }}
                      onClick={() => {
                        if (canClickTimeSlot) {
                          onTimeSlotClick(day, time);
                        }
                      }}
                    >
                      {/* Add appointment hint for empty slots */}
                      {canClickTimeSlot && !isMobile && (
                        <Box
                          className="add-appointment-hint"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            gap: 0.5,
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            pointerEvents: 'none',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            zIndex: 0,
                          }}
                        >
                          <AddIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            Add
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  );
                })}

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

                  const top =
                    ((startHour - gridStartHour) * 60 + startMinute) *
                    (40 / 30); // Adjust for 30-minute slots and new height
                  const height =
                    ((endHour - startHour) * 60 + (endMinute - startMinute)) *
                    (40 / 30); // Adjust for 30-minute slots

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
                        {appointment.client
                          ? `${appointment.client.first_name} ${appointment.client.last_name}`
                          : 'No Client'}
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
