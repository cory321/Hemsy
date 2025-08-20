'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Button,
  Alert,
  CircularProgress,
  FormHelperText,
  Skeleton,
} from '@mui/material';
import {
  getCalendarSettings,
  updateCalendarSettings,
} from '@/lib/actions/calendar-settings';

interface CalendarSettingsProps {
  onSave?: () => void;
}

export function CalendarSettings({ onSave }: CalendarSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [settings, setSettings] = useState({
    buffer_time_minutes: 0,
    default_appointment_duration: 30,
    send_reminders: true,
    reminder_hours_before: 24,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getCalendarSettings();
        setSettings({
          buffer_time_minutes: data.buffer_time_minutes ?? 0,
          default_appointment_duration: data.default_appointment_duration ?? 30,
          send_reminders: data.send_reminders ?? true,
          reminder_hours_before: data.reminder_hours_before ?? 24,
        });
      } catch (err) {
        setError('Failed to load calendar settings');
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      await updateCalendarSettings(settings);
      setSuccess(true);
      onSave?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save calendar settings'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <Skeleton
              variant="rectangular"
              width="100%"
              height={56}
              sx={{ borderRadius: 1 }}
            />
            <Skeleton
              variant="rectangular"
              width="100%"
              height={56}
              sx={{ borderRadius: 1 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Skeleton
                variant="rectangular"
                width={120}
                height={36}
                sx={{ borderRadius: 1 }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Calendar Settings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Calendar settings saved successfully!
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
          {/* Buffer Time */}
          <FormControl fullWidth>
            <InputLabel>Buffer Time Between Appointments</InputLabel>
            <Select
              value={settings.buffer_time_minutes}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  buffer_time_minutes: Number(e.target.value),
                })
              }
              label="Buffer Time Between Appointments"
            >
              <MenuItem value={0}>No buffer</MenuItem>
              <MenuItem value={5}>5 minutes</MenuItem>
              <MenuItem value={10}>10 minutes</MenuItem>
              <MenuItem value={15}>15 minutes</MenuItem>
              <MenuItem value={30}>30 minutes</MenuItem>
              <MenuItem value={45}>45 minutes</MenuItem>
              <MenuItem value={60}>1 hour</MenuItem>
            </Select>
            <FormHelperText>
              Minimum time required between appointments to allow for
              preparation or cleanup
            </FormHelperText>
          </FormControl>

          {/* Default Duration */}
          <FormControl fullWidth>
            <InputLabel>Default Appointment Duration</InputLabel>
            <Select
              value={settings.default_appointment_duration}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  default_appointment_duration: Number(e.target.value),
                })
              }
              label="Default Appointment Duration"
            >
              <MenuItem value={15}>15 minutes</MenuItem>
              <MenuItem value={30}>30 minutes</MenuItem>
              <MenuItem value={45}>45 minutes</MenuItem>
              <MenuItem value={60}>1 hour</MenuItem>
              <MenuItem value={90}>1.5 hours</MenuItem>
              <MenuItem value={120}>2 hours</MenuItem>
            </Select>
            <FormHelperText>
              Default duration when creating new appointments
            </FormHelperText>
          </FormControl>

          {/* Reminders */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.send_reminders}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      send_reminders: e.target.checked,
                    })
                  }
                />
              }
              label="Send Appointment Reminders"
            />

            {settings.send_reminders && (
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Send Reminders</InputLabel>
                <Select
                  value={settings.reminder_hours_before}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      reminder_hours_before: Number(e.target.value),
                    })
                  }
                  label="Send Reminders"
                >
                  <MenuItem value={1}>1 hour before</MenuItem>
                  <MenuItem value={2}>2 hours before</MenuItem>
                  <MenuItem value={4}>4 hours before</MenuItem>
                  <MenuItem value={8}>8 hours before</MenuItem>
                  <MenuItem value={12}>12 hours before</MenuItem>
                  <MenuItem value={24}>24 hours before</MenuItem>
                  <MenuItem value={48}>48 hours before</MenuItem>
                </Select>
                <FormHelperText>
                  Reminders will only be sent if both you and the client have
                  notifications enabled
                </FormHelperText>
              </FormControl>
            )}
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={24} /> : 'Save Settings'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
