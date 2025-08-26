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
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { format, differenceInDays } from 'date-fns';
import { formatPhoneNumber } from '@/lib/utils/phone';
import { getStageColor } from '@/constants/garmentStages';
import type { GarmentStage } from '@/types';

interface OrderCardCompactProps {
  order: any;
  onClick: (orderId: string) => void;
}

function formatUSD(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format((cents || 0) / 100);
}

function getPaymentStatus(
  paidAmount: number,
  totalAmount: number
): { label: string; color: 'success' | 'warning' | 'error' | 'info' } {
  const percentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  if (percentage >= 100) {
    return { label: 'PAID IN FULL', color: 'success' };
  } else if (percentage > 50) {
    return { label: 'MOSTLY PAID', color: 'info' };
  } else if (percentage > 0) {
    return { label: 'PARTIAL PAID', color: 'warning' };
  } else {
    return { label: 'UNPAID', color: 'error' };
  }
}

function getDueDateInfo(orderDueDate: string | null, garments: any[]) {
  // First try order due date, then fall back to earliest garment due date
  let dueDate: string | null = orderDueDate;

  if (!dueDate) {
    // Find earliest garment due date
    const garmentDueDates = garments
      .map((g) => g.due_date)
      .filter((date) => date != null)
      .map((date) => new Date(date))
      .sort((a, b) => a.getTime() - b.getTime());

    if (garmentDueDates.length > 0 && garmentDueDates[0]) {
      const isoString = garmentDueDates[0].toISOString().split('T')[0];
      dueDate = isoString || null; // Convert back to YYYY-MM-DD format
    }
  }

  if (!dueDate) return null;

  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const daysUntilDue = differenceInDays(due, today);

  return {
    date: format(due, 'MMM d, yyyy'),
    shortDate: format(due, 'MMM d'),
    daysUntilDue,
    isOverdue: daysUntilDue < 0,
    isUrgent: daysUntilDue >= 0 && daysUntilDue <= 3,
    isToday: daysUntilDue === 0,
    isTomorrow: daysUntilDue === 1,
  };
}

function getEventDateInfo(garments: any[]) {
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

  return {
    date: format(earliestEvent, 'MMM d, yyyy'),
    shortDate: format(earliestEvent, 'MMM d'),
    daysUntilEvent,
    isPast: daysUntilEvent < 0,
    isUrgent: daysUntilEvent >= 0 && daysUntilEvent <= 3,
    isToday: daysUntilEvent === 0,
    isTomorrow: daysUntilEvent === 1,
  };
}

