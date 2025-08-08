'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Chip,
  useTheme,
  alpha,
  useMediaQuery,
} from '@mui/material';
import { format, isToday } from 'date-fns';
import {
  getAppointmentColor,
  formatTime,
  formatDuration,
  getDurationMinutes,
  isPastDate,
  canCreateAppointment,
} from '@/lib/utils/calendar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { Appointment } from '@/types';

interface DayViewProps {
  currentDate: Date;
  appointments: Appointment[];
  shopHours: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>;
  onAppointmentClick?: (appointment: Appointment) => void;
  onTimeSlotClick?: (date: Date, time?: string) => void;
}

export function DayView({
  currentDate,
  appointments,
  shopHours,
  onAppointmentClick,
  onTimeSlotClick,
}: DayViewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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

  // Filter appointments for current date
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const dayAppointments = appointments
    .filter((apt) => apt.date === dateStr)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  // Get shop hours for current day
  const dayOfWeek = currentDate.getDay();
  const todayHours = shopHours.find((h) => h.day_of_week === dayOfWeek);
  const isOpen = todayHours && !todayHours.is_closed;
  const isPast = isPastDate(currentDate);
  const canCreate = canCreateAppointment(currentDate, shopHours);

  // Generate time slots for the day with 30-minute increments
  const timeSlots = [];
  const shopStartHour = todayHours?.open_time
    ? parseInt(todayHours.open_time.split(':')[0] || '8')
    : 8;
  const shopEndHour = todayHours?.close_time
    ? parseInt(todayHours.close_time.split(':')[0] || '18')
    : 18;

  for (let hour = shopStartHour; hour <= shopEndHour; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    if (hour < shopEndHour) {
      // Don't add :30 slot for the last hour
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
  }

  // Create a map of appointments by their start time slot (30-minute slots)
  const appointmentsByTimeSlot = new Map<string, Appointment[]>();
  dayAppointments.forEach((appointment) => {
    const timeParts = appointment.start_time.split(':');
    const startHour = parseInt(timeParts[0] || '0', 10);
    const startMinute = parseInt(timeParts[1] || '0', 10);
    // Round down to nearest 30-minute slot
    const slotMinute = startMinute < 30 ? '00' : '30';
    const timeSlotKey = `${startHour.toString().padStart(2, '0')}:${slotMinute}`;

    if (!appointmentsByTimeSlot.has(timeSlotKey)) {
      appointmentsByTimeSlot.set(timeSlotKey, []);
    }
    appointmentsByTimeSlot.get(timeSlotKey)?.push(appointment);
  });

  // Calculate current time indicator position
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const isCurrentDay = isToday(currentDate);

  // Check if current time is within shop hours
  const showCurrentTimeIndicator =
    isCurrentDay && currentHour >= shopStartHour && currentHour <= shopEndHour;

  return (
    <Box>
      {/* Shop hours info */}
      {todayHours && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {isPast
                ? `Past date - No appointments can be created`
                : isOpen
                  ? `Open ${formatTime(todayHours.open_time!)} - ${formatTime(todayHours.close_time!)}`
                  : 'Closed'}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* No appointments message */}
      {dayAppointments.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', mb: 2 }}>
          <Typography color="text.secondary">
            No appointments scheduled
          </Typography>
        </Paper>
      )}

      {/* Time grid with appointments */}
      <Box sx={{ position: 'relative' }}>
        {timeSlots.map((time, index) => {
          const slotAppointments = appointmentsByTimeSlot.get(time) || [];
          const slotTimeParts = time.split(':');
          const slotHour = parseInt(slotTimeParts[0] || '0', 10);
          const slotMinute = parseInt(slotTimeParts[1] || '0', 10);

          // Determine if current time indicator should be shown in this slot
          const slotStartMinutes = slotHour * 60 + slotMinute;
          const slotEndMinutes = slotStartMinutes + 30; // 30-minute slots
          const currentTimeMinutes = currentHour * 60 + currentMinute;
          const isCurrentTimeSlot =
            showCurrentTimeIndicator &&
            currentTimeMinutes >= slotStartMinutes &&
            currentTimeMinutes < slotEndMinutes;

          // Calculate position within the slot (0-100%)
          const positionInSlot = isCurrentTimeSlot
            ? ((currentTimeMinutes - slotStartMinutes) / 30) * 100
            : 0;

          return (
            <Box
              key={time}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                minHeight: 40, // Reduced height for 30-minute slots
                borderBottom: `1px solid ${theme.palette.divider}`,
                py: 1,
                cursor:
                  onTimeSlotClick && slotAppointments.length === 0 && canCreate
                    ? 'pointer'
                    : 'default',
                position: 'relative',
                bgcolor: isPast
                  ? alpha(theme.palette.action.disabled, 0.03)
                  : 'inherit',
                '&:hover':
                  onTimeSlotClick &&
                  !isMobile &&
                  slotAppointments.length === 0 &&
                  canCreate
                    ? {
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                        '& .add-appointment-hint': {
                          opacity: 1,
                        },
                      }
                    : undefined,
              }}
              onClick={(e) => {
                // Only handle click if there are no appointments in this slot
                if (
                  onTimeSlotClick &&
                  canCreate &&
                  slotAppointments.length === 0
                ) {
                  onTimeSlotClick(currentDate, time);
                }
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ width: 80, flexShrink: 0, px: 2, pt: 1 }}
              >
                {formatTime(time)}
              </Typography>
              <Box sx={{ flex: 1, position: 'relative', pr: 2 }}>
                {/* Appointments in this time slot */}
                {slotAppointments.map((appointment) => {
                  const duration = getDurationMinutes(
                    appointment.start_time,
                    appointment.end_time
                  );

                  return (
                    <Paper
                      key={appointment.id}
                      elevation={2}
                      sx={{
                        overflow: 'hidden',
                        mb: 1,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          boxShadow: theme.shadows[4],
                          transform: 'translateY(-1px)',
                        },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick?.(appointment);
                      }}
                    >
                      {/* Colored header bar */}
                      <Box
                        sx={{
                          bgcolor: getAppointmentColor(appointment.type),
                          color: 'white',
                          px: 2,
                          py: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ textTransform: 'capitalize' }}
                        >
                          {appointment.type.replace('_', ' ')}
                        </Typography>
                        {appointment.status === 'confirmed' && (
                          <CheckCircleIcon sx={{ fontSize: 18 }} />
                        )}
                      </Box>

                      {/* White content area */}
                      <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                        <Typography
                          variant="subtitle1"
                          fontWeight="medium"
                          gutterBottom
                          sx={{ color: 'text.primary' }}
                        >
                          {appointment.client
                            ? `${appointment.client.first_name} ${appointment.client.last_name}`
                            : 'No Client'}
                        </Typography>

                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            color: 'text.secondary',
                          }}
                        >
                          <AccessTimeIcon sx={{ fontSize: 16 }} />
                          <Typography variant="body2">
                            {formatTime(appointment.start_time)} -{' '}
                            {formatTime(appointment.end_time)}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary' }}
                          >
                            ({formatDuration(duration)})
                          </Typography>
                        </Box>

                        {/* Status text if confirmed */}
                        {appointment.status === 'confirmed' && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'success.main',
                              display: 'block',
                              mt: 0.5,
                            }}
                          >
                            ✓ Client has confirmed this appointment
                          </Typography>
                        )}
                      </Box>
                    </Paper>
                  );
                })}

                {/* Add appointment hint for empty slots */}
                {onTimeSlotClick &&
                  !isMobile &&
                  canCreate &&
                  slotAppointments.length === 0 && (
                    <Box
                      className="add-appointment-hint"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        pointerEvents: 'none',
                        py: 2,
                      }}
                    >
                      <AddIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Add appointment
                      </Typography>
                    </Box>
                  )}
              </Box>

              {/* Current time indicator */}
              {isCurrentTimeSlot && (
                <Box
                  data-testid="current-time-indicator"
                  sx={{
                    position: 'absolute',
                    top: `${positionInSlot}%`,
                    left: 0,
                    right: 0,
                    height: 2,
                    bgcolor: 'error.main',
                    zIndex: 5,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 70, // Position after the time label
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
  );
}
