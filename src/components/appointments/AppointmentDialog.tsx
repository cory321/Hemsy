'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  CircularProgress,
  FormHelperText,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { addMinutes, format, parse, isValid } from 'date-fns';
import dayjs from 'dayjs';
import { getAvailableTimeSlots, to12HourFormat } from '@/lib/utils/calendar';
import { ClientSearchField } from './ClientSearchField';
import type { Appointment, Client } from '@/types';

// Helper function to safely parse time strings from database
const parseTimeString = (timeStr?: string): Date | null => {
  if (!timeStr) return null;

  try {
    // Handle both HH:mm and HH:mm:ss formats from PostgreSQL TIME type
    const timePattern = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;
    const match = timeStr.match(timePattern);

    if (match) {
      const hours = parseInt(match[1] || '0', 10);
      const minutes = parseInt(match[2] || '0', 10);
      // Create a date object with the time
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    }

    // Fallback to original parsing for HH:mm format
    return parse(timeStr, 'HH:mm', new Date());
  } catch (error) {
    console.error('Error parsing time string:', timeStr, error);
    return null;
  }
};

// Helper function to safely format time values
const formatTimeString = (date: Date | null): string => {
  if (!date || !isValid(date)) return '';

  try {
    return format(date, 'HH:mm');
  } catch (error) {
    console.error('Error formatting time:', date, error);
    return '';
  }
};

interface AppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  appointment?: Appointment | null;
  selectedDate?: Date;
  selectedTime?: string | null;
  shopHours?: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>;
  existingAppointments?: Appointment[];
  calendarSettings?: {
    buffer_time_minutes: number;
    default_appointment_duration: number;
  };
  onCreate?: (data: {
    clientId: string;
    date: string;
    startTime: string;
    endTime: string;
    type: 'consultation' | 'fitting' | 'pickup' | 'delivery' | 'other';
    notes?: string;
  }) => Promise<void>;
  onUpdate?: (data: {
    clientId: string;
    date: string;
    startTime: string;
    endTime: string;
    type: 'consultation' | 'fitting' | 'pickup' | 'delivery' | 'other';
    notes?: string;
    status?: string;
  }) => Promise<void>;
}

