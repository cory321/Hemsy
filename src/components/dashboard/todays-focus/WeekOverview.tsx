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
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  ArrowForward as ArrowForwardIcon,
  CalendarMonth as CalendarIcon,
  Inventory2 as InventoryIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { formatDateForDatabase } from '@/lib/utils/date-time-utils';
import type { WeekDayData, WeekSummaryStats } from '@/lib/actions/dashboard';

interface WeekOverviewProps {
  weekData?: WeekDayData[];
  summaryStats?: WeekSummaryStats;
}

const refinedColors = {
  primary: '#5c7f8e',
  warning: '#F3C164',
  error: '#d32f2f',
  success: '#5A736C',
  text: {
    primary: '#1a1a1a',
    secondary: '#666666',
    tertiary: '#999999',
  },
};

// Default week data for loading/error states
function generateDefaultWeekData(): WeekDayData[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);

  const weekData: WeekDayData[] = [];
  const currentDate = new Date(startOfWeek);

  for (let i = 0; i < 7; i++) {
    const dateString = formatDateForDatabase(currentDate);
    weekData.push({
      date: currentDate.getDate(),
      dayOfWeek: currentDate.getDay(),
      fullDate: dateString, // formatDateForDatabase always returns a string
      appointments: 0,
      garmentsDue: 0,
      isToday: currentDate.toDateString() === today.toDateString(),
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return weekData;
}

export function WeekOverview({
  weekData = generateDefaultWeekData(),
  summaryStats = { totalAppointments: 0, totalGarmentsDue: 0, totalOverdue: 0 },
}: WeekOverviewProps) {
  const router = useRouter();

  const handleViewCalendar = () => {
    router.push('/appointments');
  };

  const handleDateClick = (date: string | undefined) => {
    if (!date) return;
    // Navigate to appointments page with day view and specific date
    router.push(`/appointments?view=day&date=${date}`);
  };

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
          onClick={handleViewCalendar}
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
                onClick={() => handleDateClick(dayData.fullDate)}
                sx={{
                  position: 'relative',
                  aspectRatio: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: dayData.isToday
                    ? alpha(refinedColors.primary, 0.1)
                    : dayData.appointments + dayData.garmentsDue > 0
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

                {/* Activity indicators - dots for appointments and garments due */}
                {(dayData.appointments > 0 || dayData.garmentsDue > 0) && (
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
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          bgcolor: refinedColors.primary,
                        }}
                      />
                    )}
                    {dayData.garmentsDue > 0 && (
                      <Box
                        sx={{
                          width: 5,
                          height: 5,
                          borderRadius: '50%',
                          bgcolor: refinedColors.warning,
                        }}
                      />
                    )}
                  </Stack>
                )}

                {/* Appointments count on hover */}
                {dayData.appointments > 0 && (
                  <Tooltip
                    title={`${dayData.appointments} appointment${dayData.appointments !== 1 ? 's' : ''}`}
                    placement="top"
                    arrow
                  >
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
                      {dayData.appointments}
                    </Box>
                  </Tooltip>
                )}
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Week Summary Stats */}
      <Stack spacing={2}>
        {/* Appointments */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            border: `1px solid ${alpha(refinedColors.primary, 0.2)}`,
            borderRadius: 2,
            bgcolor: alpha(refinedColors.primary, 0.02),
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <CalendarIcon
                sx={{ fontSize: 18, color: refinedColors.primary }}
              />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Appointments
              </Typography>
            </Stack>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: refinedColors.primary }}
            >
              {summaryStats.totalAppointments}
            </Typography>
          </Stack>
        </Paper>

        {/* Overdue Garments - Only show if there are overdue items */}
        {summaryStats.totalOverdue > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: `1px solid ${alpha(refinedColors.error, 0.2)}`,
              borderRadius: 2,
              bgcolor: alpha(refinedColors.error, 0.02),
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <WarningIcon
                  sx={{ fontSize: 18, color: refinedColors.error }}
                />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Overdue garments
                </Typography>
              </Stack>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: refinedColors.error }}
              >
                {summaryStats.totalOverdue}
              </Typography>
            </Stack>
          </Paper>
        )}

        {/* Due Dates - Only show if there are garments due this week */}
        {summaryStats.totalGarmentsDue > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: `1px solid ${alpha(refinedColors.warning, 0.2)}`,
              borderRadius: 2,
              bgcolor: alpha(refinedColors.warning, 0.02),
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <InventoryIcon
                  sx={{ fontSize: 18, color: refinedColors.warning }}
                />
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Garments due this week
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="baseline" spacing={1}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: refinedColors.warning }}
                >
                  {summaryStats.totalGarmentsDue}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: refinedColors.text.tertiary }}
                ></Typography>
              </Stack>
            </Stack>
          </Paper>
        )}
      </Stack>
    </>
  );
}
