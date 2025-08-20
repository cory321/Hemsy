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
} from '@mui/icons-material';

interface NextAppointmentCardProps {
  time: string;
  clientName: string;
  service: string;
  onCall?: () => void;
  onLocation?: () => void;
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
  time,
  clientName,
  service,
  onCall,
  onLocation,
}: NextAppointmentCardProps) {
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
        {time}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
        {clientName}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: refinedColors.text.secondary, mb: 2 }}
      >
        {service}
      </Typography>
      <Stack direction="row" spacing={1}>
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
      </Stack>
    </Paper>
  );
}
