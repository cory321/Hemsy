'use client';

import { useEffect } from 'react';
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
import { format } from 'date-fns';
import { parseLocalDateFromYYYYMMDD } from '@/lib/utils/date';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Legacy actions not used in refactored flows
import {
  getAppointmentColor,
  formatTime,
  formatDuration,
  getDurationMinutes,
} from '@/lib/utils/calendar';
import type { Appointment, AppointmentType } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { appointmentKeys } from '@/lib/queries/appointment-keys';
import { updateAppointment as updateAppointmentRefactored } from '@/lib/actions/appointments-refactored';
import { useAppointments } from '@/providers/AppointmentProvider';
import { AppointmentActionType } from '@/lib/reducers/appointments-reducer';
import { toast } from 'react-hot-toast';
import { useAppointmentDetailsState } from '@/components/appointments/hooks/useAppointmentDetailsState';
import CancelConfirmationDialog from '@/components/appointments/dialogs/CancelConfirmationDialog';

interface AppointmentDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment;
  onEdit: (
    appointment: Appointment,
    isReschedule?: boolean,
    sendEmailDefault?: boolean
  ) => void;
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
  const { state: ui, dispatch: uiDispatch } =
    useAppointmentDetailsState(appointment);
  const { dispatch, state } = useAppointments();

  const duration = getDurationMinutes(
    appointment.start_time,
    appointment.end_time
  );
  const isPast =
    new Date(`${appointment.date} ${appointment.end_time}`) < new Date();

  // Sync state with appointment prop whenever it changes
  useEffect(() => {
    // no-op: handled in hook sync
  }, [appointment.notes, appointment.type]);

  const handleCancelClick = () => {
    uiDispatch({ type: 'SET_SHOW_CANCEL_CONFIRM', payload: true });
  };

  const handleEditClick = () => {
    // Directly open reschedule dialog without intermediary confirmation
    onEdit(appointment, true, true);
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
        sendEmail: ui.cancelComms.sendEmail,
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
      uiDispatch({ type: 'SET_SHOW_CANCEL_CONFIRM', payload: false });
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

  // Removed intermediary reschedule confirmation step

  const handleMarkNoShow = async () => {
    uiDispatch({ type: 'SET_ERROR', payload: null });
    uiDispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Use refactored flow: update status and trigger email/logging via server action
      await updateMutation.mutateAsync({
        id: appointment.id,
        status: 'no_show',
        sendEmail: true,
      });
      toast.success('Marked as no-show');
      onClose();
    } catch (err) {
      uiDispatch({
        type: 'SET_ERROR',
        payload:
          err instanceof Error ? err.message : 'Failed to mark as no-show',
      });
    } finally {
      uiDispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleSaveNotes = async () => {
    uiDispatch({ type: 'SET_SAVING_NOTES', payload: true });

    updateMutation.mutate(
      {
        id: appointment.id,
        notes: ui.editedNotes || undefined,
      },
      {
        onSuccess: () => {
          uiDispatch({
            type: 'SET_CURRENT_NOTES',
            payload: ui.editedNotes || null,
          });
          uiDispatch({ type: 'SET_EDITING_NOTES', payload: false });
          uiDispatch({ type: 'SET_SAVING_NOTES', payload: false });
        },
        onError: (err) => {
          uiDispatch({ type: 'SET_SAVING_NOTES', payload: false });
          uiDispatch({
            type: 'SET_ERROR',
            payload: err.message || 'Failed to update',
          });
        },
      }
    );
  };

  const handleSaveType = async () => {
    uiDispatch({ type: 'SET_SAVING_TYPE', payload: true });

    updateMutation.mutate(
      {
        id: appointment.id,
        type: ui.editedType as
          | 'consultation'
          | 'fitting'
          | 'pickup'
          | 'delivery'
          | 'other',
      },
      {
        onSuccess: () => {
          uiDispatch({ type: 'SET_CURRENT_TYPE', payload: ui.editedType });
          uiDispatch({ type: 'SET_EDITING_TYPE', payload: false });
          uiDispatch({ type: 'SET_SAVING_TYPE', payload: false });
        },
        onError: () => {
          uiDispatch({ type: 'SET_SAVING_TYPE', payload: false });
        },
      }
    );
  };

  const handleCancelEditNotes = () => {
    uiDispatch({ type: 'SET_EDITED_NOTES', payload: ui.currentNotes || '' });
    uiDispatch({ type: 'SET_EDITING_NOTES', payload: false });
    uiDispatch({ type: 'RESET_MESSAGES' });
  };

  const handleCancelEditType = () => {
    uiDispatch({ type: 'SET_EDITED_TYPE', payload: ui.currentType });
    uiDispatch({ type: 'SET_EDITING_TYPE', payload: false });
    uiDispatch({ type: 'RESET_MESSAGES' });
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
          uiDispatch({ type: 'SET_EDITING_NOTES', payload: false });
          uiDispatch({ type: 'RESET_MESSAGES' });
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
              uiDispatch({ type: 'SET_EDITING_NOTES', payload: false });
              uiDispatch({ type: 'RESET_MESSAGES' });
              onClose();
            }}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {ui.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {ui.error}
            </Alert>
          )}
          {ui.successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {ui.successMessage}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Client Name and Status */}
            <Box>
              {appointment.client ? (
                <Typography
                  variant="h5"
                  component={Link}
                  href={`/clients/${appointment.client.id}`}
                  sx={{
                    mb: 1,
                    fontWeight: 600,
                    textDecoration: 'none',
                    color: 'primary.main',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  {`${appointment.client.first_name} ${appointment.client.last_name}`}
                </Typography>
              ) : (
                <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                  No Client Selected
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={ui.currentType.replace('_', ' ').toUpperCase()}
                  size="small"
                  sx={{
                    bgcolor: getAppointmentColor(ui.currentType),
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
                {!ui.isEditingType && (
                  <IconButton
                    aria-label="Edit"
                    data-testid="edit-type-button"
                    size="small"
                    onClick={() => {
                      uiDispatch({
                        type: 'SET_EDITED_TYPE',
                        payload: ui.currentType,
                      });
                      uiDispatch({ type: 'SET_EDITING_TYPE', payload: true });
                    }}
                    disabled={ui.loading || updateMutation.isPending}
                    sx={{ color: 'primary.main' }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              {ui.isEditingType ? (
                <Box sx={{ ml: 3 }}>
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <Select
                      value={ui.editedType}
                      onChange={(e) =>
                        uiDispatch({
                          type: 'SET_EDITED_TYPE',
                          payload: e.target.value as AppointmentType,
                        })
                      }
                      disabled={ui.savingType}
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
                      disabled={ui.savingType}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={
                        ui.savingType ? (
                          <CircularProgress size={16} />
                        ) : (
                          <SaveIcon />
                        )
                      }
                      onClick={handleSaveType}
                      disabled={ui.savingType}
                    >
                      {ui.savingType ? 'Saving...' : 'Save Type'}
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ ml: 3 }}>
                  <Chip
                    label={ui.currentType.replace('_', ' ').toUpperCase()}
                    sx={{
                      bgcolor: getAppointmentColor(ui.currentType),
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
                  {format(
                    parseLocalDateFromYYYYMMDD(appointment.date),
                    'EEEE, MMMM d, yyyy'
                  )}
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
                  {!ui.isEditingNotes && (
                    <IconButton
                      aria-label="Edit"
                      data-testid="edit-notes-button"
                      size="small"
                      onClick={() => {
                        uiDispatch({
                          type: 'SET_EDITED_NOTES',
                          payload: ui.currentNotes || '',
                        });
                        uiDispatch({
                          type: 'SET_EDITING_NOTES',
                          payload: true,
                        });
                      }}
                      disabled={ui.loading || ui.savingNotes}
                      sx={{ color: 'primary.main' }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                {ui.isEditingNotes ? (
                  <Box sx={{ ml: 3 }}>
                    <TextField
                      multiline
                      fullWidth
                      rows={4}
                      value={ui.editedNotes}
                      onChange={(e) =>
                        uiDispatch({
                          type: 'SET_EDITED_NOTES',
                          payload: e.target.value,
                        })
                      }
                      placeholder="Add notes about this appointment..."
                      variant="outlined"
                      disabled={ui.savingNotes}
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
                        disabled={ui.savingNotes}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={
                          ui.savingNotes ? (
                            <CircularProgress size={16} />
                          ) : (
                            <SaveIcon />
                          )
                        }
                        onClick={handleSaveNotes}
                        disabled={ui.savingNotes}
                      >
                        {ui.savingNotes ? 'Saving...' : 'Save Notes'}
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      ml: 3,
                      p: 2,
                      bgcolor: ui.currentNotes ? 'grey.50' : 'transparent',
                      borderRadius: 1,
                      border: 1,
                      borderColor: ui.currentNotes ? 'grey.200' : 'grey.300',
                      borderStyle: ui.currentNotes ? 'solid' : 'dashed',
                      color: ui.currentNotes
                        ? 'text.primary'
                        : 'text.secondary',
                      fontStyle: ui.currentNotes ? 'normal' : 'italic',
                    }}
                  >
                    {ui.currentNotes || 'No notes added yet'}
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
              uiDispatch({ type: 'SET_EDITING_NOTES', payload: false });
              uiDispatch({ type: 'SET_EDITING_TYPE', payload: false });
              uiDispatch({ type: 'RESET_MESSAGES' });
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
                    updateMutation.isPending ||
                    cancelMutation.isPending ||
                    isPast
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
                    updateMutation.isPending ||
                    cancelMutation.isPending ||
                    isPast
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
                    disabled={ui.loading || updateMutation.isPending}
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
      <CancelConfirmationDialog
        open={ui.showCancelConfirm}
        onClose={() =>
          uiDispatch({ type: 'SET_SHOW_CANCEL_CONFIRM', payload: false })
        }
        appointment={appointment}
        cancelComms={ui.cancelComms}
        setCancelComms={(prefs) =>
          uiDispatch({ type: 'SET_CANCEL_COMMS', payload: prefs })
        }
        onConfirm={handleConfirmCancel}
        isPending={cancelMutation.isPending}
      />

      {/* Reschedule confirmation dialog removed per new flow */}
    </>
  );
}
