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

function getPaymentStatusChip(
  paidAmount: number,
  totalAmount: number
): { label: string; color: 'success' | 'warning' | 'error' | 'default' } {
  const percentage = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

  if (percentage >= 100) {
    return { label: '✓ PAID', color: 'success' };
  } else if (percentage > 0) {
    return { label: '◉ PARTIAL', color: 'warning' };
  } else {
    return { label: '○ UNPAID', color: 'error' };
  }
}

function getDueDateInfo(dueDate: string | null) {
  if (!dueDate) return null;

  const due = new Date(dueDate);
  const today = new Date();
  const daysUntilDue = differenceInDays(due, today);

  return {
    date: format(due, 'MMM d'),
    daysUntilDue,
    isOverdue: daysUntilDue < 0,
    isUrgent: daysUntilDue >= 0 && daysUntilDue <= 3,
  };
}

export default function OrderCardMinimal({
  order,
  onClick,
}: OrderCardMinimalProps) {
  const clientName = order.client
    ? `${order.client.first_name} ${order.client.last_name}`
    : 'No Client';

  // Calculate payment progress
  const totalAmount = order.total_cents || 0;
  const paidAmount = order.paid_amount_cents || 0;
  const paymentProgress =
    totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  const paymentStatus = getPaymentStatusChip(paidAmount, totalAmount);

  // Get garment status
  const garmentCount = order.garments?.length || 0;
  const readyCount =
    order.garments?.filter((g: any) => g.stage === 'Ready For Pickup').length ||
    0;

  // Get due date info
  const dueDateInfo = getDueDateInfo(order.order_due_date);

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
            gridTemplateColumns: 'auto 1fr auto auto auto 40px',
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

          {/* Due Date with urgency */}
          <Box sx={{ textAlign: 'center', minWidth: 60 }}>
            {dueDateInfo ? (
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
            ) : (
              <Typography variant="body2" color="text.secondary">
                No date
              </Typography>
            )}
          </Box>

          {/* Payment Progress */}
          <Box sx={{ minWidth: 120 }}>
            <Typography variant="body2" textAlign="right">
              {formatUSD(paidAmount)}/{formatUSD(totalAmount)}
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
              label={paymentStatus.label}
              color={paymentStatus.color}
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
