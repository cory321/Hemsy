'use client';

import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Typography,
  Chip,
  Grid,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import ClientEditDialog from '@/components/clients/ClientEditDialog';
import type { Tables } from '@/types/supabase';
import type { Appointment } from '@/types';

interface ClientProfileCardProps {
  client: Tables<'clients'>;
}

interface ClientStatsCardsProps {
  client: Tables<'clients'>;
  nextAppointment: Appointment | null;
  readyForPickupCount: number;
}

function getInitials(first: string | null, last: string | null) {
  const f = (first ?? '').trim();
  const l = (last ?? '').trim();
  const fi = f ? f[0] : '';
  const li = l ? l[0] : '';
  return `${fi}${li}`.toUpperCase() || '—';
}

function formatAppointmentDateTime(appointment: Appointment | null): string {
  if (!appointment) return 'None scheduled';

  const appointmentDate = new Date(
    `${appointment.date}T${appointment.start_time}`
  );

  // Format as "Tue, Oct 8 • 2:30 PM"
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
}

// Separate component for the stats cards
export function ClientStatsCards({
  client,
  nextAppointment,
  readyForPickupCount,
}: ClientStatsCardsProps) {
  // Static demo stats for UI (replace with real data when wiring up)
  const stats = {
    activeOrders: 3,
    nextAppointment: formatAppointmentDateTime(nextAppointment),
    outstandingBalanceCents: 12500,
    readyForPickup: readyForPickupCount,
  };

  const statCards = [
    {
      title: 'Active Orders',
      value: stats.activeOrders,
      icon: 'ri-shopping-bag-line',
      color: 'primary',
      format: 'number',
    },
    {
      title: 'Outstanding',
      value: stats.outstandingBalanceCents,
      icon: 'ri-money-dollar-circle-line',
      color: stats.outstandingBalanceCents > 0 ? 'error' : 'primary',
      format: 'currency',
    },
    {
      title: 'Ready for Pickup',
      value: stats.readyForPickup,
      icon: 'ri-t-shirt-line',
      color: stats.readyForPickup > 0 ? 'success' : 'primary',
      format: 'number',
    },
    {
      title: 'Next Appointment',
      value: stats.nextAppointment,
      icon: 'ri-calendar-event-line',
      color: 'primary',
      format: 'text',
    },
  ];

  const formatValue = (value: any, format: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value / 100);
      case 'number':
        return value.toString();
      case 'text':
        return value || 'None scheduled';
      default:
        return value;
    }
  };

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {statCards.map((stat, index) => (
        <Grid item xs={6} sm={3} key={index}>
          <Card
            elevation={1}
            sx={{
              height: '100%',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                elevation: 3,
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardContent
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
                py: 2.5,
                px: 2,
                textAlign: 'center',
              }}
            >
              <Box
                sx={(theme) => {
                  const paletteColor =
                    theme.palette[
                      stat.color as 'primary' | 'error' | 'success'
                    ];
                  const colorMain =
                    typeof paletteColor === 'object' && 'main' in paletteColor
                      ? paletteColor.main
                      : theme.palette.primary.main;

                  return {
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: alpha(colorMain, 0.1),
                    color: colorMain,
                    fontSize: 24,
                  };
                }}
              >
                <i className={`ri ${stat.icon}`} />
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: '0.75rem', fontWeight: 500 }}
                >
                  {stat.title}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: stat.format === 'text' ? '0.875rem' : '1.25rem',
                    fontWeight: 600,
                    lineHeight: 1.2,
                    mt: 0.5,
                    color:
                      stat.color === 'error'
                        ? 'error.main'
                        : stat.color === 'success'
                          ? 'success.main'
                          : 'text.primary',
                  }}
                >
                  {formatValue(stat.value, stat.format)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

// Main profile card component - now focused on identity and contact info
export default function ClientProfileCard({ client }: ClientProfileCardProps) {
  const initials = getInitials(client.first_name, client.last_name);
  const fullName = `${client.first_name} ${client.last_name}`.trim();

  return (
    <Card elevation={2}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Profile Identity Section */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            gap: 2,
            pt: 1,
          }}
        >
          <Avatar
            sx={{
              width: 100,
              height: 100,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              fontSize: 36,
              fontWeight: 600,
              boxShadow: (theme) => theme.shadows[3],
            }}
          >
            {initials}
          </Avatar>
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h5"
              component="h2"
              sx={{ fontWeight: 600, mb: 0.5 }}
            >
              {fullName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Client since{' '}
              {client.created_at
                ? new Date(client.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })
                : 'Unknown'}
            </Typography>
          </Box>
        </Box>

        <Divider />

        {/* Contact Information */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600, color: 'text.primary' }}
          >
            Contact Information
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={(theme) => ({
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                })}
              >
                <MailOutlineIcon fontSize="small" />
              </Box>
              <Typography variant="body1" color="text.primary">
                {client.email}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={(theme) => ({
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  color: theme.palette.primary.main,
                })}
              >
                <PhoneOutlinedIcon fontSize="small" />
              </Box>
              <Typography variant="body1" color="text.primary">
                {client.phone_number.replace(
                  /(\d{3})(\d{3})(\d{4})/,
                  '($1) $2-$3'
                )}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Edit Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
          <ClientEditDialog client={client}>
            <Button
              variant="outlined"
              size="large"
              sx={{
                minWidth: 200,
                fontWeight: 500,
              }}
            >
              Edit Client Information
            </Button>
          </ClientEditDialog>
        </Box>
      </CardContent>
    </Card>
  );
}
