'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Stack,
  Avatar,
  Tooltip,
  Divider,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorIcon from '@mui/icons-material/Error';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';
import { formatPhoneNumber } from '@/lib/utils/phone';
import { getStageColor, GARMENT_STAGES } from '@/constants/garmentStages';
import type { GarmentStage } from '@/types';

interface OrderCardDetailedProps {
  order: any;
  onClick: (orderId: string) => void;
}

interface GarmentProgressProps {
  garment: any;
}

function formatUSD(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format((cents || 0) / 100);
}

function getStageProgress(stage: string): number {
  // Map the actual stages used in the app to progress percentages
  const stageMap: Record<GarmentStage, number> = {
    New: 0,
    'In Progress': 40,
    'Ready For Pickup': 80,
    Done: 100,
  };
  return stageMap[stage as GarmentStage] || 0;
}

function GarmentProgress({ garment }: GarmentProgressProps) {
  const stage = (garment.stage || 'New') as GarmentStage;
  const progress = getStageProgress(stage);
  const stageColor = getStageColor(stage);
  const fillColor = garment.preset_fill_color || stageColor;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {/* Garment Icon */}
      <Avatar
        sx={{
          width: 24,
          height: 24,
          bgcolor: fillColor + '20',
          color: fillColor,
          fontSize: '0.875rem',
        }}
      >
        {garment.name?.[0] || '?'}
      </Avatar>

      {/* Garment Name */}
      <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
        {garment.name || 'Unnamed garment'}
      </Typography>

      {/* Stage with proper color */}
      <Chip
        label={stage}
        size="small"
        sx={{
          backgroundColor: stageColor,
          color: 'white',
          fontWeight: 500,
          minWidth: 100,
          fontSize: '0.75rem',
        }}
      />

      {/* Progress Bar with stage color */}
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          width: 80,
          height: 4,
          borderRadius: 2,
          bgcolor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            bgcolor: stageColor,
          },
        }}
      />

      {/* Percentage */}
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ minWidth: 35, textAlign: 'right' }}
      >
        {progress}%
      </Typography>
    </Box>
  );
}

function getDueDateDisplay(dueDate: string | null) {
  if (!dueDate)
    return {
      text: 'No due date',
      color: 'text.secondary',
      icon: null,
      urgent: false,
    };

  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const daysUntilDue = differenceInDays(due, today);

  if (daysUntilDue < 0) {
    return {
      text: `${Math.abs(daysUntilDue)} days overdue`,
      color: 'error.main',
      icon: <ErrorIcon sx={{ fontSize: 18 }} />,
      urgent: true,
    };
  } else if (isToday(due)) {
    return {
      text: 'Due today',
      color: 'warning.main',
      icon: <WarningAmberIcon sx={{ fontSize: 18 }} />,
      urgent: true,
    };
  } else if (isTomorrow(due)) {
    return {
      text: 'Due tomorrow',
      color: 'warning.main',
      icon: <WarningAmberIcon sx={{ fontSize: 18 }} />,
      urgent: true,
    };
  } else if (daysUntilDue <= 3) {
    return {
      text: `Due in ${daysUntilDue} days`,
      color: 'warning.main',
      icon: <WarningAmberIcon sx={{ fontSize: 18 }} />,
      urgent: true,
    };
  } else {
    return {
      text: format(due, 'MMM d, yyyy'),
      color: 'text.primary',
      icon: null,
      urgent: false,
    };
  }
}

function getEventDateDisplay(garments: any[]) {
  // Find the earliest event date from all garments
  const eventDates = garments
    .map((g) => g.event_date)
    .filter((date) => date != null)
    .map((date) => new Date(date))
    .sort((a, b) => a.getTime() - b.getTime());

  if (eventDates.length === 0) {
    return null;
  }

  const earliestEvent = eventDates[0];
  if (!earliestEvent) return null; // Type guard

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  earliestEvent.setHours(0, 0, 0, 0);
  const daysUntilEvent = differenceInDays(earliestEvent, today);

  let text: string;
  let color: string;

  if (daysUntilEvent < 0) {
    text = `Event was ${format(earliestEvent, 'MMM d')}`;
    color = 'text.secondary';
  } else if (isToday(earliestEvent)) {
    text = 'Event today!';
    color = 'error.main';
  } else if (isTomorrow(earliestEvent)) {
    text = 'Event tomorrow';
    color = 'warning.main';
  } else if (daysUntilEvent <= 7) {
    text = `Event in ${daysUntilEvent} days`;
    color = 'warning.main';
  } else {
    text = `Event: ${format(earliestEvent, 'MMM d, yyyy')}`;
    color = 'text.primary';
  }

  return { text, color };
}

