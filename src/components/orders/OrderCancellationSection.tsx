'use client';

import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import RestoreIcon from '@mui/icons-material/Restore';
import WarningIcon from '@mui/icons-material/Warning';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { cancelOrder, restoreOrder } from '@/lib/actions/orders-cancellation';
import CancelOrderDialog from './CancelOrderDialog';
import type { Database } from '@/types/supabase';

interface OrderCancellationSectionProps {
  order: {
    id: string;
    order_number: string;
    status: Database['public']['Enums']['order_status'];
    total_cents: number;
  };
  garments?: Array<{
    id: string;
    name: string;
    stage: Database['public']['Enums']['garment_stage_enum'] | null;
  }>;
}

export default function OrderCancellationSection({
  order,
  garments = [],
}: OrderCancellationSectionProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const canCancel =
    order.status !== 'completed' && order.status !== 'cancelled';
  const canRestore = order.status === 'cancelled';

  // If order can neither be cancelled nor restored, don't show the section
  if (!canCancel && !canRestore) {
    return null;
  }

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
        <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Warning:</strong> This order has completed work. Cancelling
            may impact customer satisfaction.
          </Typography>
        </Alert>
      );
    } else if (workStarted) {
      return (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Notice:</strong> This order has work in progress. Consider
            customer communication before cancelling.
          </Typography>
        </Alert>
      );
    }

    return null;
  };

  if (canRestore) {
    return (
      <Card
        sx={{
          mb: 3,
          borderColor: 'warning.main',
          borderWidth: 1,
          borderStyle: 'solid',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Chip
              label="CANCELLED"
              color="error"
              size="small"
              sx={{ fontWeight: 600 }}
            />
            <Typography variant="h6" color="text.secondary">
              Order Management
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This order has been cancelled. You can restore it to continue
            working on it.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            startIcon={
              isLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <RestoreIcon />
              )
            }
            onClick={handleRestoreOrder}
            disabled={isLoading}
            sx={{ minWidth: 140 }}
          >
            {isLoading ? 'Restoring...' : 'Restore Order'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Order Management
          </Typography>

          {getContextualWarning()}

          <Button
            variant="outlined"
            color="error"
            startIcon={
              isLoading ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <CancelIcon />
              )
            }
            onClick={() => setShowCancelDialog(true)}
            disabled={isLoading}
            sx={{ minWidth: 130 }}
          >
            {isLoading ? 'Processing...' : 'Cancel Order'}
          </Button>
        </CardContent>
      </Card>

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
