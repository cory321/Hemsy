import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  FormControlLabel,
  Checkbox,
  Tooltip,
  Button,
  CircularProgress,
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import SmsIcon from '@mui/icons-material/Sms';
import type { Appointment } from '@/types';
import type { CommunicationPreferences } from '@/components/appointments/hooks/useAppointmentDetailsState';

interface CancelConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  appointment: Appointment;
  cancelComms: CommunicationPreferences;
  setCancelComms: (prefs: CommunicationPreferences) => void;
  onConfirm: () => void;
  isPending?: boolean;
}

export function CancelConfirmationDialog({
  open,
  onClose,
  appointment,
  cancelComms,
  setCancelComms,
  onConfirm,
  isPending = false,
}: CancelConfirmationDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
                  setCancelComms({
                    ...cancelComms,
                    sendEmail: e.target.checked,
                  })
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
                    setCancelComms({
                      ...cancelComms,
                      sendSms: e.target.checked,
                    })
                  }
                  disabled={true}
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
          The client will be automatically notified of the cancellation based on
          your selections above.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Back
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={isPending}
          startIcon={isPending ? <CircularProgress size={16} /> : null}
        >
          {isPending ? 'Canceling...' : 'Cancel Appointment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CancelConfirmationDialog;
