'use client';

import React from 'react';
import {
  Box,
  Stack,
  Typography,
  Button,
  Paper,
  LinearProgress,
  alpha,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  ArrowForward as ArrowForwardIcon,
  CalendarMonth as CalendarIcon,
  Inventory2 as InventoryIcon,
} from '@mui/icons-material';

interface DayData {
  date: number;
  appointments: number;
  tasks: number;
  isToday?: boolean;
}

interface WeekOverviewProps {
  weekData?: DayData[];
  onViewCalendar?: () => void;
}

const refinedColors = {
  primary: '#5c7f8e',
  warning: '#F3C164',
  success: '#5A736C',
  text: {
    primary: '#1a1a1a',
    secondary: '#666666',
    tertiary: '#999999',
  },
};

// Default week data for static UI
const defaultWeekData: DayData[] = [
  { date: 17, appointments: 0, tasks: 0 },
  { date: 18, appointments: 2, tasks: 1 },
  { date: 19, appointments: 4, tasks: 2, isToday: true },
  { date: 20, appointments: 3, tasks: 2 },
  { date: 21, appointments: 2, tasks: 1 },
  { date: 22, appointments: 1, tasks: 2 },
  { date: 23, appointments: 0, tasks: 0 },
];

export function WeekOverview({
  weekData = defaultWeekData,
  onViewCalendar,
}: WeekOverviewProps) {
  return (
    <>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 3 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          This Week
        </Typography>
        <Button
          size="small"
          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
          sx={{ color: refinedColors.primary }}
          onClick={onViewCalendar}
        >
          Full calendar
        </Button>
      </Stack>

      {/* Week at a Glance - Enhanced Visual Design */}
      <Box sx={{ mb: 3 }}>
        {/* Day headers */}
        <Grid container spacing={0.5} sx={{ mb: 1 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
            (day, index) => (
              <Grid size="grow" key={index}>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: refinedColors.text.tertiary,
                    fontSize: '0.65rem',
                  }}
                >
                  {day}
                </Typography>
              </Grid>
            )
          )}
        </Grid>

        {/* Date cells */}
        <Grid container spacing={0.5}>
          {weekData.map((dayData, index) => (
            <Grid size="grow" key={index}>
              <Paper
                sx={{
                  position: 'relative',
                  aspectRatio: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: dayData.isToday
                    ? alpha(refinedColors.primary, 0.1)
                    : dayData.appointments + dayData.tasks > 0
                      ? alpha(refinedColors.primary, 0.02)
                      : 'transparent',
                  border: dayData.isToday
                    ? `2px solid ${refinedColors.primary}`
                    : '1px solid #e0e0e0',
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: `0 2px 8px ${alpha(refinedColors.primary, 0.15)}`,
                    borderColor: refinedColors.primary,
                  },
                }}
              >
                {/* Date number */}
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: dayData.isToday ? 700 : 500,
                    fontSize: '0.875rem',
                    color: dayData.isToday
                      ? refinedColors.primary
                      : refinedColors.text.primary,
                  }}
                >
                  {dayData.date}
                </Typography>

                {/* Activity indicators */}
                {(dayData.appointments > 0 || dayData.tasks > 0) && (
                  <Stack
                    direction="row"
                    spacing={0.25}
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                  >
                    {dayData.appointments > 0 && (
                      <Box
                        sx={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          bgcolor: refinedColors.primary,
                        }}
                      />
                    )}
                    {dayData.tasks > 0 && (
                      <Box
                        sx={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          bgcolor: refinedColors.warning,
                        }}
                      />
                    )}
                  </Stack>
                )}

                {/* Hover tooltip preview */}
                {(dayData.appointments > 0 || dayData.tasks > 0) && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -1,
                      right: -1,
                      bgcolor: refinedColors.primary,
                      color: 'white',
                      borderRadius: '0 4px 0 8px',
                      px: 0.75,
                      py: 0.25,
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      '.MuiPaper-root:hover &': {
                        opacity: 1,
                      },
                    }}
                  >
                    {dayData.appointments + dayData.tasks}
                  </Box>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Quick Stats with Visual Progress */}
      <Stack spacing={2}>
        {/* Appointments Progress */}
        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 0.5 }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <CalendarIcon
                sx={{ fontSize: 16, color: refinedColors.primary }}
              />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Appointments
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: refinedColors.primary }}
            >
              12
            </Typography>
          </Stack>
          <Box sx={{ position: 'relative' }}>
            <LinearProgress
              variant="determinate"
              value={75}
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: alpha(refinedColors.primary, 0.1),
                '& .MuiLinearProgress-bar': {
                  bgcolor: refinedColors.primary,
                  borderRadius: 2,
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                right: 0,
                top: 6,
                fontSize: '0.625rem',
                color: refinedColors.text.tertiary,
              }}
            >
              75% booked
            </Typography>
          </Box>
        </Box>

        {/* Tasks/Due Dates Progress */}
        <Box>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 0.5 }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <InventoryIcon
                sx={{ fontSize: 16, color: refinedColors.warning }}
              />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Due dates
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              sx={{ fontWeight: 700, color: refinedColors.warning }}
            >
              8
            </Typography>
          </Stack>
          <Box sx={{ position: 'relative' }}>
            <LinearProgress
              variant="determinate"
              value={60}
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: alpha(refinedColors.warning, 0.1),
                '& .MuiLinearProgress-bar': {
                  bgcolor: refinedColors.warning,
                  borderRadius: 2,
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                right: 0,
                top: 6,
                fontSize: '0.625rem',
                color: refinedColors.text.tertiary,
              }}
            >
              3 urgent
            </Typography>
          </Box>
        </Box>

        {/* Available Capacity */}
        <Box
          sx={{
            p: 1.5,
            bgcolor: alpha(refinedColors.success, 0.08),
            borderRadius: 2,
            border: `1px solid ${alpha(refinedColors.success, 0.2)}`,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography
              variant="body2"
              sx={{ color: refinedColors.success, fontWeight: 500 }}
            >
              💡 3 time slots available
            </Typography>
            <Button
              size="small"
              sx={{
                minWidth: 'auto',
                color: refinedColors.success,
                fontSize: '0.75rem',
                px: 1,
              }}
            >
              Book
            </Button>
          </Stack>
        </Box>
      </Stack>

      {/* Upcoming Highlight */}
      <Box
        sx={{
          mt: 2,
          p: 1.5,
          bgcolor: alpha(refinedColors.primary, 0.03),
          borderRadius: 2,
          border: `1px dashed ${alpha(refinedColors.primary, 0.3)}`,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: refinedColors.text.tertiary,
            display: 'block',
            mb: 0.5,
          }}
        >
          Next milestone
        </Typography>
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, color: refinedColors.text.primary }}
        >
          Wedding season prep - 5 gowns
        </Typography>
        <Typography variant="caption" sx={{ color: refinedColors.primary }}>
          Starts Thursday
        </Typography>
      </Box>
    </>
  );
}
