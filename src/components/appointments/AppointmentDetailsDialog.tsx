'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  cancelAppointment,
  completeAppointment,
} from '@/lib/actions/appointments';
import {
  getAppointmentColor,
  formatTime,
  formatDuration,
  getDurationMinutes,
} from '@/lib/utils/calendar';
import type { Appointment } from '@/types';

interface AppointmentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment;
  onEdit: () => void;
}

export function AppointmentDetailsDialog({
  open,
  onClose,
  appointment,
  onEdit,
}: AppointmentDetailsDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duration = getDurationMinutes(
    appointment.start_time,
    appointment.end_time
  );
  const isPast =
    new Date(`${appointment.date} ${appointment.end_time}`) < new Date();

  const handleComplete = async () => {
    setError(null);
    setLoading(true);

    try {
      await completeAppointment(appointment.id);
      router.refresh();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to complete appointment'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await cancelAppointment(appointment.id);
      router.refresh();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to cancel appointment'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'confirmed':
        return 'primary';
      case 'no_show':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        Appointment Details
        <Box>
          <IconButton
            onClick={onEdit}
            disabled={loading || appointment.status !== 'scheduled'}
          >
            <EditIcon />
          </IconButton>
          <IconButton
            onClick={handleCancel}
            disabled={loading || appointment.status !== 'scheduled'}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Client Name and Status */}
          <Box>
            <Typography variant="h6">
              {appointment.client
                ? `${appointment.client.first_name} ${appointment.client.last_name}`
                : 'No Client Selected'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip
                label={appointment.type.replace('_', ' ')}
                size="small"
                sx={{
                  bgcolor: getAppointmentColor(appointment.type),
                  color: 'white',
                }}
              />
              <Chip
                label={appointment.status}
                size="small"
                color={getStatusColor(appointment.status)}
                variant={
                  appointment.status === 'scheduled' ? 'outlined' : 'filled'
                }
              />
            </Box>
          </Box>

          <Divider />

          {/* Date and Time */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <EventIcon fontSize="small" color="action" />
              <Typography>
                {format(parseISO(appointment.date), 'EEEE, MMMM d, yyyy')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon fontSize="small" color="action" />
              <Typography>
                {formatTime(appointment.start_time)} -{' '}
                {formatTime(appointment.end_time)} ({formatDuration(duration)})
              </Typography>
            </Box>
          </Box>

          {/* Client */}
          {appointment.client && (
            <>
              <Divider />
              <Box>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                >
                  <PersonIcon fontSize="small" color="action" />
                  <Typography fontWeight="medium">
                    {appointment.client.first_name}{' '}
                    {appointment.client.last_name}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {appointment.client.email}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {appointment.client.phone_number}
                </Typography>
              </Box>
            </>
          )}

          {/* Notes */}
          {appointment.notes && (
            <>
              <Divider />
              <Box>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  gutterBottom
                >
                  Notes
                </Typography>
                <Typography variant="body2">{appointment.notes}</Typography>
              </Box>
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>

        {appointment.status === 'scheduled' && !isPast && (
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={handleComplete}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Mark Complete'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
