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
  FormControlLabel,
  Checkbox,
  Typography,
  Divider,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
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
  isReschedule?: boolean;
  rescheduleSendEmailDefault?: boolean;
  selectedDate?: Date;
  selectedTime?: string | null;
  prefilledClient?: Client | null;
  shopHours?: ReadonlyArray<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>;
  existingAppointments?: ReadonlyArray<Appointment>;
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
    sendEmail?: boolean;
  }) => Promise<void>;
  onUpdate?: (data: {
    clientId: string;
    date: string;
    startTime: string;
    endTime: string;
    type: 'consultation' | 'fitting' | 'pickup' | 'delivery' | 'other';
    notes?: string;
    status?: string;
    sendEmail?: boolean;
  }) => Promise<void>;
}

export function AppointmentDialog({
  open,
  onClose,
  appointment,
  isReschedule = false,
  rescheduleSendEmailDefault,
  selectedDate,
  selectedTime,
  prefilledClient,
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
  const [sendEmail, setSendEmail] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState(() => {
    const initialDate = appointment
      ? dayjs(appointment.date)
      : selectedDate
        ? dayjs(selectedDate)
        : dayjs(new Date());

    return {
      client_id: appointment?.client_id || null,
      date: initialDate,
      start_time: appointment
        ? parseTimeString(appointment.start_time)
        : selectedTime
          ? parseTimeString(selectedTime)
          : null,
      end_time: appointment ? parseTimeString(appointment.end_time) : null,
      type: appointment?.type || 'consultation',
      notes: appointment?.notes || '',
    };
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

  // Ensure default duration applies when opening dialog for new appointments
  useEffect(() => {
    if (open && !appointment) {
      setDuration(calendarSettings.default_appointment_duration);
    }
  }, [open, appointment?.id, calendarSettings.default_appointment_duration]);

  // Load selected client for editing
  useEffect(() => {
    if (appointment?.client_id && appointment.client) {
      setSelectedClient(appointment.client as Client);
      setFormData((prev) => ({ ...prev, client_id: appointment.client_id }));
    } else if (!appointment) {
      // Ensure we clear client when not editing
      setSelectedClient(null);
      setFormData((prev) => ({ ...prev, client_id: null }));
    }
  }, [appointment?.id]);

  // Keep sendEmail in sync with selected client preferences
  useEffect(() => {
    if (isReschedule) {
      // In reschedule mode, default to true if client accepts email; allow user to toggle
      setSendEmail(
        (rescheduleSendEmailDefault ?? true) && !!selectedClient?.accept_email
      );
    } else {
      setSendEmail(!!selectedClient?.accept_email);
    }
  }, [
    isReschedule,
    rescheduleSendEmailDefault,
    selectedClient?.id,
    selectedClient?.accept_email,
  ]);

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
  }, [
    open,
    selectedDate,
    selectedTime,
    appointment?.id,
    appointment?.start_time,
    appointment?.date,
  ]);

  // Update end time when start time or duration changes
  useEffect(() => {
    if (formData.start_time && duration) {
      const endTime = addMinutes(formData.start_time, duration);
      setFormData((prev) => ({ ...prev, end_time: endTime }));
    }
  }, [formData.start_time, duration]);

  // Clear selected client when switching from editing to new appointment
  useEffect(() => {
    if (open) {
      if (appointment?.client_id && appointment.client) {
        setSelectedClient(appointment.client as Client);
      } else if (prefilledClient && !appointment) {
        // Use prefilled client for new appointments
        setSelectedClient(prefilledClient);
        setFormData((prev) => ({ ...prev, client_id: prefilledClient.id }));
      } else {
        setSelectedClient(null);
        setFormData((prev) => ({ ...prev, client_id: null }));
      }
    }
  }, [open, appointment?.id, prefilledClient]);

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

      const data: {
        clientId: string;
        date: string;
        startTime: string;
        endTime: string;
        type: 'consultation' | 'fitting' | 'pickup' | 'delivery' | 'other';
        notes?: string;
        sendEmail?: boolean;
      } = {
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
        ...(formData.notes ? { notes: formData.notes } : {}),
        sendEmail,
      };

      if (appointment && onUpdate) {
        await onUpdate({ ...data, sendEmail });
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
          [...shopHours],
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
        {isReschedule
          ? 'Reschedule Appointment'
          : appointment
            ? 'Edit Appointment'
            : 'New Appointment'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Client display/selection */}
          {isReschedule ? (
            // Read-only client display when rescheduling
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Client
              </Typography>
              <Typography variant="body1">
                {appointment?.client
                  ? `${appointment.client.first_name} ${appointment.client.last_name}`
                  : 'No Client'}
              </Typography>
            </Box>
          ) : (
            <ClientSearchField
              value={selectedClient as any}
              onChange={(newClient) => {
                setSelectedClient(newClient as Client | null);
                setFormData((prev) => ({
                  ...prev,
                  client_id: newClient?.id || null,
                }));
              }}
              helperText="Select a client for this appointment"
            />
          )}

          {/* Date and Time */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date"
              value={formData.date}
              format="dddd, MMMM D, YYYY"
              onChange={(newValue) => {
                if (newValue) {
                  const dayjsDate = dayjs.isDayjs(newValue)
                    ? newValue
                    : dayjs(newValue);
                  setFormData((prev) => ({
                    ...prev,
                    date: dayjsDate,
                    start_time: null,
                    end_time: null,
                  }));
                }
              }}
              minDate={dayjs()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  onClick: (e: any) => {
                    // Find and click the calendar button to open picker
                    const button = e.currentTarget.querySelector('button');
                    if (button) button.click();
                  },
                  InputProps: {
                    readOnly: true,
                  },
                  inputProps: {
                    'aria-label': 'Date',
                    style: {
                      cursor: 'pointer',
                      caretColor: 'transparent', // Hide the caret
                    },
                    onKeyDown: (e: any) => {
                      // Prevent all keyboard input including backspace/delete
                      e.preventDefault();
                      e.stopPropagation();
                    },
                    onPaste: (e: any) => {
                      // Prevent paste
                      e.preventDefault();
                    },
                    onCut: (e: any) => {
                      // Prevent cut
                      e.preventDefault();
                    },
                    onDrop: (e: any) => {
                      // Prevent drag and drop
                      e.preventDefault();
                    },
                    onMouseDown: (e: any) => {
                      // Prevent text selection with mouse
                      e.preventDefault();
                    },
                    onSelect: (e: any) => {
                      // Clear any selection
                      if (e.target.selectionStart !== e.target.selectionEnd) {
                        e.target.setSelectionRange(0, 0);
                      }
                    },
                  },
                  sx: {
                    '& input': {
                      cursor: 'pointer',
                      userSelect: 'none', // Prevent text selection
                      WebkitUserSelect: 'none',
                      MozUserSelect: 'none',
                      msUserSelect: 'none',
                      pointerEvents: 'none', // Disable all pointer events on input
                    },
                    '& .MuiInputBase-root': {
                      cursor: 'pointer',
                    },
                    '& fieldset': { cursor: 'pointer' },
                    // Re-enable pointer events on the root to allow clicks
                    '& .MuiInputBase-root.MuiOutlinedInput-root': {
                      pointerEvents: 'auto',
                    },
                  },
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
                <InputLabel id="duration-label">Duration</InputLabel>
                <Select
                  labelId="duration-label"
                  label="Duration"
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

          {/* Type - Only show when not rescheduling */}
          {!isReschedule && (
            <FormControl fullWidth>
              <InputLabel id="type-label">Type</InputLabel>
              <Select
                labelId="type-label"
                label="Type"
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
          )}

          {/* Notes - Only show when not rescheduling */}
          {!isReschedule && (
            <TextField
              label="Notes"
              multiline
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          )}

          {/* Send appointment reminders section - Hidden when rescheduling */}
          {!isReschedule && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
                  Send appointment reminders
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={sendEmail}
                        onChange={(e) => setSendEmail(e.target.checked)}
                        disabled={
                          !selectedClient || !selectedClient.accept_email
                        }
                        size="small"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                          Email
                        </Typography>
                        {selectedClient && !selectedClient.accept_email && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: '0.7rem', lineHeight: 1 }}
                          >
                            Opted out
                          </Typography>
                        )}
                      </Box>
                    }
                    sx={{
                      alignItems: 'center',
                      ml: -0.5,
                      '& .MuiFormControlLabel-label': { mt: 0 },
                    }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedClient?.accept_sms || false}
                        disabled={!selectedClient || !selectedClient.accept_sms}
                        size="small"
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                          SMS
                        </Typography>
                        {selectedClient && !selectedClient.accept_sms && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: '0.7rem', lineHeight: 1 }}
                          >
                            Opted out
                          </Typography>
                        )}
                      </Box>
                    }
                    sx={{
                      alignItems: 'center',
                      ml: -0.5,
                      '& .MuiFormControlLabel-label': { mt: 0 },
                    }}
                  />
                </Box>
              </Box>
            </>
          )}

          {/* Send email notification when rescheduling */}
          {isReschedule && (
            <Box>
              <Divider sx={{ my: 1.5 }} />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    disabled={!selectedClient || !selectedClient?.accept_email}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                      Send email notification
                    </Typography>
                    {selectedClient && !selectedClient.accept_email && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: '0.7rem', lineHeight: 1 }}
                      >
                        Client opted out
                      </Typography>
                    )}
                  </Box>
                }
                sx={{
                  alignItems: 'center',
                  ml: -0.5,
                  '& .MuiFormControlLabel-label': { mt: 0 },
                }}
              />
            </Box>
          )}
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
          ) : isReschedule ? (
            'Reschedule'
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
