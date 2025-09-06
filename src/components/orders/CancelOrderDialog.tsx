'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Alert,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import { useState } from 'react';
import { formatCurrency } from '@/lib/utils/formatting';
import type { Database } from '@/types/supabase';

interface CancelOrderDialogProps {
  open: boolean;
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
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

export default function CancelOrderDialog({
  open,
  order,
  garments = [],
  onClose,
  onConfirm,
  isLoading = false,
}: CancelOrderDialogProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Analyze order state to determine warning level
  const getOrderAnalysis = () => {
    const stageGroups = {
      new: garments.filter((g) => g.stage === 'New').length,
      inProgress: garments.filter((g) => g.stage === 'In Progress').length,
      readyForPickup: garments.filter((g) => g.stage === 'Ready For Pickup')
        .length,
      done: garments.filter((g) => g.stage === 'Done').length,
    };

    const workStarted =
      stageGroups.inProgress + stageGroups.readyForPickup + stageGroups.done;
    const workCompleted = stageGroups.readyForPickup + stageGroups.done;

    if (workCompleted > 0) {
      return {
        level: 'error' as const,
        title: 'Work Completed',
        message:
          'This order has completed work that may need to be handled carefully.',
        details: [
          `${stageGroups.readyForPickup} garment(s) ready for pickup`,
          `${stageGroups.done} garment(s) already picked up`,
          `Total order value: ${formatCurrency(order.total_cents)}`,
        ].filter((detail) => !detail.startsWith('0 ')),
        recommendation: 'Consider contacting the customer before cancelling.',
      };
    } else if (workStarted > 0) {
      return {
        level: 'warning' as const,
        title: 'Work in Progress',
        message: 'This order has work in progress.',
        details: [
          `${stageGroups.inProgress} garment(s) currently being worked on`,
          `Estimated work value: ${formatCurrency(order.total_cents * (workStarted / garments.length))}`,
        ].filter((detail) => !detail.startsWith('0 ')),
        recommendation:
          'You may want to communicate with the customer about work completed.',
      };
    } else {
      return {
        level: 'info' as const,
        title: 'No Work Started',
        message: 'This order has no work started yet.',
        details: [`${garments.length} garment(s) in New stage`],
        recommendation: 'This order can be cancelled with minimal impact.',
      };
    }
  };

  const analysis = getOrderAnalysis();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason('');
      onClose();
    } catch (error) {
      // Error handling is done by the parent component
      console.error('Error cancelling order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !isLoading) {
      setReason('');
      onClose();
    }
  };

  const getWarningIcon = () => {
    switch (analysis.level) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
      default:
        return <InfoIcon color="info" />;
    }
  };

  const getWarningColor = () => {
    switch (analysis.level) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getWarningIcon()}
          <Typography variant="h6" component="span">
            Cancel Order {order.order_number}?
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity={getWarningColor()} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            {analysis.title}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {analysis.message}
          </Typography>

          {analysis.details.length > 0 && (
            <List dense sx={{ mt: 1, mb: 1 }}>
              {analysis.details.map((detail, index) => (
                <ListItem key={index} sx={{ py: 0, px: 0 }}>
                  <ListItemText
                    primary={`• ${detail}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          )}

          <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 1 }}>
            {analysis.recommendation}
          </Typography>
        </Alert>

        <TextField
          label="Cancellation Reason (Optional)"
          multiline
          rows={3}
          fullWidth
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Add a reason for cancellation (optional)..."
          inputProps={{ maxLength: 500 }}
          helperText={`${reason.length}/500 characters`}
          sx={{ mb: 2 }}
        />

        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Note:</strong> This action can be undone. You can restore
            the order later if needed. Services cannot be modified while the
            order is cancelled.
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleClose}
          disabled={isSubmitting || isLoading}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || isLoading}
          color="error"
          variant="contained"
          startIcon={
            isSubmitting || isLoading ? (
              <CircularProgress size={16} color="inherit" />
            ) : undefined
          }
          sx={{ minWidth: 120 }}
        >
          {isSubmitting || isLoading ? 'Cancelling...' : 'Confirm Cancel'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
