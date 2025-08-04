'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  alpha,
  Chip,
  Avatar,
  Tooltip,
  Stack,
  useMediaQuery,
} from '@mui/material';
import { format, isToday } from 'date-fns';
import {
  generateWeekDays,
  getAppointmentColor,
  formatTime,
  isShopOpen,
  isPastDate,
  canCreateAppointment,
} from '@/lib/utils/calendar';
import type { Appointment } from '@/types';
import AddIcon from '@mui/icons-material/Add';

interface WeekViewDesktopProps {
  currentDate: Date;
  appointments: Appointment[];
  shopHours: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>;
  // eslint-disable-next-line no-unused-vars
  onAppointmentClick?: (appointment: Appointment) => void;
  // eslint-disable-next-line no-unused-vars
  onDateClick?: (date: Date) => void;
  // eslint-disable-next-line no-unused-vars
  onTimeSlotClick?: (date: Date, time?: string) => void;
}

// Helper function to check if appointments overlap
function checkOverlap(apt1: Appointment, apt2: Appointment): boolean {
  return (
    apt1.date === apt2.date &&
    apt1.start_time < apt2.end_time &&
    apt1.end_time > apt2.start_time
  );
}

// Helper function to arrange overlapping appointments
function arrangeAppointments(
  appointments: Appointment[]
): Array<Appointment & { column: number; totalColumns: number }> {
  const arranged: Array<
    Appointment & { column: number; totalColumns: number }
  > = [];
  const columns: Appointment[][] = [];

  appointments.forEach((apt) => {
    let placed = false;
    for (let col = 0; col < columns.length; col++) {
      let canPlace = true;
      for (const existingApt of columns[col] || []) {
        if (checkOverlap(apt, existingApt)) {
          canPlace = false;
          break;
        }
      }
      if (canPlace) {
        columns[col]?.push(apt);
        placed = true;
        break;
      }
    }
    if (!placed) {
      columns.push([apt]);
    }
  });

  // Assign column numbers
  columns.forEach((col, colIndex) => {
    col.forEach((apt) => {
      arranged.push({
        ...apt,
        column: colIndex,
        totalColumns: columns.length,
      });
    });
  });

  return arranged;
}

