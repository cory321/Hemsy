'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Button,
  Alert,
  CircularProgress,
  Box,
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import { z } from 'zod';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Tables } from '@/types/supabase';
import { createClient } from '@/lib/actions/clients';

const clientSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone_number: z.string().min(10, 'Phone number must be at least 10 digits'),
  accept_email: z.boolean().default(true),
  accept_sms: z.boolean().default(false),
  notes: z.string().optional(),
  mailing_address: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

export interface ClientCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (client: Tables<'clients'>) => void;
}

export default function ClientCreateDialog({
  open,
  onClose,
  onCreated,
}: ClientCreateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClientFormData>({
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

  const internalClose = () => {
    reset();
    setError(null);
    onClose();
  };

  const onSubmit = async (data: ClientFormData) => {
    setLoading(true);
    setError(null);

    try {
      const newClient = await createClient({
        ...data,
        notes: data.notes || null,
        mailing_address: data.mailing_address || null,
      });
      onCreated(newClient);
      internalClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={internalClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ component: 'form', onSubmit: handleSubmit(onSubmit) }}
    >
      <DialogTitle>Add New Client</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
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
            <Typography variant="h6" gutterBottom>
              Communication Preferences*
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mb: 1 }}
            >
              *By checking the Email and SMS boxes I confirm that the client has
              agreed to receive SMS or email notifications regarding appointment
              reminders and other notifications. Message and data rates may
              apply. The client can reply STOP to opt-out from SMS at any time.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="accept_email"
              control={control}
              render={({ field: { value, onChange } }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={value}
                      onChange={(e) => onChange(e.target.checked)}
                    />
                  }
                  label="Accept Email Communications"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Controller
              name="accept_sms"
              control={control}
              render={({ field: { value, onChange } }) => (
                <FormControlLabel
                  control={
                    <Switch
                      checked={value}
                      onChange={(e) => onChange(e.target.checked)}
                    />
                  }
                  label="Accept SMS Communications"
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Additional Information
            </Typography>
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
                  placeholder={'123 Main St\nCity, State 12345'}
                  error={!!errors.mailing_address}
                  helperText={errors.mailing_address?.message}
                />
              )}
            />
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
                  rows={3}
                  placeholder="Any additional notes about this client..."
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                />
              )}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={internalClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : undefined}
        >
          {loading ? 'Creating...' : 'Create Client'}
        </Button>
      </DialogActions>
      {/* spacing to prevent content jump during loading */}
      {loading && (
        <Box sx={{ height: 0, overflow: 'hidden' }} aria-hidden="true" />
      )}
    </Dialog>
  );
}
