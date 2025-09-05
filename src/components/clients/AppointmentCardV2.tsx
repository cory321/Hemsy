'use client';

import { useState, memo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  IconButton,
  Collapse,
  Fade,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NotesIcon from '@mui/icons-material/Notes';
import type { Appointment } from '@/types';
import {
  getAppointmentStatusIcon,
  getAppointmentStatusColor,
  getAppointmentTimeDisplay,
} from '@/lib/utils/appointment-grouping';
import { useQueryClient } from '@tanstack/react-query';
import { AppointmentDetailsDialog } from '@/components/appointments/AppointmentDetailsDialog';
import { AppointmentDialog } from '@/components/appointments/AppointmentDialog';
import { useAppointments } from '@/providers/AppointmentProvider';
import { clientAppointmentKeys } from '@/lib/queries/client-appointment-queries';
import { isDateTimeInPast } from '@/lib/utils/date-time-utils';

interface AppointmentCardV2Props {
  appointment: Appointment;
  shopId: string;
  isToday?: boolean;
  shopHours?: Array<{
    day_of_week: number;
    open_time: string | null;
    close_time: string | null;
    is_closed: boolean;
  }>;
  calendarSettings?: {
    buffer_time_minutes: number;
    default_appointment_duration: number;
  };
  existingAppointments?: Appointment[];
}

export const AppointmentCardV2 = memo(function AppointmentCardV2({
  appointment,
  shopId,
  isToday = false,
  shopHours = [],
  calendarSettings = {
    buffer_time_minutes: 0,
    default_appointment_duration: 30,
  },
  existingAppointments = [],
}: AppointmentCardV2Props) {
  const [expanded, setExpanded] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);

  const { updateAppointment } = useAppointments();
  const queryClient = useQueryClient();

  const statusIcon = getAppointmentStatusIcon(appointment.status);
  const statusColor = getAppointmentStatusColor(appointment.status);
  const timeDisplay = getAppointmentTimeDisplay(appointment);

  // Check if appointment has passed (using end time)
  const hasAppointmentPassed = isDateTimeInPast(
    appointment.date,
    appointment.end_time
  );

  // Only show action buttons for pending/confirmed appointments that haven't ended yet
  const isActive =
    ['pending', 'confirmed'].includes(appointment.status) &&
    !hasAppointmentPassed;

  const handleView = useCallback(() => {
    setDetailsDialogOpen(true);
  }, []);

  const handleReschedule = useCallback(() => {
    setRescheduleDialogOpen(true);
  }, []);

  const handleEditFromDetails = useCallback(
    (apt: Appointment, isReschedule?: boolean, sendEmailDefault?: boolean) => {
      setDetailsDialogOpen(false);
      if (isReschedule) {
        setRescheduleDialogOpen(true);
      }
    },
    []
  );

  const handleUpdateAppointment = useCallback(
    async (data: {
      clientId: string;
      date: string;
      startTime: string;
      endTime: string;
      type: 'consultation' | 'fitting' | 'pickup' | 'delivery' | 'other';
      notes?: string;
      status?: string;
      sendEmail?: boolean;
      timezone?: string;
    }) => {
      try {
        await updateAppointment(appointment.id, {
          id: appointment.id,
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          type: data.type,
          notes: data.notes || undefined,
          sendEmail: data.sendEmail,
        });
        setRescheduleDialogOpen(false);

        // Invalidate client appointment queries to refresh the data
        await queryClient.invalidateQueries({
          queryKey: clientAppointmentKeys.all(appointment.client_id),
        });
      } catch (error) {
        console.error('Failed to update appointment:', error);
      }
    },
    [appointment.id, appointment.client_id, updateAppointment, queryClient]
  );

  return (
    <>
      <Card
        variant="outlined"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        sx={{
          transition: 'all 0.2s ease-in-out',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'visible',
          ...(hovering && {
            boxShadow: 2,
            transform: 'translateY(-2px)',
            borderColor: 'primary.main',
          }),
          ...(isToday && {
            borderColor: 'primary.main',
            borderWidth: 2,
          }),
        }}
        onClick={() => setExpanded(!expanded)}
        role="article"
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Main Content Row */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
            }}
          >
            {/* Status Icon */}
            <Typography
              sx={{
                fontSize: 20,
                lineHeight: 1,
                color: `${statusColor}.main`,
                mt: 0.5,
              }}
            >
              {statusIcon}
            </Typography>

            {/* Content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Time and Type */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 0.5,
                  flexWrap: 'wrap',
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <AccessTimeIcon sx={{ fontSize: 16 }} />
                  {timeDisplay}
                </Typography>

                <Chip
                  label={appointment.status}
                  size="small"
                  color={statusColor as any}
                  variant={
                    appointment.status === 'canceled' ? 'outlined' : 'filled'
                  }
                  sx={{
                    height: 24,
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                />
              </Box>

              {/* Appointment Type */}
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1, textTransform: 'capitalize' }}
              >
                {appointment.type}
              </Typography>

              {/* Notes Preview or Status Message */}
              {appointment.status === 'pending' && (
                <Typography
                  variant="body2"
                  color="warning.main"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  ⏱ Awaiting confirmation
                </Typography>
              )}

              {appointment.notes && (
                <Fade in={!expanded} timeout={200}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: expanded ? 'none' : '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    📝 {appointment.notes}
                  </Typography>
                </Fade>
              )}

              {/* Expanded Content */}
              <Collapse in={expanded} timeout={300}>
                <Box sx={{ mt: 2 }}>
                  {appointment.notes && (
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 1,
                        mb: 2,
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          mb: 0.5,
                        }}
                      >
                        <NotesIcon sx={{ fontSize: 14 }} />
                        Notes
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ whiteSpace: 'pre-wrap' }}
                      >
                        {appointment.notes}
                      </Typography>
                    </Box>
                  )}

                  {/* Action Buttons */}
                  {isActive && (
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1,
                        pt: 1,
                        borderTop: 1,
                        borderColor: 'divider',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={handleView}
                        sx={{
                          flex: 1,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: 1,
                          },
                        }}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EventRepeatIcon />}
                        onClick={handleReschedule}
                        sx={{
                          flex: 1,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: 1,
                          },
                        }}
                      >
                        Reschedule
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={handleView}
                        sx={{
                          flex: 1,
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: 1,
                          },
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </Box>
              </Collapse>
            </Box>

            {/* Expand/Collapse Button */}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              sx={{
                ml: 'auto',
                transition: 'transform 0.2s ease-in-out',
                transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
              aria-label={expanded ? 'collapse' : 'expand'}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* Appointment Details Dialog */}
      <AppointmentDetailsDialog
        open={detailsDialogOpen}
        onClose={async () => {
          setDetailsDialogOpen(false);
          // Refresh appointment data when dialog closes
          await queryClient.invalidateQueries({
            queryKey: clientAppointmentKeys.all(appointment.client_id),
          });
        }}
        appointment={appointment}
        onEdit={handleEditFromDetails}
      />

      {/* Reschedule Dialog */}
      <AppointmentDialog
        open={rescheduleDialogOpen}
        onClose={() => setRescheduleDialogOpen(false)}
        appointment={appointment}
        isReschedule={true}
        shopHours={shopHours}
        existingAppointments={existingAppointments}
        calendarSettings={calendarSettings}
        onUpdate={handleUpdateAppointment}
      />
    </>
  );
});
