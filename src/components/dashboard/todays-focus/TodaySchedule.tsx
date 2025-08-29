'use client';

import { Stack, Box, Typography } from '@mui/material';
import { format } from 'date-fns';
import type { Appointment } from '@/types';

interface TodayScheduleProps {
  appointments: Appointment[];
}

const refinedColors = {
  primary: '#5c7f8e',
  text: {
    primary: '#1a1a1a',
    secondary: '#666666',
    tertiary: '#999999',
  },
};

export function TodaySchedule({ appointments }: TodayScheduleProps) {
  return (
    <>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        Today&apos;s Schedule
      </Typography>
      <Stack spacing={2}>
        {appointments.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ color: refinedColors.text.tertiary, fontStyle: 'italic' }}
          >
            No appointments scheduled for today
          </Typography>
        ) : (
          appointments.map((apt) => {
            // Format time from 24-hour to 12-hour format
            const timeFormatted = format(
              new Date(`1970-01-01T${apt.start_time}`),
              'h:mm a'
            );
            const clientName = apt.client
              ? `${apt.client.first_name} ${apt.client.last_name}`
              : 'No client assigned';

            // Check if this appointment is currently happening
            const now = new Date();
            const appointmentDate = new Date(apt.date);
            const startTime = new Date(`${apt.date}T${apt.start_time}`);
            const endTime = new Date(`${apt.date}T${apt.end_time}`);
            const isCurrent =
              appointmentDate.toDateString() === now.toDateString() &&
              now >= startTime &&
              now <= endTime;

            return (
              <Stack
                key={apt.id}
                direction="row"
                spacing={2}
                alignItems="center"
              >
                <Box sx={{ minWidth: 65 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isCurrent ? 600 : 400,
                      color: isCurrent
                        ? refinedColors.primary
                        : refinedColors.text.secondary,
                    }}
                  >
                    {timeFormatted}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">{clientName}</Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: refinedColors.text.tertiary,
                      textTransform: 'capitalize',
                    }}
                  >
                    {apt.type}
                  </Typography>
                </Box>
              </Stack>
            );
          })
        )}
      </Stack>
    </>
  );
}
