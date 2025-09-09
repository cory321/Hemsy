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
import {
  safeParseDate,
  calculateDaysUntilDue,
} from '@/lib/utils/date-time-utils';

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
    .filter((date): date is string => date != null)
    .sort((a, b) => a.localeCompare(b));

  if (eventDates.length === 0) return null;

  const eventDateStr = eventDates[0];
  if (!eventDateStr) return null; // Type guard

  const eventDate = safeParseDate(eventDateStr);
  const daysUntil = calculateDaysUntilDue(eventDateStr);

  return {
    date: format(eventDate, 'MMM d'),
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
        opacity: order.status === 'cancelled' ? 0.6 : 1,
        filter: order.status === 'cancelled' ? 'grayscale(50%)' : 'none',
        borderColor: order.status === 'cancelled' ? 'error.main' : 'divider',
        borderStyle: order.status === 'cancelled' ? 'dashed' : 'solid',
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
        {(() => {
          // Fixed grid template ensures consistent column alignment across cards
          const gridTemplateColumns = '72px 1fr 140px 160px 120px 120px 40px';
          return (
            <Box
              data-testid="order-card-minimal-grid"
              data-grid-template-columns={gridTemplateColumns}
              sx={{
                display: 'grid',
                gridTemplateColumns,
                gap: 2,
                alignItems: 'center',
              }}
            >
              {/* Order Number */}
              <Box
                data-testid="order-col-number"
                sx={{ minWidth: 0, justifySelf: 'start' }}
              >
                <Typography variant="body2" fontWeight="bold">
                  #{order.order_number?.slice(-3) || order.id.slice(0, 4)}
                </Typography>
              </Box>

              {/* Client & Garments */}
              <Box data-testid="order-col-client" sx={{ minWidth: 0 }}>
                <Typography variant="body2" noWrap fontWeight="medium">
                  {clientName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {garmentCount} garment{garmentCount !== 1 ? 's' : ''}
                  {readyCount > 0 && ` (${readyCount} ready)`}
                </Typography>
              </Box>

              {/* Due Date with urgency (or Event Date if more urgent) */}
              <Box
                data-testid="order-col-date"
                sx={{ textAlign: 'center', minWidth: 0, justifySelf: 'center' }}
              >
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
                            ? 'Event today'
                            : eventDateInfo.isTomorrow
                              ? 'Event tomorrow'
                              : eventDateInfo.daysUntil >= 0
                                ? `Event in ${eventDateInfo.daysUntil} day${eventDateInfo.daysUntil === 1 ? '' : 's'}`
                                : `Event ${Math.abs(eventDateInfo.daysUntil)} day${Math.abs(eventDateInfo.daysUntil) === 1 ? '' : 's'} ago`}
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
                          {dueDateInfo.daysUntilDue < 0
                            ? `Overdue by ${Math.abs(dueDateInfo.daysUntilDue)} day${Math.abs(dueDateInfo.daysUntilDue) === 1 ? '' : 's'}`
                            : dueDateInfo.isToday
                              ? 'Due today'
                              : dueDateInfo.isTomorrow
                                ? 'Due tomorrow'
                                : `Due in ${dueDateInfo.daysUntilDue} day${dueDateInfo.daysUntilDue === 1 ? '' : 's'}`}
                        </Typography>
                      </>
                    );
                  } else {
                    return (
                      <Typography variant="body2" color="text.secondary">
                        No due date
                      </Typography>
                    );
                  }
                })()}
              </Box>

              {/* Payment Progress */}
              <Box
                data-testid="order-col-payment"
                sx={{
                  minWidth: 0,
                  justifySelf: 'end',
                  width: '100%',
                  maxWidth: 140,
                }}
              >
                <Typography variant="body2" textAlign="right">
                  {formatUSD(netPaid)}/{formatUSD(totalAmount)}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mt: 0.5,
                  }}
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
              <Box
                data-testid="order-col-payment-status"
                sx={{ justifySelf: 'center' }}
              >
                <Chip
                  label={paymentStatusChip.label}
                  color={paymentStatusChip.color}
                  size="small"
                  sx={{
                    height: 22,
                    width: 110,
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    '& .MuiChip-label': {
                      px: 1,
                      width: '100%',
                      textAlign: 'center',
                    },
                  }}
                />
              </Box>

              {/* Order Status */}
              <Box
                data-testid="order-col-order-status"
                sx={{ justifySelf: 'center' }}
              >
                <Chip
                  label={getOrderStatusLabel(order.status || 'new')}
                  color={getOrderStatusColor(order.status || 'new')}
                  size="small"
                  sx={{
                    height: 22,
                    width: 110,
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    '& .MuiChip-label': {
                      px: 1,
                      width: '100%',
                      textAlign: 'center',
                    },
                  }}
                />
              </Box>

              {/* Action */}
              <Box
                data-testid="order-col-action"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifySelf: 'end',
                }}
              >
                {(dueDateInfo?.isUrgent || dueDateInfo?.isOverdue) && (
                  <WarningAmberIcon
                    sx={{
                      mr: 0.5,
                      fontSize: 18,
                      color: dueDateInfo.isOverdue
                        ? 'error.main'
                        : 'warning.main',
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
          );
        })()}
      </CardContent>
    </Card>
  );
}