export function WeekViewDesktop({
  currentDate,
  appointments,
  shopHours,
  onAppointmentClick,
  onDateClick,
  onTimeSlotClick,
}: WeekViewDesktopProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const weekDays = generateWeekDays(currentDate);

  // State to track current time for the indicator
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every 5 minutes
  useEffect(() => {
    const interval = setInterval(
      () => {
        setCurrentTime(new Date());
      },
      5 * 60 * 1000
    ); // 5 minutes in milliseconds

    return () => {
      if (typeof clearInterval !== 'undefined') {
        clearInterval(interval);
      }
    };
  }, []);

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

  // Generate time slots with 30-minute intervals based on shop hours
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

  // Default to 8 AM - 6 PM if no shop hours found (matching DayView behavior)
  const gridStartHour = earliestHour === 24 ? 8 : earliestHour;
  const gridEndHour = latestHour === 0 ? 18 : latestHour;

  for (let hour = gridStartHour; hour <= gridEndHour; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  // Current time indicator
  const currentTimeMinutes =
    currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentTimePosition =
    ((currentTimeMinutes - gridStartHour * 60) /
      ((gridEndHour - gridStartHour) * 60)) *
    100;

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header with day columns */}
      <Box
        sx={{
          display: 'flex',
          borderBottom: `2px solid ${theme.palette.divider}`,
        }}
      >
        {/* Time column header */}
        <Box
          sx={{
            width: { xs: 80, md: 90 },
            flexShrink: 0,
            p: 2,
            borderRight: `1px solid ${theme.palette.divider}`,
          }}
        />

        {/* Day headers */}
        {weekDays.map((day, dayIndex) => {
          const isCurrentDay = isToday(day);
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayAppointments = appointmentsByDate[dateStr] || [];
          const isOpen = isShopOpen(day, shopHours);
          const isPast = isPastDate(day);
          const canCreate = canCreateAppointment(day, shopHours);

          return (
            <Box
              key={dayIndex}
              sx={{
                flex: 1,
                p: 2,
                borderRight:
                  dayIndex < 6 ? `1px solid ${theme.palette.divider}` : 'none',
                bgcolor: isPast
                  ? alpha(theme.palette.action.disabled, 0.08)
                  : isCurrentDay
                    ? alpha(theme.palette.primary.main, 0.05)
                    : 'inherit',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: !canCreate
                    ? alpha(theme.palette.action.disabled, 0.12)
                    : alpha(theme.palette.primary.main, 0.08),
                },
              }}
              onClick={() => onDateClick?.(day)}
            >
              <Typography
                variant="subtitle2"
                color={isPast ? 'text.disabled' : 'text.secondary'}
                sx={{ textTransform: 'uppercase', fontSize: '0.75rem' }}
              >
                {format(day, 'EEE')}
              </Typography>
              <Typography
                variant="h5"
                fontWeight={isCurrentDay ? 'bold' : 'normal'}
                color={
                  isPast
                    ? 'text.disabled'
                    : isCurrentDay
                      ? 'primary'
                      : 'text.primary'
                }
              >
                {format(day, 'd')}
              </Typography>
              {dayAppointments.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {dayAppointments.length} appointments
                </Typography>
              )}
              {!isOpen && <Chip label="Closed" size="small" sx={{ mt: 0.5 }} />}
            </Box>
          );
        })}
      </Box>

      {/* Time grid */}
      <Box sx={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <Box
          sx={{
            display: 'flex',
            position: 'relative',
            minHeight: timeSlots.length * 40,
          }}
        >
          {/* Time labels */}
          <Box sx={{ width: { xs: 80, md: 90 }, flexShrink: 0 }}>
            {timeSlots.map((time, index) => (
              <Box
                key={time}
                sx={{
                  height: 40,
                  px: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  borderBottom:
                    index % 2 === 1
                      ? `1px solid ${theme.palette.divider}`
                      : 'none',
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  {formatTime(time)}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Day columns with appointments */}
          {weekDays.map((day, dayIndex) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayAppointments = (appointmentsByDate[dateStr] || []).sort(
              (a, b) => a.start_time.localeCompare(b.start_time)
            );
            const arrangedAppointments = arrangeAppointments(dayAppointments);
            const isOpen = isShopOpen(day, shopHours);
            const isPast = isPastDate(day);

            return (
              <Box
                key={dayIndex}
                sx={{
                  flex: 1,
                  position: 'relative',
                  borderRight:
                    dayIndex < 6
                      ? `1px solid ${theme.palette.divider}`
                      : 'none',
                  bgcolor: isPast
                    ? alpha(theme.palette.action.disabled, 0.08)
                    : !isOpen
                      ? alpha(theme.palette.action.disabled, 0.02)
                      : 'background.paper',
                }}
              >
                {/* Time slot lines */}
                {timeSlots.map((time, index) => {
                  // Check if this time slot has appointments
                  const timeHour = parseInt(time.split(':')[0] || '0');
                  const timeMinute = parseInt(time.split(':')[1] || '0');
                  const slotAppointments = dayAppointments.filter((apt) => {
                    const startHour = parseInt(
                      apt.start_time.split(':')[0] || '0'
                    );
                    const startMinute = parseInt(
                      apt.start_time.split(':')[1] || '0'
                    );
                    const endHour = parseInt(apt.end_time.split(':')[0] || '0');
                    const endMinute = parseInt(
                      apt.end_time.split(':')[1] || '0'
                    );

                    // Check if appointment overlaps with this 30-minute slot
                    const slotStartMinutes = timeHour * 60 + timeMinute;
                    const slotEndMinutes = slotStartMinutes + 30;
                    const aptStartMinutes = startHour * 60 + startMinute;
                    const aptEndMinutes = endHour * 60 + endMinute;

                    return (
                      aptStartMinutes < slotEndMinutes &&
                      aptEndMinutes > slotStartMinutes
                    );
                  });

                  const canCreate = canCreateAppointment(day, shopHours);
                  const canClickTimeSlot =
                    onTimeSlotClick &&
                    slotAppointments.length === 0 &&
                    canCreate;

                  return (
                    <Box
                      key={time}
                      sx={{
                        position: 'absolute',
                        top: index * 40,
                        left: 0,
                        right: 0,
                        height: 40,
                        borderBottom:
                          index % 2 === 1
                            ? `1px solid ${theme.palette.divider}`
                            : 'none',
                        borderTop:
                          index % 2 === 0
                            ? `1px dotted ${alpha(theme.palette.divider, 0.5)}`
                            : 'none',
                        cursor: canClickTimeSlot ? 'pointer' : 'default',
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
                            zIndex: 1,
                          }}
                        >
                          <AddIcon fontSize="small" color="action" />
                          <Typography variant="caption" color="text.secondary">
                            Add appointment
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  );
                })}

                {/* Appointments */}
                {arrangedAppointments.map((appointment) => {
                  const startHour = parseInt(
                    appointment.start_time.split(':')[0] || '0'
                  );
                  const startMinute = parseInt(
                    appointment.start_time.split(':')[1] || '0'
                  );
                  const endHour = parseInt(
                    appointment.end_time.split(':')[0] || '0'
                  );
                  const endMinute = parseInt(
                    appointment.end_time.split(':')[1] || '0'
                  );

                  const top =
                    ((startHour - gridStartHour) * 60 + startMinute) *
                    (40 / 30); // 40px per 30 minutes
                  const height =
                    ((endHour - startHour) * 60 + (endMinute - startMinute)) *
                    (40 / 30);
                  const width = 100 / appointment.totalColumns;
                  const left = appointment.column * width;

                  return (
                    <Tooltip
                      key={appointment.id}
                      title={
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {appointment.title}
                          </Typography>
                          <Typography variant="caption" display="block">
                            {formatTime(appointment.start_time)} -{' '}
                            {formatTime(appointment.end_time)}
                          </Typography>
                          {appointment.client && (
                            <Typography variant="caption" display="block">
                              {appointment.client.first_name}{' '}
                              {appointment.client.last_name}
                            </Typography>
                          )}
                          {appointment.notes && (
                            <Typography
                              variant="caption"
                              display="block"
                              sx={{ mt: 0.5 }}
                            >
                              {appointment.notes}
                            </Typography>
                          )}
                        </Box>
                      }
                      placement="right"
                      arrow
                    >
                      <Paper
                        elevation={2}
                        sx={{
                          position: 'absolute',
                          top: `${top}px`,
                          left: `${left}%`,
                          width: `calc(${width}% - 4px)`,
                          height: `${Math.max(height, 30)}px`,
                          bgcolor: getAppointmentColor(appointment.type),
                          color: 'white',
                          p: 1,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          zIndex: 2,
                          transition: 'all 0.2s',
                          '&:hover': {
                            zIndex: 3,
                            transform: 'scale(1.02)',
                            boxShadow: theme.shadows[6],
                          },
                        }}
                        onClick={() => onAppointmentClick?.(appointment)}
                      >
                        <Stack spacing={0.5}>
                          <Typography variant="caption" fontWeight="bold">
                            {formatTime(appointment.start_time)}
                          </Typography>
                          <Typography
                            variant="body2"
                            fontWeight="medium"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {appointment.title}
                          </Typography>
                          {height > 60 && appointment.client && (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 20,
                                  height: 20,
                                  fontSize: '0.75rem',
                                  bgcolor: alpha(
                                    theme.palette.common.white,
                                    0.3
                                  ),
                                }}
                              >
                                {appointment.client.first_name[0]}
                              </Avatar>
                              <Typography
                                variant="caption"
                                sx={{
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {appointment.client.first_name}{' '}
                                {appointment.client.last_name}
                              </Typography>
                            </Box>
                          )}
                          {height > 80 && (
                            <Chip
                              label={appointment.type.replace('_', ' ')}
                              size="small"
                              sx={{
                                height: 20,
                                bgcolor: alpha(theme.palette.common.white, 0.2),
                                color: 'white',
                              }}
                            />
                          )}
                        </Stack>
                      </Paper>
                    </Tooltip>
                  );
                })}

                {/* Current time indicator */}
                {isToday(day) &&
                  currentTimePosition >= 0 &&
                  currentTimePosition <= 100 && (
                    <Box
                      data-testid="current-time-indicator"
                      sx={{
                        position: 'absolute',
                        top: `${currentTimePosition}%`,
                        left: 0,
                        right: 0,
                        height: 2,
                        bgcolor: 'error.main',
                        zIndex: 4,
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: -6,
                          top: -4,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          bgcolor: 'error.main',
                        },
                      }}
                    />
                  )}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
