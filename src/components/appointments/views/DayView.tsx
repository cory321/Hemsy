'use client';

import { useState, useEffect } from 'react';
import { useInterval } from '@/lib/hooks/useInterval';
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
  isPastDateTime,
  canCreateAppointmentAt,
} from '@/lib/utils/calendar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { Appointment } from '@/types';
import { useAppointmentsDisplay } from '@/hooks/useAppointmentDisplay';

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
  focusAppointmentId?: string;
}

export function DayView({
  currentDate,
  appointments,
  shopHours,
  onAppointmentClick,
  onTimeSlotClick,
  focusAppointmentId,
}: DayViewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const SLOT_HEIGHT_PX = 80; // 30-minute slot height (ensures 15-min blocks are readable)

  // State to track current time for the indicator
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every 5 minutes with automatic cleanup
  useInterval(
    () => setCurrentTime(new Date()),
    5 * 60 * 1000, // 5 minutes
    false // Don't run immediately
  );

  // Convert appointments to display format with timezone support
  const { appointments: displayAppointments } =
    useAppointmentsDisplay(appointments);

  // Filter appointments for current date
  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const dayAppointments = displayAppointments
    .filter((apt) => apt.displayDate === dateStr)
    .sort((a, b) => a.displayStartTime.localeCompare(b.displayStartTime));
  // Scroll focused appointment into view on mount/update
  useEffect(() => {
    if (!focusAppointmentId) return;
    const el = document.querySelector(
      `[data-appointment-id="${focusAppointmentId}"]`
    ) as HTMLElement | null;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusAppointmentId, dateStr]);

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

  // Helper: check if an appointment overlaps a 30-minute slot starting at `time`
  const getOverlappingAppointmentsForSlot = (time: string): Appointment[] => {
    const [slotHourStr, slotMinuteStr] = time.split(':');
    const slotHour = parseInt(slotHourStr || '0', 10);
    const slotMinute = parseInt(slotMinuteStr || '0', 10);
    const slotStartMinutes = slotHour * 60 + slotMinute;
    const slotEndMinutes = slotStartMinutes + 30;

    return dayAppointments.filter((apt) => {
      const [sH, sM] = apt.displayStartTime.split(':');
      const [eH, eM] = apt.displayEndTime.split(':');
      const aptStart = parseInt(sH || '0', 10) * 60 + parseInt(sM || '0', 10);
      const aptEnd = parseInt(eH || '0', 10) * 60 + parseInt(eM || '0', 10);
      return aptStart < slotEndMinutes && aptEnd > slotStartMinutes;
    });
  };

  // Calculate current time indicator position
  const currentHour = currentTime.getHours();
  const currentMinute = currentTime.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinute;
  const isCurrentDay = isToday(currentDate);

  // Determine displayed range in minutes based on generated time slots
  const displayedStartMinutes = shopStartHour * 60;
  // Last slot starts at `${shopEndHour}:00` and spans 30 minutes
  const displayedEndMinutesExclusive = shopEndHour * 60 + 30;

  // Show indicator only on current day when shop is not closed and within displayed minutes
  const showCurrentTimeIndicator =
    isCurrentDay &&
    !!todayHours &&
    !todayHours.is_closed &&
    currentTimeMinutes >= displayedStartMinutes &&
    currentTimeMinutes < displayedEndMinutesExclusive;

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
        {timeSlots.map((time) => {
          const slotAppointments = getOverlappingAppointmentsForSlot(time);
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
                height: SLOT_HEIGHT_PX,
                borderBottom: `1px solid ${theme.palette.divider}`,
                cursor:
                  onTimeSlotClick &&
                  slotAppointments.length === 0 &&
                  canCreate &&
                  !isPastDateTime(currentDate, time)
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
                  canCreate &&
                  !isPastDateTime(currentDate, time)
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
                  slotAppointments.length === 0 &&
                  !isPastDateTime(currentDate, time)
                ) {
                  onTimeSlotClick(currentDate, time);
                }
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  width: 80,
                  flexShrink: 0,
                  px: 2,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {formatTime(time)}
              </Typography>
              <Box sx={{ flex: 1, position: 'relative', pr: 2 }} />

              {/* Add appointment hint for empty slots (cover the full block area) */}
              {onTimeSlotClick &&
                !isMobile &&
                canCreate &&
                slotAppointments.length === 0 &&
                !isPastDateTime(currentDate, time) && (
                  <Box
                    className="add-appointment-hint"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.5,
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      pointerEvents: 'none',
                      position: 'absolute',
                      top: 0,
                      left: '96px', // 80px label + 16px padding
                      right: '16px',
                      bottom: 0,
                      height: '100%',
                      zIndex: 0,
                    }}
                  >
                    <AddIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      Add
                    </Typography>
                  </Box>
                )}

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

        {/* Overlay absolute-positioned appointments spanning across slots */}
        {dayAppointments.map((appointment) => {
          const startParts = appointment.start_time.split(':');
          const startHour = parseInt(startParts[0] || '0', 10);
          const startMinute = parseInt(startParts[1] || '0', 10);
          const endParts = appointment.end_time.split(':');
          const endHour = parseInt(endParts[0] || '0', 10);
          const endMinute = parseInt(endParts[1] || '0', 10);
          const topPx =
            ((startHour - shopStartHour) * 60 + startMinute) *
            (SLOT_HEIGHT_PX / 30);
          const heightPx =
            ((endHour - startHour) * 60 + (endMinute - startMinute)) *
            (SLOT_HEIGHT_PX / 30);
          const duration = getDurationMinutes(
            appointment.start_time,
            appointment.end_time
          );
          const density =
            heightPx < 48 ? 'compact' : heightPx < 96 ? 'cozy' : 'regular';
          const color = getAppointmentColor(appointment.type);

          return (
            <Paper
              key={appointment.id}
              data-testid={`dayview-appointment-${appointment.id}`}
              data-appointment-id={appointment.id}
              data-focused={
                appointment.id === focusAppointmentId ? 'true' : undefined
              }
              data-top={topPx}
              data-height={heightPx}
              data-density={density}
              elevation={2}
              sx={{
                position: 'absolute',
                top: `${topPx}px`,
                left: '96px', // 80px time label + 16px padding
                right: '16px',
                height: `${heightPx}px`,
                cursor: 'pointer',
                overflow: 'hidden',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                borderLeft: `4px solid ${color}`,
                bgcolor:
                  appointment.id === focusAppointmentId
                    ? alpha(color, 0.2)
                    : alpha(color, 0.06),
                '&:hover': {
                  zIndex: 3,
                  boxShadow: theme.shadows[4],
                  bgcolor:
                    appointment.id === focusAppointmentId
                      ? alpha(color, 0.25)
                      : alpha(color, 0.1),
                },
              }}
              onClick={(e) => {
                e.stopPropagation();
                onAppointmentClick?.(appointment);
              }}
            >
              {/* Content area with progressive disclosure */}
              <Box
                sx={{ position: 'relative', p: 1, flex: 1, overflow: 'hidden' }}
              >
                {/* Status badge */}
                {appointment.status === 'confirmed' && (
                  <CheckCircleIcon
                    sx={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      fontSize: 14,
                      color,
                    }}
                  />
                )}

                {/* Client name */}
                <Typography
                  variant="subtitle2"
                  fontWeight="medium"
                  gutterBottom
                  sx={{
                    color: 'text.primary',
                    mb: 0.25,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {appointment.client
                    ? `${appointment.client.first_name} ${appointment.client.last_name}`
                    : 'No Client'}
                </Typography>

                {/* Time caption always visible */}
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
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    ({formatDuration(duration)})
                  </Typography>
                </Box>

                {/* Type only for larger heights */}
                {density === 'regular' && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      textTransform: 'capitalize',
                      display: 'block',
                      mt: 0.25,
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
    </Box>
  );
}