export default function OrderCardCompact({
  order,
  onClick,
}: OrderCardCompactProps) {
  const clientName = order.client
    ? `${order.client.first_name} ${order.client.last_name}`
    : 'No Client';
  const clientPhone = order.client?.phone_number;

  // Calculate payment progress
  const totalAmount = order.total_cents || 0;
  const paidAmount = order.paid_amount_cents || 0;
  const paymentProgress =
    totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  const remainingAmount = totalAmount - paidAmount;
  const paymentStatus = getPaymentStatus(paidAmount, totalAmount);

  // Get garment status using the correct stages
  const garmentCount = order.garments?.length || 0;
  const readyCount =
    order.garments?.filter((g: any) => g.stage === 'Ready For Pickup').length ||
    0;
  const inProgressCount =
    order.garments?.filter((g: any) => g.stage === 'In Progress').length || 0;
  const newCount =
    order.garments?.filter((g: any) => g.stage === 'New').length || 0;
  const doneCount =
    order.garments?.filter((g: any) => g.stage === 'Done').length || 0;

  // Get due date info
  const dueDateInfo = getDueDateInfo(
    order.order_due_date,
    order.garments || []
  );

  // Get event date info
  const eventDateInfo = getEventDateInfo(order.garments || []);

  // Determine urgency (from either due date or event date)
  const showUrgentBanner =
    (dueDateInfo && (dueDateInfo.isOverdue || dueDateInfo.isUrgent)) ||
    (eventDateInfo && (eventDateInfo.isToday || eventDateInfo.isTomorrow));

  return (
    <Card
      sx={{
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        border: showUrgentBanner ? 2 : 1,
        borderColor: showUrgentBanner
          ? dueDateInfo?.isOverdue
            ? 'error.main'
            : 'warning.main'
          : 'divider',
      }}
      onClick={() => onClick(order.id)}
    >
      <CardContent>
        {/* Header with Order Number and Due Date Alert */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            #{order.order_number || order.id.slice(0, 8)}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {showUrgentBanner && (
              <Chip
                icon={<WarningAmberIcon />}
                label={
                  dueDateInfo?.isOverdue
                    ? `${Math.abs(dueDateInfo.daysUntilDue)} DAYS OVERDUE`
                    : dueDateInfo?.isToday
                      ? 'DUE TODAY'
                      : `DUE IN ${dueDateInfo?.daysUntilDue} DAYS`
                }
                color={dueDateInfo?.isOverdue ? 'error' : 'warning'}
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            )}
            <IconButton size="small">
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Divider Line */}
        <Box
          sx={{
            height: 2,
            bgcolor: showUrgentBanner
              ? dueDateInfo?.isOverdue
                ? 'error.main'
                : 'warning.main'
              : 'divider',
            mx: -2,
            mb: 2,
          }}
        />

        {/* Client Info */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <PersonIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body1" fontWeight="medium">
              {clientName}
            </Typography>
          </Box>
          {clientPhone && (
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 3.25 }}
            >
              <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {formatPhoneNumber(clientPhone)}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Dates Row */}
        {(dueDateInfo || eventDateInfo) && (
          <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {dueDateInfo && !showUrgentBanner && (
              <Typography variant="body2" color="text.secondary">
                Due: {dueDateInfo.date}
              </Typography>
            )}
            {eventDateInfo && (
              <Typography
                variant="body2"
                color={
                  eventDateInfo.isToday || eventDateInfo.isTomorrow
                    ? 'warning.main'
                    : 'text.secondary'
                }
                fontWeight={
                  eventDateInfo.isToday || eventDateInfo.isTomorrow
                    ? 'medium'
                    : 'normal'
                }
              >
                Event: {eventDateInfo.date}
              </Typography>
            )}
          </Box>
        )}

        {/* Status Row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {/* Garment Status */}
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" fontWeight="medium">
                {garmentCount} garment{garmentCount !== 1 ? 's' : ''}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                |
              </Typography>
              {newCount > 0 && (
                <Chip
                  label={`${newCount} new`}
                  size="small"
                  sx={{
                    height: 24,
                    backgroundColor: getStageColor('New'),
                    color: 'white',
                    fontSize: '0.75rem',
                  }}
                />
              )}
              {inProgressCount > 0 && (
                <Chip
                  label={`${inProgressCount} in progress`}
                  size="small"
                  sx={{
                    height: 24,
                    backgroundColor: getStageColor('In Progress'),
                    color: 'white',
                    fontSize: '0.75rem',
                  }}
                />
              )}
              {readyCount > 0 && (
                <Chip
                  label={`${readyCount} ready`}
                  size="small"
                  sx={{
                    height: 24,
                    backgroundColor: getStageColor('Ready For Pickup'),
                    color: 'white',
                    fontSize: '0.75rem',
                  }}
                />
              )}
            </Stack>
          </Box>

          {/* Payment Status */}
          <Box sx={{ textAlign: 'right' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinearProgress
                variant="determinate"
                value={Math.min(paymentProgress, 100)}
                sx={{
                  width: 80,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor:
                      paymentProgress >= 100
                        ? 'success.main'
                        : paymentProgress > 50
                          ? 'info.main'
                          : paymentProgress > 0
                            ? 'warning.main'
                            : 'error.main',
                  },
                }}
              />
              <Typography variant="body2" fontWeight="bold">
                {formatUSD(paidAmount)}/{formatUSD(totalAmount)}
              </Typography>
            </Box>
            <Box sx={{ mt: 0.5 }}>
              <Chip
                label={paymentStatus.label}
                color={paymentStatus.color}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                }}
              />
              {remainingAmount > 0 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 1 }}
                >
                  {formatUSD(remainingAmount)} due
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
