'use client';

import { useEffect, useState } from 'react';
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
  Avatar,
  Card,
  CardContent,
  Fade,
  Stack,
  Paper,
} from '@mui/material';
// Remix Icons Component
function RemixIcon({
  name,
  size = 18,
  color,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  return (
    <i
      className={`ri ${name}`}
      style={{ fontSize: size, color: color || 'currentColor' }}
      aria-hidden
    />
  );
}
import { format } from 'date-fns';
import { isDateTimeInPast } from '@/lib/utils/date-time-utils';
import { parseLocalDateFromYYYYMMDD } from '@/lib/utils/date';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppointmentDisplay } from '@/hooks/useAppointmentDisplay';
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
import { updateAppointment as updateAppointmentRefactored } from '@/lib/actions/appointments';
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

  // Get timezone-aware display values
  const { appointment: displayAppointment, isLoading: isLoadingTimezone } =
    useAppointmentDisplay(appointment);

  const duration = getDurationMinutes(
    displayAppointment?.displayStartTime || appointment.start_time,
    displayAppointment?.displayEndTime || appointment.end_time
  );
  const isPast = isDateTimeInPast(appointment.date, appointment.end_time);

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

  // Use the updateAppointment from context which handles toasts and state management
  const { updateAppointment: updateAppointmentFromContext } = useAppointments();
  const [isUpdating, setIsUpdating] = useState(false);

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

  // Mutation for marking no-show
  const noShowMutation = useMutation({
    mutationFn: async (id: string) => {
      return updateAppointmentRefactored({
        id,
        status: 'no_show',
        sendEmail: true,
      });
    },
    onMutate: async () => {
      // Optimistic update
      dispatch({
        type: AppointmentActionType.UPDATE_APPOINTMENT_OPTIMISTIC,
        payload: {
          id: appointment.id,
          updates: { status: 'no_show' },
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
      toast.success('Appointment marked as no-show');
      onClose();
    },
    onError: (error) => {
      dispatch({
        type: AppointmentActionType.UPDATE_APPOINTMENT_ERROR,
        payload: {
          id: appointment.id,
          previousData: appointment,
          error: error.message,
        },
      });
      toast.error(error.message || 'Failed to mark as no-show');
    },
  });

  const handleConfirmCancel = async () => {
    cancelMutation.mutate(appointment.id);
  };

  // Removed intermediary reschedule confirmation step

  const handleMarkNoShow = () => {
    noShowMutation.mutate(appointment.id);
  };

  const handleSaveNotes = async () => {
    uiDispatch({ type: 'SET_SAVING_NOTES', payload: true });
    setIsUpdating(true);

    try {
      await updateAppointmentFromContext(appointment.id, {
        id: appointment.id,
        notes: ui.editedNotes || undefined,
      });
      uiDispatch({
        type: 'SET_CURRENT_NOTES',
        payload: ui.editedNotes || null,
      });
      uiDispatch({ type: 'SET_EDITING_NOTES', payload: false });
    } catch (err) {
      uiDispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to update',
      });
    } finally {
      uiDispatch({ type: 'SET_SAVING_NOTES', payload: false });
      setIsUpdating(false);
    }
  };

  const handleSaveType = async () => {
    uiDispatch({ type: 'SET_SAVING_TYPE', payload: true });
    setIsUpdating(true);

    try {
      await updateAppointmentFromContext(appointment.id, {
        id: appointment.id,
        type: ui.editedType as
          | 'consultation'
          | 'fitting'
          | 'pickup'
          | 'delivery'
          | 'other',
      });
      uiDispatch({ type: 'SET_CURRENT_TYPE', payload: ui.editedType });
      uiDispatch({ type: 'SET_EDITING_TYPE', payload: false });
    } catch (err) {
      uiDispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to update',
      });
    } finally {
      uiDispatch({ type: 'SET_SAVING_TYPE', payload: false });
      setIsUpdating(false);
    }
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

  // Helper function to get client initials for avatar
  const getClientInitials = (client: any) => {
    if (!client) return '?';
    const first = client.first_name?.[0] || '';
    const last = client.last_name?.[0] || '';
    return (first + last).toUpperCase() || '?';
  };

  // Helper function to get status color and icon
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'confirmed':
        return {
          color: 'success',
          icon: <RemixIcon name="ri-checkbox-circle-fill" size={16} />,
          label: 'Confirmed',
          bgColor: '#e8f5e8',
          textColor: '#2e7d32',
        };
      case 'pending':
        return {
          color: 'warning',
          icon: <RemixIcon name="ri-time-line" size={16} />,
          label: 'Pending',
          bgColor: '#fff8e1',
          textColor: '#f57c00',
        };
      case 'canceled':
        return {
          color: 'error',
          icon: <RemixIcon name="ri-close-circle-fill" size={16} />,
          label: 'Canceled',
          bgColor: '#ffebee',
          textColor: '#d32f2f',
        };
      case 'no_show':
        return {
          color: 'error',
          icon: <RemixIcon name="ri-user-unfollow-line" size={16} />,
          label: 'No Show',
          bgColor: '#ffebee',
          textColor: '#d32f2f',
        };
      default:
        return {
          color: 'default',
          icon: <RemixIcon name="ri-time-line" size={16} />,
          label: status,
          bgColor: '#f5f5f5',
          textColor: '#666',
        };
    }
  };

  const statusDisplay = getStatusDisplay(appointment.status);

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
        PaperProps={{
          sx: {
            borderRadius: '12px', // Consistent with style guide for dialogs
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            overflow: 'visible',
          },
        }}
      >
        {/* Enhanced Header */}
        <DialogTitle
          sx={{
            p: 0,
            background: 'linear-gradient(135deg, #B85563 0%, #8B3A42 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            borderTopLeftRadius: '12px',
            borderTopRightRadius: '12px',
          }}
        >
          <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              {/* Client Avatar */}
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  border: '2px solid rgba(255,255,255,0.3)',
                }}
              >
                {getClientInitials(appointment.client)}
              </Avatar>

              {/* Client Info & Status */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {appointment.client ? (
                  <Typography
                    variant="h6"
                    component={Link}
                    href={`/clients/${appointment.client.id}`}
                    sx={{
                      fontWeight: 600,
                      textDecoration: 'none',
                      color: 'white',
                      '&:hover': {
                        textDecoration: 'underline',
                        textDecorationColor: 'rgba(255,255,255,0.7)',
                      },
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    {`${appointment.client.first_name} ${appointment.client.last_name}`}
                  </Typography>
                ) : (
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 600, color: 'white', mb: 0.5 }}
                  >
                    No Client Selected
                  </Typography>
                )}

                {/* Status and Type Chips */}
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <Chip
                    icon={statusDisplay.icon}
                    label={statusDisplay.label}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 500,
                      '& .MuiChip-icon': { color: 'white' },
                    }}
                  />
                  <Chip
                    label={ui.currentType.replace('_', ' ').toUpperCase()}
                    size="small"
                    sx={{
                      bgcolor: getAppointmentColor(ui.currentType),
                      color: 'white',
                      fontWeight: 500,
                    }}
                  />
                </Stack>

                {/* Quick Date/Time Info */}
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.9)' }}
                >
                  {displayAppointment
                    ? format(
                        parseLocalDateFromYYYYMMDD(
                          displayAppointment.displayDate
                        ),
                        'EEE, MMM d'
                      )
                    : ''}{' '}
                  •{' '}
                  {displayAppointment
                    ? formatTime(displayAppointment.displayStartTime)
                    : ''}
                </Typography>
              </Box>

              {/* Close Button */}
              <IconButton
                onClick={() => {
                  uiDispatch({ type: 'SET_EDITING_NOTES', payload: false });
                  uiDispatch({ type: 'RESET_MESSAGES' });
                  onClose();
                }}
                sx={{
                  color: 'rgba(255,255,255,0.8)',
                  '&:hover': {
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                  },
                }}
              >
                <RemixIcon name="ri-close-line" size={20} />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Alert Messages */}
          {(ui.error || ui.successMessage) && (
            <Box sx={{ p: 3, pb: 0 }}>
              {ui.error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                  {ui.error}
                </Alert>
              )}
              {ui.successMessage && (
                <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                  {ui.successMessage}
                </Alert>
              )}
            </Box>
          )}

          <Box sx={{ p: 3 }}>
            {/* Date & Time Card */}
            <Card
              elevation={0}
              sx={{
                mb: 3,
                border: '1px solid #f0f0f0',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    mb: 2,
                  }}
                >
                  <RemixIcon
                    name="ri-calendar-line"
                    size={20}
                    color="#B85563"
                  />
                  <Typography variant="h6" fontWeight={600}>
                    Schedule Details
                  </Typography>
                </Box>

                <Box
                  sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: 'primary.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        color="primary.dark"
                      >
                        {format(
                          parseLocalDateFromYYYYMMDD(appointment.date),
                          'dd'
                        )}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body1" fontWeight={500}>
                        {displayAppointment
                          ? format(
                              parseLocalDateFromYYYYMMDD(
                                displayAppointment.displayDate
                              ),
                              'EEEE, MMMM d, yyyy'
                            )
                          : ''}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {displayAppointment
                          ? formatTime(displayAppointment.displayStartTime)
                          : ''}{' '}
                        -{' '}
                        {displayAppointment
                          ? formatTime(displayAppointment.displayEndTime)
                          : ''}{' '}
                        ({formatDuration(duration)})
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Appointment Type Card */}
            <Card
              elevation={0}
              sx={{
                mb: 3,
                border: '1px solid #f0f0f0',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <RemixIcon
                      name="ri-bookmark-line"
                      size={20}
                      color="#B85563"
                    />
                    <Typography variant="h6" fontWeight={600}>
                      Appointment Type
                    </Typography>
                  </Box>
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
                      disabled={ui.loading || isUpdating}
                      sx={{
                        color: 'primary.main',
                        '&:hover': {
                          bgcolor: 'primary.light',
                          color: 'primary.dark',
                        },
                      }}
                    >
                      <RemixIcon name="ri-edit-line" size={16} />
                    </IconButton>
                  )}
                </Box>

                {ui.isEditingType ? (
                  <Fade in={ui.isEditingType}>
                    <Box>
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
                          sx={{ borderRadius: 2 }}
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
                          sx={{ borderRadius: 2 }}
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
                              <RemixIcon name="ri-save-line" size={16} />
                            )
                          }
                          onClick={handleSaveType}
                          disabled={ui.savingType}
                          sx={{ borderRadius: 2 }}
                        >
                          {ui.savingType ? 'Saving...' : 'Save'}
                        </Button>
                      </Box>
                    </Box>
                  </Fade>
                ) : (
                  <Chip
                    label={ui.currentType.replace('_', ' ').toUpperCase()}
                    sx={{
                      bgcolor: getAppointmentColor(ui.currentType),
                      color: 'white',
                      fontWeight: 500,
                      borderRadius: 2,
                      height: 32,
                    }}
                  />
                )}
              </CardContent>
            </Card>

            {/* Client Contact Card */}
            {appointment.client && (
              <Card
                elevation={0}
                sx={{
                  mb: 3,
                  border: '1px solid #f0f0f0',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <RemixIcon name="ri-user-line" size={20} color="#B85563" />
                    <Typography variant="h6" fontWeight={600}>
                      Contact Information
                    </Typography>
                  </Box>

                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          bgcolor: 'info.light',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <RemixIcon
                          name="ri-mail-line"
                          size={18}
                          color="#BC6B6B"
                        />
                      </Box>
                      <Typography variant="body2">
                        {appointment.client.email}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          bgcolor: 'success.light',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <RemixIcon
                          name="ri-phone-line"
                          size={18}
                          color="#5A7061"
                        />
                      </Box>
                      <Typography variant="body2">
                        {appointment.client.phone_number}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* Notes Card */}
            <Card
              elevation={0}
              sx={{
                mb: 3,
                border: '1px solid #f0f0f0',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <RemixIcon
                      name="ri-sticky-note-line"
                      size={20}
                      color="#B85563"
                    />
                    <Typography variant="h6" fontWeight={600}>
                      Notes
                    </Typography>
                  </Box>
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
                      sx={{
                        color: 'primary.main',
                        '&:hover': {
                          bgcolor: 'primary.light',
                          color: 'primary.dark',
                        },
                      }}
                    >
                      <RemixIcon name="ri-edit-line" size={16} />
                    </IconButton>
                  )}
                </Box>

                {ui.isEditingNotes ? (
                  <Fade in={ui.isEditingNotes}>
                    <Box>
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
                        sx={{
                          mb: 2,
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
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
                          sx={{ borderRadius: 2 }}
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
                              <RemixIcon name="ri-save-line" size={16} />
                            )
                          }
                          onClick={handleSaveNotes}
                          disabled={ui.savingNotes}
                          sx={{ borderRadius: 2 }}
                        >
                          {ui.savingNotes ? 'Saving...' : 'Save'}
                        </Button>
                      </Box>
                    </Box>
                  </Fade>
                ) : (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      bgcolor: ui.currentNotes ? 'background.paper' : 'grey.50',
                      border: ui.currentNotes
                        ? '1px solid #e0e0e0'
                        : '1px dashed #bdbdbd',
                      borderRadius: 2,
                      minHeight: 80,
                      display: 'flex',
                      alignItems: ui.currentNotes ? 'flex-start' : 'center',
                      justifyContent: ui.currentNotes ? 'flex-start' : 'center',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: ui.currentNotes
                          ? 'text.primary'
                          : 'text.secondary',
                        fontStyle: ui.currentNotes ? 'normal' : 'italic',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {ui.currentNotes || 'No notes added yet'}
                    </Typography>
                  </Paper>
                )}
              </CardContent>
            </Card>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: 3,
            pt: 0,
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: { xs: 'stretch', sm: 'space-between' },
          }}
        >
          {/* Close Button */}
          <Button
            onClick={() => {
              uiDispatch({ type: 'SET_EDITING_NOTES', payload: false });
              uiDispatch({ type: 'SET_EDITING_TYPE', payload: false });
              uiDispatch({ type: 'RESET_MESSAGES' });
              onClose();
            }}
            disabled={isUpdating || cancelMutation.isPending}
            sx={{
              color: 'text.secondary',
              borderRadius: 2,
              py: 1.5,
              minWidth: { xs: '100%', sm: 'auto' },
              order: { xs: 2, sm: 1 },
            }}
          >
            Close
          </Button>

          {/* Action Buttons */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              order: { xs: 1, sm: 2 },
            }}
          >
            {/* Actions for pending and confirmed appointments */}
            {(appointment.status === 'pending' ||
              appointment.status === 'confirmed') && (
              <>
                {/* Show Reschedule and Cancel only for future appointments */}
                {!isPast && (
                  <>
                    <Button
                      variant="contained"
                      startIcon={
                        isUpdating ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <RemixIcon name="ri-edit-line" size={18} />
                        )
                      }
                      onClick={handleEditClick}
                      disabled={isUpdating || cancelMutation.isPending}
                      sx={{
                        borderRadius: 2,
                        py: 1.5,
                        px: 3,
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: '0 2px 8px rgba(184, 85, 99, 0.3)',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(184, 85, 99, 0.4)',
                          transform: 'translateY(-1px)',
                        },
                        '&:active': {
                          transform: 'translateY(0)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      Reschedule
                    </Button>

                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={
                        cancelMutation.isPending ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <RemixIcon name="ri-close-line" size={18} />
                        )
                      }
                      onClick={handleCancelClick}
                      disabled={isUpdating || cancelMutation.isPending}
                      sx={{
                        borderRadius: 2,
                        py: 1.5,
                        px: 3,
                        fontWeight: 600,
                        textTransform: 'none',
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2,
                          transform: 'translateY(-1px)',
                        },
                        '&:active': {
                          transform: 'translateY(0)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      Cancel Appointment
                    </Button>
                  </>
                )}

                {/* Show No Show button only for past appointments */}
                {isPast && (
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={
                      noShowMutation.isPending ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : (
                        <RemixIcon name="ri-user-unfollow-line" size={18} />
                      )
                    }
                    onClick={handleMarkNoShow}
                    disabled={noShowMutation.isPending || isUpdating}
                    sx={{
                      borderRadius: 2,
                      py: 1.5,
                      px: 3,
                      fontWeight: 600,
                      textTransform: 'none',
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        transform: 'translateY(-1px)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    Mark No Show
                  </Button>
                )}
              </>
            )}
          </Stack>
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
