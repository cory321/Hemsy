'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  TextField,
  Button,
  FormControlLabel,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

import {
  getUserEmailSettings,
  updateUserEmailSettings,
} from '@/lib/actions/emails';
import { UserEmailSettingsSchema } from '@/lib/validations/email';
import { useToast } from '@/hooks/useToast';

type FormData = {
  receive_appointment_notifications: boolean;
  email_signature: string;
  reply_to_email: string;
};

export function EmailPreferences() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { showToast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(UserEmailSettingsSchema),
    defaultValues: {
      receive_appointment_notifications: true,
      email_signature: '',
      reply_to_email: '',
    },
  });

  useEffect(() => {
    loadSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getUserEmailSettings();

      if (!result.success) {
        throw new Error(result.error);
      }

      if (result.data) {
        form.reset({
          receive_appointment_notifications:
            result.data.receive_appointment_notifications,
          email_signature: result.data.email_signature || '',
          reply_to_email: result.data.reply_to_email || '',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: FormData) => {
    startTransition(async () => {
      try {
        const result = await updateUserEmailSettings({
          receive_appointment_notifications:
            data.receive_appointment_notifications,
          email_signature: data.email_signature || null,
          reply_to_email: data.reply_to_email || null,
        });

        if (!result.success) {
          throw new Error(result.error);
        }

        showToast('Email preferences saved', 'success');
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : 'Failed to save preferences',
          'error'
        );
      }
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={loadSettings}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Box>
        <Typography variant="h6" gutterBottom>
          Email Preferences
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Notification Settings
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  {...form.register('receive_appointment_notifications')}
                  checked={form.watch('receive_appointment_notifications')}
                />
              }
              label="Receive appointment notification emails"
            />

            <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
              Get notified when appointments are scheduled, rescheduled, or
              confirmed by clients.
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Email Configuration
            </Typography>

            <TextField
              fullWidth
              label="Reply-To Email (Optional)"
              type="email"
              {...form.register('reply_to_email')}
              error={!!form.formState.errors.reply_to_email}
              helperText={
                form.formState.errors.reply_to_email?.message ||
                'Email address where client replies will be sent'
              }
              sx={{ mb: 3 }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Email Signature (Optional)"
              {...form.register('email_signature')}
              error={!!form.formState.errors.email_signature}
              helperText={
                form.formState.errors.email_signature?.message ||
                'Added to the end of all emails (max 500 characters)'
              }
            />
          </CardContent>
        </Card>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isPending || !form.formState.isDirty}
          >
            {isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </Box>
      </Box>
    </form>
  );
}
