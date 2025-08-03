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
import ClientEditDialog from '@/components/clients/ClientEditDialog';
import ClientDeleteDialog from '@/components/clients/ClientDeleteDialog';

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

    const formatPhoneNumber = (phone: string) => {
      return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    };

    const formatDate = (dateString: string) => {
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
              <PersonIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              <Typography variant="h4" component="h1">
                {client.first_name} {client.last_name}
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

          {/* Client Information */}
          <Grid container spacing={3}>
            {/* Contact Information */}
            <Grid item xs={12} md={6}>
              <Card elevation={2}>
                <CardContent>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <EmailIcon color="primary" />
                    Contact Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <EmailIcon sx={{ color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body1">{client.email}</Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <PhoneIcon sx={{ color: 'text.secondary' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography variant="body1">
                          {formatPhoneNumber(client.phone_number)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Preferences */}
            <Grid item xs={12} md={6}>
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
            </Grid>

            {/* Mailing Address */}
            {client.mailing_address && (
              <Grid item xs={12} md={6}>
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

                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                      {client.mailing_address}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Notes */}
            {client.notes && (
              <Grid item xs={12} md={client.mailing_address ? 6 : 12}>
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

                    <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                      {client.notes}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Timestamps */}
            <Grid item xs={12}>
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
