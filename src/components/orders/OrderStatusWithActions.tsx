'use client';

import {
  Box,
  Typography,
  Button,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import RestoreIcon from '@mui/icons-material/Restore';
import InfoIcon from '@mui/icons-material/Info';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { cancelOrder, restoreOrder } from '@/lib/actions/orders-cancellation';
import { getOrderStatusLabel } from '@/lib/utils/orderStatus';
import CancelOrderDialog from './CancelOrderDialog';
import type { Database } from '@/types/supabase';

interface OrderStatusWithActionsProps {
  order: {
    id: string;
    order_number: string;
    status: Database['public']['Enums']['order_status'];
    total_cents: number;
    created_at: string;
    order_due_date?: string | null;
  };
  garments?: Array<{
    id: string;
    name: string;
    stage: Database['public']['Enums']['garment_stage_enum'] | null;
  }>;
}

export default function OrderStatusWithActions({
  order,
  garments = [],
}: OrderStatusWithActionsProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const canCancel =
    order.status !== 'completed' && order.status !== 'cancelled';
  const canRestore = order.status === 'cancelled';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'default';
      case 'active':
        return 'info';
      case 'ready_for_pickup':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const statusColor = getStatusColor(order.status);

  const handleCancelOrder = async (reason: string) => {
    setIsLoading(true);
    try {
      const result = await cancelOrder({
        orderId: order.id,
        cancellationReason: reason || undefined,
      });

      if ('success' in result && result.success) {
        toast.success('Order cancelled successfully');
        router.refresh();
      } else if ('errors' in result) {
        const errorMessage =
          result.errors.root?.[0] || 'Failed to cancel order';
        toast.error(errorMessage);
      } else {
        toast.error(result.error || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreOrder = async () => {
    setIsLoading(true);
    try {
      const result = await restoreOrder({
        orderId: order.id,
      });

      if ('success' in result && result.success) {
        toast.success(
          `Order restored successfully. Status is now ${result.calculatedStatus?.replace('_', ' ')}.`
        );
        router.refresh();
      } else if ('errors' in result) {
        const errorMessage =
          result.errors.root?.[0] || 'Failed to restore order';
        toast.error(errorMessage);
      } else {
        toast.error(result.error || 'Failed to restore order');
      }
    } catch (error) {
      console.error('Error restoring order:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getContextualWarning = () => {
    if (!canCancel || order.status === 'new') return null;

    const workStarted = garments.some(
      (g) =>
        g.stage === 'In Progress' ||
        g.stage === 'Ready For Pickup' ||
        g.stage === 'Done'
    );

    const workCompleted = garments.some(
      (g) => g.stage === 'Ready For Pickup' || g.stage === 'Done'
    );

    if (workCompleted) {
      return (
        <Tooltip title="This order has completed work. Cancelling may impact customer satisfaction.">
          <InfoIcon sx={{ fontSize: 16, color: 'error.main', ml: 0.5 }} />
        </Tooltip>
      );
    } else if (workStarted) {
      return (
        <Tooltip title="This order has work in progress. Consider customer communication before cancelling.">
          <InfoIcon sx={{ fontSize: 16, color: 'warning.main', ml: 0.5 }} />
        </Tooltip>
      );
    }

    return null;
  };

  return (
    <>
      <Box sx={{ textAlign: 'right' }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontWeight: 500,
            fontSize: '0.7rem',
            display: 'block',
            mb: 0.5,
          }}
        >
          Order Status
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              lineHeight: 1.2,
              color:
                statusColor === 'success'
                  ? 'success.main'
                  : statusColor === 'warning'
                    ? 'warning.main'
                    : statusColor === 'info'
                      ? 'info.main'
                      : statusColor === 'error'
                        ? 'error.main'
                        : 'text.primary',
              textTransform: 'capitalize',
            }}
          >
            {getOrderStatusLabel(order.status)}
          </Typography>
          {getContextualWarning()}
        </Box>

        {/* Inline action button */}
        {(canCancel || canRestore) && (
          <Box sx={{ mt: 1 }}>
            {canCancel && (
              <Button
                size="small"
                variant="text"
                color="error"
                startIcon={
                  isLoading ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <CancelIcon sx={{ fontSize: 16 }} />
                  )
                }
                onClick={() => setShowCancelDialog(true)}
                disabled={isLoading}
                sx={{
                  fontSize: '0.75rem',
                  py: 0.5,
                  px: 1,
                  minHeight: 'auto',
                  textTransform: 'none',
                }}
              >
                Cancel Order
              </Button>
            )}

            {canRestore && (
              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={
                  isLoading ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <RestoreIcon sx={{ fontSize: 16 }} />
                  )
                }
                onClick={handleRestoreOrder}
                disabled={isLoading}
                sx={{
                  fontSize: '0.75rem',
                  py: 0.5,
                  px: 1.5,
                  minHeight: 'auto',
                  textTransform: 'none',
                }}
              >
                Restore
              </Button>
            )}
          </Box>
        )}

        {/* Date information */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.25,
            alignItems: 'flex-end',
            mt: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Created: {new Date(order.created_at).toLocaleDateString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Due:{' '}
            {order.order_due_date
              ? new Date(order.order_due_date).toLocaleDateString()
              : 'Not set'}
          </Typography>
        </Box>
      </Box>

      <CancelOrderDialog
        open={showCancelDialog}
        order={order}
        garments={garments}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancelOrder}
        isLoading={isLoading}
      />
    </>
  );
}
