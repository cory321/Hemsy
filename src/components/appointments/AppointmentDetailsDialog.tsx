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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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

import PersonOffIcon from '@mui/icons-material/PersonOff';
import SaveIcon from '@mui/icons-material/Save';
import NotesIcon from '@mui/icons-material/Notes';
import CategoryIcon from '@mui/icons-material/Category';
import { format, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  cancelAppointment,
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
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentKeys } from '@/lib/queries/appointment-keys';
import { updateAppointment as updateAppointmentRefactored } from '@/lib/actions/appointments-refactored';
import { useAppointments } from '@/providers/AppointmentProvider';
import { AppointmentActionType } from '@/lib/reducers/appointments-reducer';
import { toast } from 'react-hot-toast';

interface AppointmentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment;
  onEdit: (appointment: Appointment, isReschedule?: boolean) => void;
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
    appointment.notes || null
  );
  const [isEditingType, setIsEditingType] = useState(false);
  const [editedType, setEditedType] = useState(appointment.type);
  const [currentType, setCurrentType] = useState(appointment.type);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingType, setSavingType] = useState(false);

  const queryClient = useQueryClient();
  const { dispatch, state } = useAppointments();

  const duration = getDurationMinutes(
    appointment.start_time,
    appointment.end_time
  );
  const isPast =
    new Date(`${appointment.date} ${appointment.end_time}`) < new Date();

  // Sync state with appointment prop whenever it changes
  useEffect(() => {
    setCurrentNotes(appointment.notes || null);
    setEditedNotes(appointment.notes || '');
    setCurrentType(appointment.type);
    setEditedType(appointment.type);
  }, [appointment.notes, appointment.type]);

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleEditClick = () => {
    setShowEditConfirm(true);
  };

  // Mutation for updating appointment
  const updateMutation = useMutation({
    mutationFn: updateAppointmentRefactored,
    onMutate: async (data) => {
      // Optimistic update using reducer
      const updates: Partial<Appointment> = {
        id: appointment.id,
        shop_id: appointment.shop_id,
        client_id: appointment.client_id,
        date: data.date || appointment.date,
        start_time: data.startTime || appointment.start_time,
        end_time: data.endTime || appointment.end_time,
        type: data.type || appointment.type,
        status: data.status || appointment.status,
      };

      // Only include notes if it's explicitly being updated
      if (data.notes !== undefined) {
        updates.notes = data.notes;
      }

      dispatch({
        type: AppointmentActionType.UPDATE_APPOINTMENT_OPTIMISTIC,
        payload: {
          id: appointment.id,
          updates,
          previousData: appointment,
        },
      });
    },
    onSuccess: (updatedAppointment) => {
      dispatch({
        type: AppointmentActionType.UPDATE_APPOINTMENT_SUCCESS,
        payload: {
          appointment: updatedAppointment,
        },
      });
      toast.success('Appointment updated successfully');
    },
    onError: (error, variables) => {
      dispatch({
        type: AppointmentActionType.UPDATE_APPOINTMENT_ERROR,
        payload: {
          id: appointment.id,
          previousData: appointment,
          error: error.message,
        },
      });
      toast.error(error.message || 'Failed to update appointment');
    },
  });

  // Mutation for canceling appointment
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      return updateAppointmentRefactored({
        id,
        status: 'canceled',
      });
    },
    onMutate: async () => {
      // Optimistic update
      dispatch({
        type: AppointmentActionType.CANCEL_APPOINTMENT_OPTIMISTIC,
        payload: {
          id: appointment.id,
          previousData: appointment,
        },
      });
    },
    onSuccess: (updatedAppointment) => {
      dispatch({
        type: AppointmentActionType.CANCEL_APPOINTMENT_SUCCESS,
        payload: {
          appointment: updatedAppointment,
        },
      });
      toast.success('Appointment canceled');
      setShowCancelConfirm(false);
      onClose();
    },
    onError: (error) => {
      dispatch({
        type: AppointmentActionType.CANCEL_APPOINTMENT_ERROR,
        payload: {
          id: appointment.id,
          previousData: appointment,
          error: error.message,
        },
      });
      toast.error(error.message || 'Failed to cancel appointment');
    },
  });

  const handleConfirmCancel = async () => {
    cancelMutation.mutate(appointment.id);
  };

  const handleConfirmEdit = () => {
    setShowEditConfirm(false);
    // Pass reschedule flag to the edit handler
    onEdit(appointment, true);
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
    setSavingNotes(true);

    updateMutation.mutate(
      {
        id: appointment.id,
        notes: editedNotes || undefined,
      },
      {
        onSuccess: () => {
          setCurrentNotes(editedNotes || null);
          setIsEditingNotes(false);
          setSavingNotes(false);
        },
        onError: () => {
          setSavingNotes(false);
        },
      }
    );
  };

  const handleSaveType = async () => {
    setSavingType(true);

    updateMutation.mutate(
      {
        id: appointment.id,
        type: editedType,
      },
      {
        onSuccess: () => {
          setCurrentType(editedType);
          setIsEditingType(false);
          setSavingType(false);
        },
        onError: () => {
          setSavingType(false);
        },
      }
    );
  };

  const handleCancelEditNotes = () => {
    setEditedNotes(currentNotes || '');
    setIsEditingNotes(false);
    setError(null);
    setSuccessMessage(null);
  };

  const handleCancelEditType = () => {
    setEditedType(currentType);
    setIsEditingType(false);
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
                  label={currentType.replace('_', ' ').toUpperCase()}
                  size="small"
                  sx={{
                    bgcolor: getAppointmentColor(currentType),
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

            {/* Appointment Type */}
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
                  <CategoryIcon fontSize="small" color="primary" />
                  Appointment Type
                </Typography>
                {!isEditingType && (
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditedType(currentType);
                      setIsEditingType(true);
                    }}
                    disabled={loading || updateMutation.isPending}
                    sx={{ color: 'primary.main' }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              {isEditingType ? (
                <Box sx={{ ml: 3 }}>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <Select
                      value={editedType}
                      onChange={(e) => setEditedType(e.target.value as any)}
                      disabled={savingType}
                    >
                      <MenuItem value="consultation">Consultation</MenuItem>
                      <MenuItem value="fitting">Fitting</MenuItem>
                      <MenuItem value="pickup">Pickup</MenuItem>
                      <MenuItem value="delivery">Delivery</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <Button
                      size="small"
                      onClick={handleCancelEditType}
                      disabled={savingType}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={
                        savingType ? (
                          <CircularProgress size={16} />
                        ) : (
                          <SaveIcon />
                        )
                      }
                      onClick={handleSaveType}
                      disabled={savingType}
                    >
                      {savingType ? 'Saving...' : 'Save Type'}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ ml: 3 }}>
                  <Chip
                    label={currentType.replace('_', ' ').toUpperCase()}
                    sx={{
                      bgcolor: getAppointmentColor(currentType),
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                </Box>
              )}
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
              setIsEditingType(false);
              setError(null);
              setSuccessMessage(null);
              onClose();
            }}
            disabled={updateMutation.isPending || cancelMutation.isPending}
            color="inherit"
          >
            Close
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Actions for pending and confirmed appointments */}
            {(appointment.status === 'pending' ||
              appointment.status === 'confirmed') && (
              <>
                <Button
                  variant="outlined"
                  startIcon={
                    updateMutation.isPending ? (
                      <CircularProgress size={16} />
                    ) : (
                      <EditIcon />
                    )
                  }
                  onClick={handleEditClick}
                  disabled={
                    updateMutation.isPending || cancelMutation.isPending
                  }
                  sx={{ minWidth: 'auto' }}
                >
                  Reschedule
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={
                    cancelMutation.isPending ? (
                      <CircularProgress size={16} />
                    ) : (
                      <CancelIcon />
                    )
                  }
                  onClick={handleCancelClick}
                  disabled={
                    updateMutation.isPending || cancelMutation.isPending
                  }
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
                    disabled={loading || updateMutation.isPending}
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
            disabled={cancelMutation.isPending}
          >
            Back
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmCancel}
            disabled={cancelMutation.isPending}
            startIcon={
              cancelMutation.isPending ? <CircularProgress size={16} /> : null
            }
          >
            {cancelMutation.isPending ? 'Canceling...' : 'Cancel Appointment'}
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
