'use client';

import { useState, useEffect } from 'react';
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
  Checkbox,
  FormControlLabel,
  Tooltip,
  TextField,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import CloseIcon from '@mui/icons-material/Close';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import SaveIcon from '@mui/icons-material/Save';
import NotesIcon from '@mui/icons-material/Notes';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  cancelAppointment,
  confirmAppointment,
  declineAppointment,
  markNoShowAppointment,
  updateAppointment,
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

interface CommunicationPreferences {
  sendEmail: boolean;
  sendSms: boolean;
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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [cancelComms, setCancelComms] = useState<CommunicationPreferences>({
    sendEmail: appointment.client?.accept_email ?? true,
    sendSms: appointment.client?.accept_sms ?? false,
  });
  const [editComms, setEditComms] = useState<CommunicationPreferences>({
    sendEmail: appointment.client?.accept_email ?? true,
    sendSms: appointment.client?.accept_sms ?? false,
  });
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(appointment.notes || '');
  const [currentNotes, setCurrentNotes] = useState<string | null>(
    appointment.notes
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);

  const duration = getDurationMinutes(
    appointment.start_time,
    appointment.end_time
  );
  const isPast =
    new Date(`${appointment.date} ${appointment.end_time}`) < new Date();

  // Sync currentNotes with appointment prop whenever it changes
  useEffect(() => {
    setCurrentNotes(appointment.notes);
    setEditedNotes(appointment.notes || '');
  }, [appointment.notes]);

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleEditClick = () => {
    setShowEditConfirm(true);
  };

