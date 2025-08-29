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
import type { Appointment } from '@/types';

interface NextAppointmentCardProps {
  appointment: Appointment | null;
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
};

export function NextAppointmentCard({
  appointment,
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
          Next appointment
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

  // Format time based on whether appointment is today or in the future
  const appointmentDate = new Date(
    `${appointment.date}T${appointment.start_time}`
  );
  const today = new Date();
  const isToday = appointmentDate.toDateString() === today.toDateString();

  const timeFormatted = isToday
    ? format(new Date(`1970-01-01T${appointment.start_time}`), 'h:mm a')
    : (() => {
        // Format as "Tue, Oct 8 • 2:30 PM" for future dates
        const dayName = appointmentDate.toLocaleDateString('en-US', {
          weekday: 'short',
        });
        const monthDay = appointmentDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        const time = appointmentDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        return `${dayName}, ${monthDay} • ${time}`;
      })();

  const clientName = appointment.client
    ? `${appointment.client.first_name} ${appointment.client.last_name}`
    : 'No client assigned';

  return (
    <Paper
      sx={{
        p: 2,
        bgcolor: alpha(refinedColors.primary, 0.05),
        border: `1px solid ${alpha(refinedColors.primary, 0.2)}`,
        mb: 3,
      }}
    >
      <Typography
        variant="overline"
        sx={{ color: refinedColors.text.tertiary }}
      >
        Next appointment
      </Typography>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          color: refinedColors.primary,
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
                bgcolor: refinedColors.primary,
                '&:hover': {
                  bgcolor: alpha(refinedColors.primary, 0.8),
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
                bgcolor: refinedColors.primary,
                '&:hover': {
                  bgcolor: alpha(refinedColors.primary, 0.8),
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
                borderColor: refinedColors.primary,
                color: refinedColors.primary,
                '&:hover': {
                  borderColor: alpha(refinedColors.primary, 0.8),
                  bgcolor: alpha(refinedColors.primary, 0.04),
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
