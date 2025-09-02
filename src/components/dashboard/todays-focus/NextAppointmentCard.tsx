'use client';

import {
  Paper,
  Typography,
  Stack,
  Button,
  IconButton,
  alpha,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  ContentCopy as CopyIcon,
  Email as EmailIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useResponsive } from '@/hooks/useResponsive';
import { format } from 'date-fns';
import {
  formatTimeForDisplay,
  formatDateTimeForDisplay,
  safeParseDate,
} from '@/lib/utils/date-time-utils';
import type { Appointment } from '@/types';

interface NextAppointmentCardProps {
  appointment: Appointment | null;
  isHappeningNow?: boolean;
  onCall?: () => void;
  onLocation?: () => void;
  onViewDetails?: () => void;
  onViewClient?: () => void;
  onCopyPhone?: () => void;
  onSendEmail?: () => void;
}

const refinedColors = {
  primary: '#5c7f8e',
  text: {
    primary: '#1a1a1a',
    secondary: '#666666',
    tertiary: '#999999',
  },
  happeningNow: {
    main: '#EEBA8C', // In Progress color from garment stages
    hover: '#E5A870', // Darker shade for hover
  },
};

export function NextAppointmentCard({
  appointment,
  isHappeningNow = false,
  onCall,
  onLocation,
  onViewDetails,
  onViewClient,
  onCopyPhone,
  onSendEmail,
}: NextAppointmentCardProps) {
  const { isMobile, isTablet } = useResponsive();
  const isMobileOrTablet = isMobile || isTablet;

  if (!appointment) {
    return (
      <Paper
        sx={{
          p: 2,
          bgcolor: alpha(refinedColors.primary, 0.02),
          border: `1px solid ${alpha(refinedColors.primary, 0.1)}`,
          mb: 3,
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: refinedColors.text.tertiary }}
        >
          {isHappeningNow ? 'Happening Now' : 'Next appointment'}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: refinedColors.text.secondary,
            mt: 1,
            fontStyle: 'italic',
          }}
        >
          No upcoming appointments
        </Typography>
      </Paper>
    );
  }

  // Format time based on whether appointment is happening now, today, or in the future
  const appointmentDate = new Date(
    `${appointment.date}T${appointment.start_time}`
  );
  const today = new Date();
  const isToday = appointmentDate.toDateString() === today.toDateString();

  const timeFormatted = isHappeningNow
    ? (() => {
        // Show time range for happening now appointments
        const startTime = formatTimeForDisplay(appointment.start_time);
        const endTime = appointment.end_time
          ? formatTimeForDisplay(appointment.end_time)
          : startTime; // If no end_time, just show start time
        return appointment.end_time ? `${startTime} - ${endTime}` : startTime;
      })()
    : isToday
      ? formatTimeForDisplay(appointment.start_time)
      : (() => {
          // Format as "Tue, Oct 8 • 2:30 PM" for future dates
          const dayName = format(appointmentDate, 'EEE');
          const monthDay = format(appointmentDate, 'MMM d');
          const time = formatTimeForDisplay(appointment.start_time);
          return `${dayName}, ${monthDay} • ${time}`;
        })();

  const clientName = appointment.client
    ? `${appointment.client.first_name} ${appointment.client.last_name}`
    : 'No client assigned';

  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: isHappeningNow
          ? alpha(refinedColors.happeningNow.main, 0.15)
          : alpha(refinedColors.primary, 0.05),
        border: `2px solid ${
          isHappeningNow
            ? refinedColors.happeningNow.main
            : alpha(refinedColors.primary, 0.2)
        }`,
        mb: 3,
        transition: 'all 0.3s ease',
      }}
    >
      <Typography
        variant="overline"
        sx={{
          color: isHappeningNow
            ? refinedColors.happeningNow.main
            : refinedColors.text.tertiary,
          fontWeight: isHappeningNow ? 600 : 400,
        }}
      >
        {isHappeningNow ? 'Happening Now' : 'Next appointment'}
      </Typography>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          color: isHappeningNow
            ? refinedColors.happeningNow.main
            : refinedColors.primary,
          mb: 1,
        }}
      >
        {timeFormatted}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
        {clientName}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: refinedColors.text.secondary,
          mb: 2,
          textTransform: 'capitalize',
        }}
      >
        {appointment.type}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {isMobileOrTablet ? (
          // Mobile/Tablet: Show call button
          <>
            <Button
              size="small"
              variant="contained"
              startIcon={<PhoneIcon sx={{ fontSize: 16 }} />}
              onClick={onCall}
              sx={{
                bgcolor: isHappeningNow
                  ? refinedColors.happeningNow.main
                  : refinedColors.primary,
                '&:hover': {
                  bgcolor: isHappeningNow
                    ? refinedColors.happeningNow.hover
                    : alpha(refinedColors.primary, 0.8),
                },
              }}
            >
              Call
            </Button>
            <IconButton
              size="small"
              onClick={onLocation}
              sx={{ border: '1px solid #e0e0e0' }}
            >
              <LocationIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </>
        ) : (
          // Desktop: Show desktop-friendly actions
          <>
            <Button
              size="small"
              variant="contained"
              startIcon={<ViewIcon sx={{ fontSize: 16 }} />}
              onClick={onViewDetails}
              sx={{
                bgcolor: isHappeningNow
                  ? refinedColors.happeningNow.main
                  : refinedColors.primary,
                '&:hover': {
                  bgcolor: isHappeningNow
                    ? refinedColors.happeningNow.hover
                    : alpha(refinedColors.primary, 0.8),
                },
              }}
            >
              View Details
            </Button>
            <Button
              size="small"
              variant="outlined"
              startIcon={<PersonIcon sx={{ fontSize: 16 }} />}
              onClick={onViewClient}
              sx={{
                borderColor: isHappeningNow
                  ? refinedColors.happeningNow.main
                  : refinedColors.primary,
                color: isHappeningNow
                  ? refinedColors.happeningNow.main
                  : refinedColors.primary,
                '&:hover': {
                  borderColor: isHappeningNow
                    ? refinedColors.happeningNow.hover
                    : alpha(refinedColors.primary, 0.8),
                  bgcolor: isHappeningNow
                    ? alpha(refinedColors.happeningNow.main, 0.1)
                    : alpha(refinedColors.primary, 0.04),
                },
              }}
            >
              View Client
            </Button>
          </>
        )}
      </Stack>
    </Paper>
  );
}