export function AppointmentDialog({
  open,
  onClose,
  appointment,
  selectedDate,
  selectedTime,
  shopHours = [],
  existingAppointments = [],
  calendarSettings = {
    buffer_time_minutes: 0,
    default_appointment_duration: 30,
  },
  onCreate,
  onUpdate,
}: AppointmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    client_id: appointment?.client_id || null,
    date: appointment
      ? dayjs(appointment.date)
      : dayjs(selectedDate || new Date()),
    start_time: appointment
      ? parseTimeString(appointment.start_time)
      : selectedTime
        ? parseTimeString(selectedTime)
        : null,
    end_time: appointment ? parseTimeString(appointment.end_time) : null,
    type: appointment?.type || 'consultation',
    notes: appointment?.notes || '',
  });

  // Duration state
  const [duration, setDuration] = useState(() => {
    if (appointment && appointment.start_time && appointment.end_time) {
      const startTime = parseTimeString(appointment.start_time);
      const endTime = parseTimeString(appointment.end_time);

      if (startTime && endTime) {
        return Math.floor((endTime.getTime() - startTime.getTime()) / 60000);
      }
    }
    return calendarSettings.default_appointment_duration;
  });

  // Load selected client for editing
  useEffect(() => {
    if (appointment?.client_id && appointment.client) {
      setSelectedClient(appointment.client as Client);
    }
  }, [appointment]);

  // Update form state when selectedDate or selectedTime props change
  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        date: appointment
          ? dayjs(appointment.date)
          : dayjs(selectedDate || new Date()),
        start_time: appointment
          ? parseTimeString(appointment.start_time)
          : selectedTime
            ? parseTimeString(selectedTime)
            : null,
      }));
    }
  }, [open, selectedDate, selectedTime, appointment]);

  // Update end time when start time or duration changes
  useEffect(() => {
    if (formData.start_time && duration) {
      const endTime = addMinutes(formData.start_time, duration);
      setFormData((prev) => ({ ...prev, end_time: endTime }));
    }
  }, [formData.start_time, duration]);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.client_id) {
        setError('Please select a client');
        setLoading(false);
        return;
      }

      if (!formData.start_time) {
        setError('Please select a start time');
        setLoading(false);
        return;
      }

      const data = {
        clientId: formData.client_id,
        date: dayjs.isDayjs(formData.date)
          ? formData.date.format('YYYY-MM-DD')
          : dayjs(formData.date).format('YYYY-MM-DD'),
        startTime: formatTimeString(formData.start_time),
        endTime: formatTimeString(formData.end_time),
        type: formData.type as
          | 'consultation'
          | 'fitting'
          | 'pickup'
          | 'delivery'
          | 'other',
        notes: formData.notes || undefined,
      };

      if (appointment && onUpdate) {
        await onUpdate(data);
      } else if (!appointment && onCreate) {
        await onCreate(data);
      } else {
        throw new Error('No handler provided for this action');
      }

      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save appointment'
      );
    } finally {
      setLoading(false);
    }
  };

  // Get available time slots for selected date
  const availableSlots =
    formData.date && dayjs.isDayjs(formData.date)
      ? getAvailableTimeSlots(
          formData.date.toDate(),
          shopHours,
          existingAppointments.filter(
            (apt) =>
              apt.date === formData.date.format('YYYY-MM-DD') &&
              apt.id !== appointment?.id
          ),
          duration,
          calendarSettings.buffer_time_minutes
        )
      : [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {appointment ? 'Edit Appointment' : 'New Appointment'}
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Client Selection */}
          <ClientSearchField
            value={selectedClient as any}
            onChange={(newClient) => {
              setSelectedClient(newClient as Client | null);
              setFormData((prev) => ({
                ...prev,
                client_id: newClient?.id || null,
              }));
            }}
          />

          {/* Date and Time */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date"
              value={formData.date}
              onChange={(newValue) => {
                if (newValue) {
                  // Ensure newValue is a Dayjs object
                  const dayjsDate = dayjs.isDayjs(newValue)
                    ? newValue
                    : dayjs(newValue);
                  setFormData((prev) => ({
                    ...prev,
                    date: dayjsDate,
                    // Reset time selections when date changes
                    start_time: null,
                    end_time: null,
                  }));
                }
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                },
              }}
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel id="start-time-label">Start Time</InputLabel>
                <Select
                  labelId="start-time-label"
                  id="start-time-select"
                  label="Start Time"
                  value={formatTimeString(formData.start_time)}
                  onChange={(e) => {
                    const time = parse(e.target.value, 'HH:mm', new Date());
                    setFormData((prev) => ({ ...prev, start_time: time }));
                  }}
                  required
                >
                  {availableSlots.length === 0 && (
                    <MenuItem disabled value="">
                      No available slots
                    </MenuItem>
                  )}
                  {availableSlots.map((slot) => (
                    <MenuItem key={slot} value={slot}>
                      {to12HourFormat(slot)}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {availableSlots.length === 0 &&
                    'No time slots available for this date'}
                </FormHelperText>
              </FormControl>

              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Duration</InputLabel>
                <Select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                >
                  <MenuItem value={15}>15 min</MenuItem>
                  <MenuItem value={30}>30 min</MenuItem>
                  <MenuItem value={45}>45 min</MenuItem>
                  <MenuItem value={60}>1 hour</MenuItem>
                  <MenuItem value={90}>1.5 hours</MenuItem>
                  <MenuItem value={120}>2 hours</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </LocalizationProvider>

          {/* Type */}
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  type: e.target.value as
                    | 'consultation'
                    | 'fitting'
                    | 'pickup'
                    | 'delivery'
                    | 'other',
                }))
              }
              required
            >
              <MenuItem value="consultation">Consultation</MenuItem>
              <MenuItem value="fitting">Fitting</MenuItem>
              <MenuItem value="pickup">Pick up</MenuItem>
              <MenuItem value="delivery">Delivery</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          {/* Notes */}
          <TextField
            label="Notes"
            multiline
            rows={3}
            value={formData.notes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, notes: e.target.value }))
            }
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            loading || !formData.start_time || availableSlots.length === 0
          }
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : appointment ? (
            'Update'
          ) : (
            'Schedule'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
