import { notFound } from 'next/navigation';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NotesIcon from '@mui/icons-material/Notes';
import PersonIcon from '@mui/icons-material/Person';
import { getClient } from '@/lib/actions/clients';
import { getShopHours } from '@/lib/actions/shop-hours';
import { getCalendarSettings } from '@/lib/actions/calendar-settings';
import {
  getNextClientAppointment,
  getClientReadyForPickupCount,
} from '@/lib/actions/appointments';
import ClientEditDialog from '@/components/clients/ClientEditDialog';
import ClientDeleteDialog from '@/components/clients/ClientDeleteDialog';
import ClientOrdersSection from '@/components/clients/ClientOrdersSection';
import ClientDetailTabs from '@/components/clients/ClientDetailTabs';
import ClientProfileCard, {
  ClientStatsCards,
} from '@/components/clients/ClientProfileCard';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic';

interface ClientDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({
  params,
}: ClientDetailPageProps) {
  const { id } = await params;

  try {
    const client = await getClient(id);

    if (!client) {
      notFound();
    }

    // Resolve current user's shopId for appointments queries
    const { userId } = await auth();
    if (!userId) {
      notFound();
    }

    const supabase = await createClient();
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (!userData) {
      notFound();
    }

    const { data: shopData } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_user_id', userData.id)
      .single();

    // Fetch shop hours, calendar settings, next appointment, and ready for pickup count
    const [shopHours, calendarSettings, nextAppointment, readyForPickupCount] =
      await Promise.all([
        getShopHours(),
        getCalendarSettings(),
        shopData?.id
          ? getNextClientAppointment(shopData.id, client.id).catch(() => null)
          : Promise.resolve(null),
        shopData?.id
          ? getClientReadyForPickupCount(shopData.id, client.id).catch(() => 0)
          : Promise.resolve(0),
      ]);

    const formatPhoneNumber = (phone: string) => {
      return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    };

    const formatDate = (dateString: string | null) => {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 4,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h4" component="h1">
                Client Details
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <ClientEditDialog client={client}>
                <IconButton color="primary" size="large">
                  <EditIcon />
                </IconButton>
              </ClientEditDialog>
              <ClientDeleteDialog
                clientId={client.id}
                clientName={`${client.first_name} ${client.last_name}`}
              >
                <IconButton color="error" size="large">
                  <DeleteIcon />
                </IconButton>
              </ClientDeleteDialog>
            </Box>
          </Box>

          {/* Two-column layout: Left - client info, Right - tabs (Orders/Appointments) */}
          <Grid container spacing={3}>
            {/* Left column */}
            <Grid item xs={12} md={4}>
              <ClientProfileCard client={client} />

              {/* Preferences */}
              <Box sx={{ mt: 3 }}>
                <Card elevation={2}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Communication Preferences
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label="Email"
                        color={client.accept_email ? 'success' : 'default'}
                        variant={client.accept_email ? 'filled' : 'outlined'}
                        icon={<EmailIcon />}
                      />
                      <Chip
                        label="SMS"
                        color={client.accept_sms ? 'success' : 'default'}
                        variant={client.accept_sms ? 'filled' : 'outlined'}
                        icon={<PhoneIcon />}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              {/* Mailing Address */}
              {client.mailing_address && (
                <Box sx={{ mt: 3 }}>
                  <Card elevation={2}>
                    <CardContent>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <LocationOnIcon color="primary" />
                        Mailing Address
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      <Typography
                        variant="body1"
                        sx={{ whiteSpace: 'pre-line' }}
                      >
                        {client.mailing_address}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {/* Notes */}
              {client.notes && (
                <Box sx={{ mt: 3 }}>
                  <Card elevation={2}>
                    <CardContent>
                      <Typography
                        variant="h6"
                        gutterBottom
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <NotesIcon color="primary" />
                        Notes
                      </Typography>
                      <Divider sx={{ mb: 2 }} />

                      <Typography
                        variant="body1"
                        sx={{ whiteSpace: 'pre-line' }}
                      >
                        {client.notes}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {/* Timestamps */}
              <Box sx={{ mt: 3 }}>
                <Card elevation={1} sx={{ bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Record Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Created
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(client.created_at)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Last Updated
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(client.updated_at)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Box>
            </Grid>

            {/* Right column */}
            <Grid item xs={12} md={8}>
              {/* Client Stats Cards - positioned above tabs */}
              <ClientStatsCards
                client={client}
                nextAppointment={nextAppointment}
                readyForPickupCount={readyForPickupCount}
              />

              {shopData?.id ? (
                <ClientDetailTabs
                  clientId={client.id}
                  clientName={`${client.first_name} ${client.last_name}`}
                  clientEmail={client.email}
                  clientPhone={client.phone_number}
                  clientAcceptEmail={client.accept_email ?? false}
                  clientAcceptSms={client.accept_sms ?? false}
                  shopId={shopData.id}
                  shopHours={shopHours.map((hour) => ({
                    day_of_week: hour.day_of_week,
                    open_time: hour.open_time,
                    close_time: hour.close_time,
                    is_closed: hour.is_closed ?? false,
                  }))}
                  calendarSettings={{
                    buffer_time_minutes:
                      calendarSettings.buffer_time_minutes ?? 0,
                    default_appointment_duration:
                      calendarSettings.default_appointment_duration ?? 30,
                  }}
                />
              ) : (
                <ClientOrdersSection
                  clientId={client.id}
                  clientName={`${client.first_name} ${client.last_name}`}
                />
              )}
            </Grid>
          </Grid>
        </Box>
      </Container>
    );
  } catch (error) {
    console.error('Error fetching client:', error);
    notFound();
  }
}
