'use client';

import { Box, Typography, Button, Chip, useTheme, alpha } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { format, isSameMonth, isSameDay, isToday } from 'date-fns';
import {
  generateMonthDays,
  getAppointmentColor,
  isShopOpen,
} from '@/lib/utils/calendar';
import { formatTimeForDisplay } from '@/lib/utils/date-time-utils';
import type { Appointment } from '@/types';
import { useAppointmentsDisplay } from '@/hooks/useAppointmentDisplay';

interface MonthViewProps {
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

export function MonthView({
  currentDate,
  appointments,
  shopHours,
  onAppointmentClick,
  onDateClick,
}: MonthViewProps) {
  const theme = useTheme();
  const days = generateMonthDays(currentDate);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

  return (
    <Box>
      {/* Week day headers */}
      <Grid container>
        {weekDays.map((day) => (
          <Grid size="grow" key={day} sx={{ p: 1, textAlign: 'center' }}>
            <Typography
              variant="caption"
              fontWeight="bold"
              color="text.secondary"
            >
              {day}
            </Typography>
          </Grid>
        ))}
      </Grid>

      {/* Calendar days */}
      <Grid container>
        {days.map((day, index) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayAppointments = appointmentsByDate[dateStr] || [];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          const isOpen = isShopOpen(day, shopHours);

          return (
            <Grid size="grow" key={index}>
              <Button
                fullWidth
                sx={{
                  minHeight: { xs: 80, sm: 100 },
                  p: 0.5,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  borderRadius: 0,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor:
                    !isOpen && isCurrentMonth
                      ? alpha(theme.palette.action.disabled, 0.1)
                      : 'background.paper',
                  opacity: isCurrentMonth ? 1 : 0.5,
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
                onClick={() => onDateClick?.(day)}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: isCurrentDay ? 'bold' : 'normal',
                    color: isCurrentDay ? 'primary.main' : 'text.primary',
                    mb: 0.5,
                  }}
                >
                  {format(day, 'd')}
                </Typography>

                {/* Appointment indicators */}
                <Box
                  sx={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.25,
                  }}
                >
                  {dayAppointments.slice(0, 3).map((apt, aptIndex) => (
                    <Box
                      key={apt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick?.(apt);
                      }}
                      sx={{
                        width: '100%',
                        bgcolor: getAppointmentColor(apt.type),
                        color: 'white',
                        px: 0.5,
                        py: 0.25,
                        borderRadius: 0.5,
                        fontSize: '0.65rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        '&:hover': {
                          opacity: 0.8,
                        },
                      }}
                    >
                      {formatTimeForDisplay(apt.displayStartTime)}
                    </Box>
                  ))}
                  {dayAppointments.length > 3 && (
                    <Typography variant="caption" color="text.secondary">
                      +{dayAppointments.length - 3} more
                    </Typography>
                  )}
                </Box>
              </Button>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}
