'use client';

import { Stack, Box, Typography } from '@mui/material';

interface ScheduleItem {
  time: string;
  client: string;
  type: string;
  current?: boolean;
}

interface TodayScheduleProps {
  appointments: ScheduleItem[];
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
        Full Schedule
      </Typography>
      <Stack spacing={2}>
        {appointments.map((apt, index) => (
          <Stack key={index} direction="row" spacing={2} alignItems="center">
            <Box sx={{ minWidth: 65 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: apt.current ? 600 : 400,
                  color: apt.current
                    ? refinedColors.primary
                    : refinedColors.text.secondary,
                }}
              >
                {apt.time}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2">{apt.client}</Typography>
              <Typography
                variant="caption"
                sx={{ color: refinedColors.text.tertiary }}
              >
                {apt.type}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </>
  );
}
