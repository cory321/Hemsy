'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { format, differenceInDays } from 'date-fns';
import {
  getOrderStatusColor,
  getOrderStatusLabel,
} from '@/lib/utils/orderStatus';
import {
  calculatePaymentStatus,
  type PaymentInfo,
} from '@/lib/utils/payment-calculations';
import {
  isOrderOverdue,
  getOrderEffectiveDueDate,
  type OrderOverdueInfo,
} from '@/lib/utils/overdue-logic';

interface OrderCardMinimalProps {
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

function getPaymentStatusChip(paymentStatus: string): {
  label: string;
  color: 'success' | 'warning' | 'error' | 'default';
} {
  switch (paymentStatus) {
    case 'paid':
      return { label: '✓ PAID', color: 'success' };
    case 'partially_paid':
      return { label: '◉ PARTIAL', color: 'warning' };
    case 'overpaid':
      return { label: '⚠ REFUND', color: 'warning' };
    case 'unpaid':
    default:
      return { label: '○ UNPAID', color: 'error' };
  }
}

function getDueDateInfo(orderDueDate: string | null, garments: any[]) {
  // Get effective due date from order or garments
  const effectiveDueDate = getOrderEffectiveDueDate({
    order_due_date: orderDueDate,
    garments: garments.map((g) => ({
      ...g,
      garment_services: g.garment_services || [],
    })),
  });

  if (!effectiveDueDate) return null;

  const due = new Date(effectiveDueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const daysUntilDue = differenceInDays(due, today);

  // Check if the order is truly overdue (considering service completion)
  const orderIsOverdue = isOrderOverdue({
    order_due_date: orderDueDate,
    garments: garments.map((g) => ({
      ...g,
      garment_services: g.garment_services || [],
    })),
  });

  return {
    date: format(due, 'MMM d'),
    fullDate: format(due, 'MMM d, yyyy'),
    daysUntilDue,
    isOverdue: orderIsOverdue,
    isUrgent: daysUntilDue >= 0 && daysUntilDue <= 3,
    isToday: daysUntilDue === 0,
    isTomorrow: daysUntilDue === 1,
  };
}

function getEarliestEventDate(garments: any[]) {
  const eventDates = garments
    .map((g) => g.event_date)
    .filter((date) => date != null)
    .map((date) => new Date(date))
    .sort((a, b) => a.getTime() - b.getTime());

  if (eventDates.length === 0) return null;

  const event = eventDates[0];
  if (!event) return null; // Type guard

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  event.setHours(0, 0, 0, 0);
  const daysUntil = differenceInDays(event, today);

  return {
    date: format(event, 'MMM d'),
    daysUntil,
    isToday: daysUntil === 0,
    isTomorrow: daysUntil === 1,
    isUrgent: daysUntil >= 0 && daysUntil <= 3,
  };
}

export default function OrderCardMinimal({
  order,
  onClick,
}: OrderCardMinimalProps) {
  const clientName = order.client
    ? `${order.client.first_name} ${order.client.last_name}`
    : 'No Client';

  // Calculate payment progress using centralized utility
  const totalAmount = order.total_cents || 0;
  const paidAmount = order.paid_amount_cents || 0;

  // Create a simplified payment info for the card (server already calculated net amount)
  const paymentInfo: PaymentInfo[] = [
    {
      id: 'summary',
      amount_cents: paidAmount,
      refunded_amount_cents: 0,
      status: 'completed',
    },
  ];

  const paymentCalc = calculatePaymentStatus(totalAmount, paymentInfo);
  const { netPaid, percentage: paymentProgress, paymentStatus } = paymentCalc;
  const paymentStatusChip = getPaymentStatusChip(paymentStatus);

  // Get garment status using the correct stages
  const garmentCount = order.garments?.length || 0;
  const readyCount =
    order.garments?.filter((g: any) => g.stage === 'Ready For Pickup').length ||
    0;
  const inProgressCount =
    order.garments?.filter((g: any) => g.stage === 'In Progress').length || 0;

  // Get due date info
  const dueDateInfo = getDueDateInfo(
    order.order_due_date,
    order.garments || []
  );

  // Get event date info
  const eventDateInfo = getEarliestEventDate(order.garments || []);

  return (
    <Card
      sx={{
        cursor: 'pointer',
        '&:hover': {
          bgcolor: 'action.hover',
        },
        p: 0,
      }}
      onClick={() => onClick(order.id)}
    >
      <CardContent
        sx={{ p: '12px !important', '&:last-child': { pb: '12px !important' } }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto auto auto auto 40px',
            gap: 2,
            alignItems: 'center',
          }}
        >
          {/* Order Number */}
          <Box sx={{ minWidth: 60 }}>
            <Typography variant="body2" fontWeight="bold">
              #{order.order_number?.slice(-4) || order.id.slice(0, 4)}
            </Typography>
          </Box>

          {/* Client & Garments */}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" noWrap fontWeight="medium">
              {clientName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {garmentCount} garment{garmentCount !== 1 ? 's' : ''}
              {readyCount > 0 && ` (${readyCount} ready)`}
            </Typography>
          </Box>

          {/* Due Date with urgency (or Event Date if more urgent) */}
          <Box sx={{ textAlign: 'center', minWidth: 60 }}>
            {(() => {
              // Show event date if it's more urgent than due date or if there's no due date
              const showEventInstead =
                eventDateInfo &&
                (!dueDateInfo ||
                  ((eventDateInfo.isToday || eventDateInfo.isTomorrow) &&
                    !(dueDateInfo.isOverdue || dueDateInfo.isToday)));

              if (showEventInstead && eventDateInfo) {
                return (
                  <>
                    <Typography
                      variant="body2"
                      color={
                        eventDateInfo.isToday
                          ? 'error.main'
                          : eventDateInfo.isTomorrow
                            ? 'warning.main'
                            : eventDateInfo.isUrgent
                              ? 'warning.main'
                              : 'text.primary'
                      }
                      fontWeight={
                        eventDateInfo.isToday || eventDateInfo.isTomorrow
                          ? 'bold'
                          : 'normal'
                      }
                    >
                      EVENT
                    </Typography>
                    <Typography
                      variant="caption"
                      color={
                        eventDateInfo.isToday
                          ? 'error.main'
                          : eventDateInfo.isTomorrow
                            ? 'warning.main'
                            : 'text.secondary'
                      }
                    >
                      {eventDateInfo.isToday
                        ? 'Today!'
                        : eventDateInfo.isTomorrow
                          ? 'Tomorrow'
                          : eventDateInfo.date}
                    </Typography>
                  </>
                );
              } else if (dueDateInfo) {
                return (
                  <>
                    <Typography
                      variant="body2"
                      color={
                        dueDateInfo.isOverdue
                          ? 'error.main'
                          : dueDateInfo.isUrgent
                            ? 'warning.main'
                            : 'text.primary'
                      }
                      fontWeight={
                        dueDateInfo.isUrgent || dueDateInfo.isOverdue
                          ? 'bold'
                          : 'normal'
                      }
                    >
                      {dueDateInfo.date}
                    </Typography>
                    <Typography
                      variant="caption"
                      color={
                        dueDateInfo.isOverdue
                          ? 'error.main'
                          : dueDateInfo.isUrgent
                            ? 'warning.main'
                            : 'text.secondary'
                      }
                    >
                      {dueDateInfo.isOverdue
                        ? `${Math.abs(dueDateInfo.daysUntilDue)} overdue`
                        : dueDateInfo.daysUntilDue === 0
                          ? 'Today'
                          : `${dueDateInfo.daysUntilDue} days`}
                    </Typography>
                  </>
                );
              } else {
                return (
                  <Typography variant="body2" color="text.secondary">
                    No date
                  </Typography>
                );
              }
            })()}
          </Box>

          {/* Payment Progress */}
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="body2" textAlign="right">
              {formatUSD(netPaid)}/{formatUSD(totalAmount)}
            </Typography>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
            >
              <LinearProgress
                variant="determinate"
                value={Math.min(paymentProgress, 100)}
                sx={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  bgcolor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    bgcolor:
                      paymentProgress >= 100
                        ? 'success.main'
                        : paymentProgress > 0
                          ? 'warning.main'
                          : 'grey.400',
                  },
                }}
              />
            </Box>
          </Box>

          {/* Payment Status */}
          <Box>
            <Chip
              label={paymentStatusChip.label}
              color={paymentStatusChip.color}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 'bold',
                '& .MuiChip-label': {
                  px: 1,
                },
              }}
            />
          </Box>

          {/* Order Status */}
          <Box>
            <Chip
              label={getOrderStatusLabel(order.status || 'new')}
              color={getOrderStatusColor(order.status || 'new')}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 'bold',
                '& .MuiChip-label': {
                  px: 1,
                },
              }}
            />
          </Box>

          {/* Action */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {(dueDateInfo?.isUrgent || dueDateInfo?.isOverdue) && (
              <WarningAmberIcon
                sx={{
                  mr: 0.5,
                  fontSize: 18,
                  color: dueDateInfo.isOverdue ? 'error.main' : 'warning.main',
                }}
              />
            )}
            {readyCount > 0 && (
              <CheckCircleIcon
                sx={{
                  mr: 0.5,
                  fontSize: 18,
                  color: 'success.main',
                }}
              />
            )}
            <IconButton size="small">
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
