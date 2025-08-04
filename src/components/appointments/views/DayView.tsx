'use client';

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
import { format } from 'date-fns';
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
    const [startHour, startMinute] = appointment.start_time
      .split(':')
      .map(Number);
    // Round down to nearest 30-minute slot
    const slotMinute = startMinute < 30 ? '00' : '30';
    const timeSlotKey = `${startHour.toString().padStart(2, '0')}:${slotMinute}`;

    if (!appointmentsByTimeSlot.has(timeSlotKey)) {
      appointmentsByTimeSlot.set(timeSlotKey, []);
    }
    appointmentsByTimeSlot.get(timeSlotKey)?.push(appointment);
  });

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
            No appointments scheduled for {format(currentDate, 'MMMM d, yyyy')}
          </Typography>
        </Paper>
      )}

      {/* Time grid with appointments */}
      <Box>
        {timeSlots.map((time) => {
          const slotAppointments = appointmentsByTimeSlot.get(time) || [];

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
                        bgcolor: getAppointmentColor(appointment.type),
                        color: 'white',
                        p: 2,
                        mb: 1,
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: theme.shadows[4],
                        },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick?.(appointment);
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight="bold">
                        {appointment.title}
                      </Typography>

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          mt: 0.5,
                        }}
                      >
                        <AccessTimeIcon sx={{ fontSize: 16 }} />
                        <Typography variant="caption">
                          {formatTime(appointment.start_time)} -{' '}
                          {formatTime(appointment.end_time)} (
                          {formatDuration(duration)})
                        </Typography>
                      </Box>

                      {appointment.client_id && (
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mt: 0.5,
                          }}
                        >
                          <PersonIcon sx={{ fontSize: 16 }} />
                          <Typography variant="caption">
                            {appointment.client?.first_name}{' '}
                            {appointment.client?.last_name}
                          </Typography>
                        </Box>
                      )}

                      <Chip
                        label={appointment.type.replace('_', ' ')}
                        size="small"
                        sx={{
                          mt: 1,
                          bgcolor: alpha(theme.palette.common.white, 0.2),
                          color: 'white',
                        }}
                      />
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
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