export default function OrderCardDetailed({
  order,
  onClick,
}: OrderCardDetailedProps) {
  const clientName = order.client
    ? `${order.client.first_name} ${order.client.last_name}`
    : 'No Client';
  const clientPhone = order.client?.phone_number;

  // Calculate payment info
  const totalAmount = order.total_cents || 0;
  const paidAmount = order.paid_amount_cents || 0;
  const remainingAmount = totalAmount - paidAmount;
  const paymentProgress =
    totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  // Get garment status summary using the correct stages
  const garments = order.garments || [];
  const readyCount = garments.filter(
    (g: any) => g.stage === 'Ready For Pickup'
  ).length;
  const inProgressCount = garments.filter(
    (g: any) => g.stage === 'In Progress'
  ).length;
  const newCount = garments.filter((g: any) => g.stage === 'New').length;
  const doneCount = garments.filter((g: any) => g.stage === 'Done').length;

  // Get due date display
  const dueDateDisplay = getDueDateDisplay(order.order_due_date);

  // Get event date display
  const eventDateDisplay = getEventDateDisplay(garments);

  // Determine if we should show urgency indicators (from either due date or event date)
  const showUrgencyBanner =
    dueDateDisplay.urgent ||
    (eventDateDisplay &&
      (eventDateDisplay.text.includes('today') ||
        eventDateDisplay.text.includes('tomorrow')));

  return (
    <Card
      sx={{
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        border: showUrgencyBanner ? 2 : 1,
        borderColor: showUrgencyBanner ? dueDateDisplay.color : 'divider',
        position: 'relative',
      }}
      onClick={() => onClick(order.id)}
    >
      {/* Urgency Banner */}
      {showUrgencyBanner && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 4,
            height: '100%',
            bgcolor: dueDateDisplay.color,
          }}
        />
      )}

      <CardContent sx={{ pl: showUrgencyBanner ? 3 : 2 }}>
        {/* Header Row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" component="div">
              ORDER #{order.order_number || order.id.slice(0, 8)}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                mt: 0.5,
                flexWrap: 'wrap',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {dueDateDisplay.icon}
                <Typography
                  variant="body2"
                  color={dueDateDisplay.color}
                  fontWeight={dueDateDisplay.urgent ? 'bold' : 'normal'}
                >
                  DUE: {dueDateDisplay.text}
                </Typography>
              </Box>
              {eventDateDisplay && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    •
                  </Typography>
                  <Typography
                    variant="body2"
                    color={eventDateDisplay.color}
                    fontWeight={
                      eventDateDisplay.text.includes('today') ||
                      eventDateDisplay.text.includes('tomorrow')
                        ? 'bold'
                        : 'normal'
                    }
                  >
                    {eventDateDisplay.text}
                  </Typography>
                </>
              )}
            </Box>
          </Box>
          <IconButton>
            <ChevronRightIcon />
          </IconButton>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Client Information */}
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
              <Typography variant="body1" fontWeight="medium">
                {clientName}
              </Typography>
            </Box>
            {clientPhone && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {formatPhoneNumber(clientPhone)}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Garments Progress Section */}
        {garments.length > 0 && (
          <Box
            sx={{
              p: 1.5,
              bgcolor: 'grey.50',
              borderRadius: 1,
              mb: 2,
            }}
          >
            <Stack spacing={1}>
              {garments.slice(0, 3).map((garment: any) => (
                <GarmentProgress key={garment.id} garment={garment} />
              ))}
              {garments.length > 3 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ pl: 4 }}
                >
                  +{garments.length - 3} more garment
                  {garments.length - 3 !== 1 ? 's' : ''}
                </Typography>
              )}
            </Stack>
          </Box>
        )}

        {/* Payment Section */}
        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            border: 1,
            borderColor: paymentProgress >= 100 ? 'success.main' : 'divider',
            bgcolor:
              paymentProgress >= 100 ? 'success.light' : 'background.paper',
          }}
        >
          <Stack spacing={1}>
            {/* Payment Header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoneyIcon
                  sx={{ fontSize: 20, color: 'text.secondary' }}
                />
                <Typography variant="body2" fontWeight="medium">
                  PAYMENT
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight="bold">
                {formatUSD(paidAmount)} / {formatUSD(totalAmount)}
              </Typography>
            </Box>

            {/* Payment Progress Bar */}
            <Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(paymentProgress, 100)}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor:
                      paymentProgress >= 100
                        ? 'success.main'
                        : paymentProgress > 0
                          ? 'warning.main'
                          : 'error.main',
                  },
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                {Math.round(paymentProgress)}% paid
              </Typography>
            </Box>

            {/* Payment Status */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Chip
                {...(paymentProgress >= 100 && { icon: <CheckCircleIcon /> })}
                label={
                  paymentProgress >= 100
                    ? 'PAID IN FULL'
                    : paymentProgress > 0
                      ? 'PARTIAL PAID'
                      : 'UNPAID'
                }
                color={
                  paymentProgress >= 100
                    ? 'success'
                    : paymentProgress > 0
                      ? 'warning'
                      : 'error'
                }
                size="small"
              />
              {remainingAmount > 0 && (
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  color="error.main"
                >
                  {formatUSD(remainingAmount)} DUE
                </Typography>
              )}
            </Box>
          </Stack>
        </Box>

        {/* Footer Status Tags */}
        <Box
          sx={{
            mt: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Stack direction="row" spacing={1}>
            {newCount > 0 && (
              <Chip
                label={`${newCount} new`}
                sx={{
                  backgroundColor: getStageColor('New'),
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 24,
                }}
                size="small"
              />
            )}
            {inProgressCount > 0 && (
              <Chip
                label={`${inProgressCount} in progress`}
                sx={{
                  backgroundColor: getStageColor('In Progress'),
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 24,
                }}
                size="small"
              />
            )}
            {readyCount > 0 && (
              <Chip
                label={`${readyCount} ready`}
                sx={{
                  backgroundColor: getStageColor('Ready For Pickup'),
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 24,
                }}
                size="small"
              />
            )}
            {doneCount > 0 && (
              <Chip
                label={`${doneCount} done`}
                sx={{
                  backgroundColor: getStageColor('Done'),
                  color: 'white',
                  fontSize: '0.7rem',
                  height: 24,
                }}
                size="small"
              />
            )}
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Created{' '}
            {order.created_at
              ? format(new Date(order.created_at), 'MMM d, yyyy')
              : 'N/A'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
