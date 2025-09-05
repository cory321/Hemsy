'use client';

import { Box, Typography, Divider } from '@mui/material';
import type { AppointmentGroup } from '@/lib/utils/appointment-grouping';
import type { Appointment } from '@/types';
import { AppointmentCardV2 } from './AppointmentCardV2';

interface AppointmentTimelineGroupProps {
  dateKey: string;
  group: AppointmentGroup;
  shopId: string;
  shopHours?: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>;
  calendarSettings?: {
    buffer_time_minutes: number;
    default_appointment_duration: number;
  };
  existingAppointments?: Appointment[];
}

export function AppointmentTimelineGroup({
  dateKey,
  group,
  shopId,
  shopHours,
  calendarSettings,
  existingAppointments,
}: AppointmentTimelineGroupProps) {
  // Always show appointments expanded - no collapsing functionality
  const isCollapsed = false;
  const isToday = dateKey === 'today';
  const isTomorrow = dateKey === 'tomorrow';

  // Disable collapse functionality - always show appointments
  const canCollapse = false;

  return (
    <Box>
      {/* Date Group Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          mb: 2,
          position: 'relative',
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            color: isToday ? 'primary.main' : 'text.secondary',
            fontWeight: isToday ? 700 : 600,
            letterSpacing: 0.5,
            pr: 2,
            bgcolor: 'background.paper',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {group.label}
        </Typography>

        <Divider
          sx={{
            flex: 1,
            borderColor: isToday ? 'primary.main' : 'divider',
            opacity: isToday ? 0.3 : 0.2,
          }}
        />
      </Box>

      {/* Appointments - Always Expanded */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          mb: 2,
        }}
      >
        {group.appointments.map((appointment) => (
          <AppointmentCardV2
            key={appointment.id}
            appointment={appointment}
            shopId={shopId}
            isToday={isToday}
            shopHours={shopHours || []}
            calendarSettings={
              calendarSettings || {
                buffer_time_minutes: 0,
                default_appointment_duration: 30,
              }
            }
            existingAppointments={existingAppointments || []}
          />
        ))}
      </Box>
    </Box>
  );
}
