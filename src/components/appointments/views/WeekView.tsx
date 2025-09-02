'use client';

import {
  Box,
  Typography,
  Paper,
  useTheme,
  alpha,
  useMediaQuery,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useState } from 'react';
import { useInterval } from '@/lib/hooks/useInterval';
import { format, isSameDay, isToday } from 'date-fns';
import {
  generateWeekDays,
  getAppointmentColor,
  formatTime,
  isShopOpen,
  isPastDate,
  canCreateAppointment,
  isPastDateTime,
  canCreateAppointmentAt,
} from '@/lib/utils/calendar';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { Appointment } from '@/types';
import { useAppointmentsDisplay } from '@/hooks/useAppointmentDisplay';

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
  const SLOT_HEIGHT_PX = 80; // 30-minute slot height (ensures 15-min blocks are readable)

  // Convert appointments to display format with timezone support
  const { appointments: displayAppointments } =
    useAppointmentsDisplay(appointments);

  // Group appointments by date
  const appointmentsByDate = displayAppointments.reduce(
    (acc, appointment) => {
      const dateKey = appointment.displayDate;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(appointment);
      return acc;
    },
    {} as Record<string, (typeof displayAppointments)[0][]>
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

  // Current time indicator state and position
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every 5 minutes with automatic cleanup
  useInterval(
    () => setCurrentTime(new Date()),
    5 * 60 * 1000, // 5 minutes
    false // Don't run immediately
  );

  const currentTimeMinutes =
    currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentTimePosition =
    ((currentTimeMinutes - gridStartHour * 60) /
      ((gridEndHour - gridStartHour) * 60)) *
    100;

  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Grid container sx={{ minWidth: { xs: 700, md: 'auto' } }}>
        {/* Time column */}
        <Grid
          size={1}
          sx={{ borderRight: `1px solid ${theme.palette.divider}` }}
        >
          <Box
            sx={{
              height: SLOT_HEIGHT_PX,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          />
          {timeSlots.map((time) => (
            <Box
              key={time}
              sx={{
                height: SLOT_HEIGHT_PX,
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
            (a, b) => a.displayStartTime.localeCompare(b.displayStartTime)
          );
          const isCurrentDay = isToday(day);
          const isOpen = isShopOpen(day, shopHours);

          return (
            <Grid
              size="grow"
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
                    const aptStartParts = apt.displayStartTime.split(':');
                    const aptStartHour = parseInt(aptStartParts[0] || '0', 10);
                    const aptStartMinute = parseInt(
                      aptStartParts[1] || '0',
                      10
                    );

                    const aptEndParts = apt.displayEndTime.split(':');
                    const aptEndHour = parseInt(aptEndParts[0] || '0', 10);
                    const aptEndMinute = parseInt(aptEndParts[1] || '0', 10);

                    const slotParts = time.split(':');
                    const slotHour = parseInt(slotParts[0] || '0', 10);
                    const slotMinute = parseInt(slotParts[1] || '0', 10);

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
                  const isPastSlot = isPastDateTime(day, time);
                  const canClickTimeSlot =
                    onTimeSlotClick &&
                    slotAppointments.length === 0 &&
                    canCreate &&
                    !isPastSlot;

                  return (
                    <Box
                      key={time}
                      sx={{
                        height: SLOT_HEIGHT_PX,
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
                  const startParts = appointment.start_time.split(':');
                  const startHour = parseInt(startParts[0] || '0', 10);
                  const startMinute = parseInt(startParts[1] || '0', 10);

                  const endParts = appointment.end_time.split(':');
                  const endHour = parseInt(endParts[0] || '0', 10);
                  const endMinute = parseInt(endParts[1] || '0', 10);

                  const top =
                    ((startHour - gridStartHour) * 60 + startMinute) *
                    (SLOT_HEIGHT_PX / 30);
                  const height =
                    ((endHour - startHour) * 60 + (endMinute - startMinute)) *
                    (SLOT_HEIGHT_PX / 30);
                  const pxPerMinute = SLOT_HEIGHT_PX / 30;
                  const density =
                    height < 48 ? 'compact' : height < 96 ? 'cozy' : 'regular';
                  const color = getAppointmentColor(appointment.type);

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
                        cursor: 'pointer',
                        overflow: 'hidden',
                        zIndex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        borderLeft: `4px solid ${color}`,
                        bgcolor: alpha(color, 0.06),
                        '&:hover': {
                          bgcolor: alpha(color, 0.1),
                          zIndex: 2,
                          boxShadow: theme.shadows[4],
                        },
                      }}
                      onClick={() => onAppointmentClick?.(appointment)}
                    >
                      {/* Content area with progressive disclosure */}
                      <Box
                        sx={{
                          position: 'relative',
                          flex: 1,
                          px: 0.75,
                          py: 0.5,
                        }}
                      >
                        {/* Status badge */}
                        {appointment.status === 'confirmed' && (
                          <CheckCircleIcon
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              fontSize: 12,
                              color: color,
                            }}
                          />
                        )}

                        {/* Client name */}
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.primary',
                            fontWeight: 'medium',
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize:
                              density === 'regular' ? '0.8rem' : '0.7rem',
                            lineHeight: 1.2,
                            pr: 2.5,
                          }}
                        >
                          {appointment.client
                            ? `${appointment.client.first_name} ${appointment.client.last_name}`
                            : 'No Client'}
                        </Typography>

                        {/* Time caption always visible */}
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.65rem',
                            display: 'block',
                          }}
                        >
                          {formatTime(appointment.start_time)} -{' '}
                          {formatTime(appointment.end_time)}
                        </Typography>

                        {/* Type only for larger heights */}
                        {density === 'regular' && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              fontSize: '0.65rem',
                              textTransform: 'capitalize',
                              display: 'block',
                            }}
                          >
                            {appointment.type.replace('_', ' ')}
                          </Typography>
                        )}
                      </Box>
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
