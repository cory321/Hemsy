'use client';

import { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  CardContent,
  TextField,
  Grid,
  FormControlLabel,
  Switch,
  Button,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/actions/clients';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const clientSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone_number: z.string().min(10, 'Phone number must be at least 10 digits'),
  accept_email: z.boolean(),
  accept_sms: z.boolean(),
  notes: z.string().optional(),
  mailing_address: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

export default function NewClientPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ClientFormData>({
    mode: 'onChange',
    resolver: zodResolver(clientSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      accept_email: true,
      accept_sms: false,
      notes: '',
      mailing_address: '',
    },
  });

  const emailValue = watch('email');
  const phoneValue = watch('phone_number');
  const emailToggleDisabled =
    !(emailValue && emailValue.length > 0) || !!errors.email;
  const smsToggleDisabled =
    !(phoneValue && phoneValue.length > 0) || !!errors.phone_number;

  const onSubmit = async (data: ClientFormData) => {
    setLoading(true);
    setError(null);

    try {
      const newClient = await createClient({
        ...data,
        notes: data.notes || null,
        mailing_address: data.mailing_address || null,
      });

      router.push(`/clients/${newClient.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    router.push('/clients');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            component={Link}
            href="/clients"
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 2 }}
          >
            Back to Clients
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonAddIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" component="h1">
              Add New Client
            </Typography>
          </Box>
        </Box>

        {/* Form */}
        <Paper elevation={2}>
          <CardContent sx={{ p: 4 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="first_name"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="First Name"
                        fullWidth
                        required
                        error={!!errors.first_name}
                        helperText={errors.first_name?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Controller
                    name="last_name"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Last Name"
                        fullWidth
                        required
                        error={!!errors.last_name}
                        helperText={errors.last_name?.message}
                      />
                    )}
                  />
                </Grid>

                {/* Contact Information */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Contact Information
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Email Address"
                        type="email"
                        fullWidth
                        required
                        error={!!errors.email}
                        helperText={errors.email?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="phone_number"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Phone Number"
                        fullWidth
                        required
                        placeholder="(555) 123-4567"
                        error={!!errors.phone_number}
                        helperText={errors.phone_number?.message}
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="mailing_address"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Mailing Address"
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="123 Main St&#10;City, State 12345"
                        error={!!errors.mailing_address}
                        helperText={errors.mailing_address?.message}
                      />
                    )}
                  />
                </Grid>

                {/* Communication Preferences */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Communication Preferences
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="accept_email"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)}
                            disabled={emailToggleDisabled}
                          />
                        }
                        label="Accept Email Communications"
                      />
                    )}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="accept_sms"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <FormControlLabel
                        control={
                          <Switch
                            checked={value}
                            onChange={(e) => onChange(e.target.checked)}
                            disabled={smsToggleDisabled}
                          />
                        }
                        label="Accept SMS Communications"
                      />
                    )}
                  />
                </Grid>

                {/* Additional Information */}
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Additional Information
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Notes"
                        fullWidth
                        multiline
                        rows={4}
                        placeholder="Any additional notes about this client..."
                        error={!!errors.notes}
                        helperText={errors.notes?.message}
                      />
                    )}
                  />
                </Grid>

                {/* Actions */}
                <Grid item xs={12} sx={{ mt: 3 }}>
                  <Box
                    sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}
                  >
                    <Button
                      onClick={handleCancel}
                      disabled={loading}
                      size="large"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      startIcon={
                        loading ? (
                          <CircularProgress size={20} />
                        ) : (
                          <PersonAddIcon />
                        )
                      }
                      size="large"
                    >
                      {loading ? 'Adding...' : 'Add client'}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Paper>
      </Box>
    </Container>
  );
}
