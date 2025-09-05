'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Divider,
  Button,
  Collapse,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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
  const [isCollapsed, setIsCollapsed] = useState(group.isCollapsed || false);
  const isToday = dateKey === 'today';
  const isTomorrow = dateKey === 'tomorrow';

  // Don't collapse today or tomorrow
  const canCollapse = !isToday && !isTomorrow && group.appointments.length > 3;

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

        {canCollapse && (
          <IconButton
            size="small"
            onClick={() => setIsCollapsed(!isCollapsed)}
            sx={{
              ml: 1,
              bgcolor: 'background.paper',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
            aria-label={isCollapsed ? 'expand group' : 'collapse group'}
          >
            {isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}
          </IconButton>
        )}
      </Box>

      {/* Appointments */}
      {isCollapsed ? (
        <Box
          sx={{
            py: 2,
            px: 3,
            bgcolor: 'grey.50',
            borderRadius: 1,
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              bgcolor: 'grey.100',
              transform: 'translateX(4px)',
            },
          }}
          onClick={() => setIsCollapsed(false)}
        >
          <Typography variant="body2" color="text.secondary">
            📅 {group.appointments.length} appointment
            {group.appointments.length !== 1 ? 's' : ''} scheduled
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Click to expand
          </Typography>
        </Box>
      ) : (
        <Collapse in={!isCollapsed} timeout={300}>
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
        </Collapse>
      )}
    </Box>
  );
}
