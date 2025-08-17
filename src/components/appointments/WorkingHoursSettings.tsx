'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  FormControlLabel,
  Switch,
  Button,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { getShopHours, updateShopHours } from '@/lib/actions/shop-hours';
import { DAYS_OF_WEEK } from '@/lib/utils/calendar';

interface WorkingHoursSettingsProps {
  onSave?: () => void;
}

interface DayHours {
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
}

export function WorkingHoursSettings({ onSave }: WorkingHoursSettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hours, setHours] = useState<DayHours[]>([]);

  // Initialize with default hours for all days
  useEffect(() => {
    async function loadHours() {
      try {
        const data = await getShopHours();

        // Create a full week of hours, using existing data or defaults
        const fullWeek = DAYS_OF_WEEK.map((_, index) => {
          const existing = data.find((h) => h.day_of_week === index);
          if (existing) {
            return {
              day_of_week: existing.day_of_week,
              open_time: existing.open_time,
              close_time: existing.close_time,
              is_closed: existing.is_closed ?? false, // Convert null to false
            };
          }
          return {
            day_of_week: index,
            open_time: index === 0 || index === 6 ? null : '09:00', // Closed on weekends by default
            close_time: index === 0 || index === 6 ? null : '17:00',
            is_closed: index === 0 || index === 6, // Closed on weekends by default
          };
        });

        setHours(fullWeek);
      } catch (err) {
        setError('Failed to load working hours');
      } finally {
        setLoading(false);
      }
    }
    loadHours();
  }, []);

  const handleDayToggle = (dayIndex: number) => {
    setHours((prev) =>
      prev.map((hour) =>
        hour.day_of_week === dayIndex
          ? {
              ...hour,
              is_closed: !hour.is_closed,
              open_time: hour.is_closed ? '09:00' : null,
              close_time: hour.is_closed ? '17:00' : null,
            }
          : hour
      )
    );
  };

  const handleTimeChange = (
    dayIndex: number,
    field: 'open_time' | 'close_time',
    value: Dayjs | null
  ) => {
    if (!value) return;

    setHours((prev) =>
      prev.map((hour) =>
        hour.day_of_week === dayIndex
          ? { ...hour, [field]: value.format('HH:mm') }
          : hour
      )
    );
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      await updateShopHours(hours);
      setSuccess(true);
      onSave?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save working hours'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCopyToAll = (dayIndex: number) => {
    const sourceDay = hours.find((h) => h.day_of_week === dayIndex);
    if (!sourceDay) return;

    setHours((prev) =>
      prev.map((hour) => ({
        ...hour,
        open_time: sourceDay.open_time,
        close_time: sourceDay.close_time,
        is_closed: sourceDay.is_closed,
      }))
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Working Hours
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Working hours saved successfully!
          </Alert>
        )}

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ mt: 2 }}>
            {hours.map((dayHours) => (
              <Box
                key={dayHours.day_of_week}
                sx={{
                  py: 2,
                  borderBottom: dayHours.day_of_week < 6 ? '1px solid' : 'none',
                  borderColor: 'divider',
                }}
              >
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={12} sm={3}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!dayHours.is_closed}
                          onChange={() => handleDayToggle(dayHours.day_of_week)}
                        />
                      }
                      label={DAYS_OF_WEEK[dayHours.day_of_week]}
                    />
                  </Grid>

                  {!dayHours.is_closed && (
                    <>
                      <Grid item xs={5} sm={3}>
                        <TimePicker
                          label="Opens"
                          value={
                            dayHours.open_time
                              ? dayjs(dayHours.open_time, 'HH:mm')
                              : null
                          }
                          onChange={(value) =>
                            handleTimeChange(
                              dayHours.day_of_week,
                              'open_time',
                              value
                            )
                          }
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={5} sm={3}>
                        <TimePicker
                          label="Closes"
                          value={
                            dayHours.close_time
                              ? dayjs(dayHours.close_time, 'HH:mm')
                              : null
                          }
                          onChange={(value) =>
                            handleTimeChange(
                              dayHours.day_of_week,
                              'close_time',
                              value
                            )
                          }
                          slotProps={{
                            textField: {
                              size: 'small',
                              fullWidth: true,
                            },
                          }}
                        />
                      </Grid>

                      <Grid item xs={2} sm={3}>
                        <Button
                          size="small"
                          onClick={() => handleCopyToAll(dayHours.day_of_week)}
                        >
                          Copy to all
                        </Button>
                      </Grid>
                    </>
                  )}

                  {dayHours.is_closed && (
                    <Grid item xs={12} sm={9}>
                      <Typography variant="body2" color="text.secondary">
                        Closed
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            ))}
          </Box>
        </LocalizationProvider>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={24} /> : 'Save Working Hours'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