  const handleConfirmCancel = async () => {
    setError(null);
    setLoading(true);

    try {
      // TODO: Pass communication preferences to server action
      // await cancelAppointment(appointment.id, cancelComms);
      await cancelAppointment(appointment.id);
      router.refresh();
      setShowCancelConfirm(false);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to cancel appointment'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEdit = () => {
    // TODO: Pass communication preferences to onEdit callback
    // onEdit(editComms);
    setShowEditConfirm(false);
    onEdit();
  };

  const handleConfirmAppointment = async () => {
    setError(null);
    setLoading(true);

    try {
      await confirmAppointment(appointment.id);
      router.refresh();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to confirm appointment'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineAppointment = async () => {
    setError(null);
    setLoading(true);

    try {
      await declineAppointment(appointment.id);
      router.refresh();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to decline appointment'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleMarkNoShow = async () => {
    setError(null);
    setLoading(true);

    try {
      await markNoShowAppointment(appointment.id);
      router.refresh();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to mark as no-show'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setError(null);
    setSuccessMessage(null);
    setSavingNotes(true);

    try {
      await updateAppointment({
        id: appointment.id,
        notes: editedNotes || null,
      });

      // Update local state immediately for visual feedback
      setCurrentNotes(editedNotes || null);
      setIsEditingNotes(false);
      setSuccessMessage('Notes updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

      // Refresh data in the background
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCancelEditNotes = () => {
    setEditedNotes(currentNotes || '');
    setIsEditingNotes(false);
    setError(null);
    setSuccessMessage(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'canceled':
      case 'declined':
        return 'error';
      case 'confirmed':
        return 'primary';
      case 'no_show':
        return 'warning';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={() => {
          setIsEditingNotes(false);
          setError(null);
          setSuccessMessage(null);
          onClose();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
          }}
        >
          Appointment Details
          <IconButton
            onClick={() => {
              setIsEditingNotes(false);
              setError(null);
              setSuccessMessage(null);
              onClose();
            }}
            size="small"
            sx={{ color: 'text.secondary' }}
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
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Client Name and Status */}
            <Box>
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                {appointment.client
                  ? `${appointment.client.first_name} ${appointment.client.last_name}`
                  : 'No Client Selected'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={appointment.type.replace('_', ' ').toUpperCase()}
                  size="small"
                  sx={{
                    bgcolor: getAppointmentColor(appointment.type),
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
                {appointment.status === 'confirmed' ? (
                  <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: 18 }} />}
                    label="CLIENT CONFIRMED"
                    size="small"
                    sx={{
                      bgcolor: '#4caf50',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                ) : (
                  <Chip
                    label={appointment.status.toUpperCase()}
                    size="small"
                    color={getStatusColor(appointment.status)}
                    variant="filled"
                  />
                )}
              </Box>
            </Box>

            <Divider />

            {/* Date and Time */}
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 1.5,
                }}
              >
                <EventIcon fontSize="small" color="primary" />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {format(parseISO(appointment.date), 'EEEE, MMMM d, yyyy')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AccessTimeIcon fontSize="small" color="primary" />
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formatTime(appointment.start_time)} -{' '}
                  {formatTime(appointment.end_time)}
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{ ml: 1 }}
                  >
                    ({formatDuration(duration)})
                  </Typography>
                </Typography>
              </Box>
            </Box>

            {/* Client Contact */}
            {appointment.client && (
              <>
                <Divider />
                <Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      mb: 1.5,
                    }}
                  >
                    <PersonIcon fontSize="small" color="primary" />
                    <Typography variant="subtitle1" fontWeight="medium">
                      Contact Information
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 3 }}>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      📧 {appointment.client.email}
                    </Typography>
                    <Typography variant="body2">
                      📞 {appointment.client.phone_number}
                    </Typography>
                  </Box>
                </Box>
              </>
            )}

            {/* Notes */}
            <>
              <Divider />
              <Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 1,
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    fontWeight="medium"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <NotesIcon fontSize="small" color="primary" />
                    Notes
                  </Typography>
                  {!isEditingNotes && (
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditedNotes(currentNotes || '');
                        setIsEditingNotes(true);
                      }}
                      disabled={loading || savingNotes}
                      sx={{ color: 'primary.main' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                {isEditingNotes ? (
                  <Box sx={{ ml: 3 }}>
                    <TextField
                      multiline
                      fullWidth
                      rows={4}
                      value={editedNotes}
                      onChange={(e) => setEditedNotes(e.target.value)}
                      placeholder="Add notes about this appointment..."
                      variant="outlined"
                      disabled={savingNotes}
                      sx={{ mb: 2 }}
                    />
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1,
                        justifyContent: 'flex-end',
                      }}
                    >
                      <Button
                        size="small"
                        onClick={handleCancelEditNotes}
                        disabled={savingNotes}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={
                          savingNotes ? (
                            <CircularProgress size={16} />
                          ) : (
                            <SaveIcon />
                          )
                        }
                        onClick={handleSaveNotes}
                        disabled={savingNotes}
                      >
                        {savingNotes ? 'Saving...' : 'Save Notes'}
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      ml: 3,
                      p: 2,
                      bgcolor: currentNotes ? 'grey.50' : 'transparent',
                      borderRadius: 1,
                      border: 1,
                      borderColor: currentNotes ? 'grey.200' : 'grey.300',
                      borderStyle: currentNotes ? 'solid' : 'dashed',
                      color: currentNotes ? 'text.primary' : 'text.secondary',
                      fontStyle: currentNotes ? 'normal' : 'italic',
                    }}
                  >
                    {currentNotes || 'No notes added yet'}
                  </Typography>
                )}
              </Box>
            </>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            gap: 1,
          }}
        >
          <Button
            onClick={() => {
              setIsEditingNotes(false);
              setError(null);
              setSuccessMessage(null);
              onClose();
            }}
            disabled={loading}
            color="inherit"
          >
            Close
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Actions for pending appointments */}
            {appointment.status === 'pending' && (
              <>
                <Button
                  variant="outlined"
                  color="success"
                  startIcon={<ThumbUpIcon />}
                  onClick={handleConfirmAppointment}
                  disabled={loading}
                  sx={{ minWidth: 'auto' }}
                >
                  Confirm
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<ThumbDownIcon />}
                  onClick={handleDeclineAppointment}
                  disabled={loading}
                  sx={{ minWidth: 'auto' }}
                >
                  Decline
                </Button>
              </>
            )}

            {/* Actions for confirmed appointments */}
            {appointment.status === 'confirmed' && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={handleEditClick}
                  disabled={loading}
                  sx={{ minWidth: 'auto' }}
                >
                  Reschedule
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<CancelIcon />}
                  onClick={handleCancelClick}
                  disabled={loading}
                  sx={{ minWidth: 'auto' }}
                >
                  Cancel
                </Button>
                {isPast && (
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<PersonOffIcon />}
                    onClick={handleMarkNoShow}
                    disabled={loading}
                    sx={{ minWidth: 'auto' }}
                  >
                    No Show
                  </Button>
                )}
              </>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cancel Appointment</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3 }}>
            Are you sure you want to cancel this appointment with{' '}
            <strong>
              {appointment.client
                ? `${appointment.client.first_name} ${appointment.client.last_name}`
                : 'this client'}
            </strong>
            ?
          </Typography>

          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={cancelComms.sendEmail}
                  onChange={(e) =>
                    setCancelComms((prev) => ({
                      ...prev,
                      sendEmail: e.target.checked,
                    }))
                  }
                  disabled={!appointment.client?.accept_email}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon fontSize="small" />
                  Send email notification
                </Box>
              }
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Tooltip title="SMS notifications coming soon">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={cancelComms.sendSms}
                    onChange={(e) =>
                      setCancelComms((prev) => ({
                        ...prev,
                        sendSms: e.target.checked,
                      }))
                    }
                    disabled={true} // SMS not implemented yet
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SmsIcon fontSize="small" />
                    Send SMS notification (coming soon)
                  </Box>
                }
              />
            </Tooltip>
          </Box>

          <Typography variant="body2" color="text.secondary">
            The client will be automatically notified of the cancellation based
            on your selections above.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShowCancelConfirm(false)}
            disabled={loading}
          >
            Back
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmCancel}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Cancel Appointment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule Confirmation Dialog */}
      <Dialog
        open={showEditConfirm}
        onClose={() => setShowEditConfirm(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reschedule Appointment</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 3 }}>
            You&apos;re about to reschedule this appointment. How would you like
            to notify the client of any changes?
          </Typography>

          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={editComms.sendEmail}
                  onChange={(e) =>
                    setEditComms((prev) => ({
                      ...prev,
                      sendEmail: e.target.checked,
                    }))
                  }
                  disabled={!appointment.client?.accept_email}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon fontSize="small" />
                  Send email notification
                </Box>
              }
            />
          </Box>

          <Box sx={{ mb: 2 }}>
            <Tooltip title="SMS notifications coming soon">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editComms.sendSms}
                    onChange={(e) =>
                      setEditComms((prev) => ({
                        ...prev,
                        sendSms: e.target.checked,
                      }))
                    }
                    disabled={true} // SMS not implemented yet
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SmsIcon fontSize="small" />
                    Send SMS notification (coming soon)
                  </Box>
                }
              />
            </Tooltip>
          </Box>

          <Typography variant="body2" color="text.secondary">
            Changes will be sent to the client after you reschedule the
            appointment.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditConfirm(false)} disabled={loading}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmEdit}
            disabled={loading}
          >
            Continue to Reschedule
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
