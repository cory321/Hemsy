'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  Payment as PaymentIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Info as InfoIcon,
  Undo as RefundIcon,
} from '@mui/icons-material';
import {
  formatCurrency,
  formatDateTime,
  formatPaymentAge,
} from '@/lib/utils/formatting';
import { cancelPendingPayment } from '@/lib/actions/payments';
import { getPaymentStatusMessage } from '@/lib/actions/payment-status';
import RefundManagement from './RefundManagement';
import ManualRefundManagement from './ManualRefundManagement';

import toast from 'react-hot-toast';

interface Payment {
  id: string;
  type?: 'payment' | 'refund';
  payment_type: string; // Can be 'refund', 'remainder', 'deposit', etc.
  payment_method: string;
  amount_cents: number;
  refunded_amount_cents?: number;
  status: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  processed_at?: string;
  notes?: string;
  refund_method?: string;
  refund_type?: string;
  original_payment_id?: string;
  merchant_notes?: string;
}

interface PaymentManagementProps {
  payments: Payment[];
  onPaymentUpdate: () => void;
  onOptimisticRefund?: (
    paymentId: string,
    refundAmount: number,
    serverAction: () => Promise<any>
  ) => void;
}

export default function PaymentManagement({
  payments,
  onPaymentUpdate,
  onOptimisticRefund,
}: PaymentManagementProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const handleCancelClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedPayment) return;

    setCancelling(true);
    try {
      const result = await cancelPendingPayment(selectedPayment.id);
      if (result.success) {
        toast.success('Payment cancelled successfully');
        onPaymentUpdate();
        setCancelDialogOpen(false);
      } else {
        toast.error(result.error || 'Failed to cancel payment');
      }
    } catch (error) {
      toast.error('Failed to cancel payment');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusIcon = (payment: Payment) => {
    // Special handling for refunds
    if (payment.type === 'refund' || payment.payment_type === 'refund') {
      return <RefundIcon color="info" fontSize="small" />;
    }

    // Treat refunded/partially_refunded as completed for display
    const displayStatus =
      payment.status === 'refunded' || payment.status === 'partially_refunded'
        ? 'completed'
        : payment.status;

    switch (displayStatus) {
      case 'completed':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'pending':
        return <ScheduleIcon color="warning" fontSize="small" />;
      case 'failed':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'succeeded': // For refunds
        return <RefundIcon color="info" fontSize="small" />;
      default:
        return <InfoIcon color="info" fontSize="small" />;
    }
  };

  const getStatusColor = (payment: Payment) => {
    // Special handling for refunds
    if (payment.type === 'refund' || payment.payment_type === 'refund') {
      return 'info';
    }

    // Treat refunded/partially_refunded as completed for display
    const displayStatus =
      payment.status === 'refunded' || payment.status === 'partially_refunded'
        ? 'completed'
        : payment.status;

    switch (displayStatus) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'succeeded': // For refunds
        return 'info';
      default:
        return 'default';
    }
  };

  const canCancelPayment = (payment: Payment) => {
    return (
      payment.type !== 'refund' &&
      payment.payment_type !== 'refund' &&
      payment.status === 'pending' &&
      payment.payment_method === 'stripe' &&
      payment.stripe_payment_intent_id
    );
  };

  const canRefundPayment = (payment: Payment) => {
    if (payment.type === 'refund' || payment.payment_type === 'refund')
      return false;
    if (
      payment.payment_method !== 'stripe' ||
      !payment.stripe_payment_intent_id
    )
      return false;
    // Allow refund on completed/partially_refunded/refunded payments
    // We just won't show the refunded statuses in the UI
    if (
      payment.status !== 'completed' &&
      payment.status !== 'partially_refunded' &&
      payment.status !== 'refunded'
    )
      return false;

    // Check if there's remaining amount to refund
    const refundedAmount = payment.refunded_amount_cents || 0;
    const remainingRefundable = payment.amount_cents - refundedAmount;
    return remainingRefundable > 0;
  };

  const canManualRefund = (payment: Payment) => {
    if (payment.type === 'refund' || payment.payment_type === 'refund')
      return false;
    if (payment.payment_method === 'stripe') return false;
    // Allow refund on completed/partially_refunded/refunded payments
    // We just won't show the refunded statuses in the UI
    if (
      payment.status !== 'completed' &&
      payment.status !== 'partially_refunded' &&
      payment.status !== 'refunded'
    )
      return false;

    // Check if there's remaining amount to refund
    const refundedAmount = payment.refunded_amount_cents || 0;
    const remainingRefundable = payment.amount_cents - refundedAmount;
    return remainingRefundable > 0;
  };

  const isAlreadyRefunded = (payment: Payment) => {
    return (
      payment.status === 'refunded' || payment.status === 'partially_refunded'
    );
  };

  const isFullyRefunded = (payment: Payment) => {
    return payment.status === 'refunded';
  };

  const getDisplayStatus = (payment: Payment) => {
    if (payment.type === 'refund' || payment.payment_type === 'refund') {
      // Show succeeded status for refunds instead of just "refund"
      return payment.status === 'succeeded' ? 'refund' : payment.status;
    }
    // Don't show refunded or partially_refunded status for original payments
    // Keep them as completed for clear audit trail
    if (
      payment.status === 'refunded' ||
      payment.status === 'partially_refunded'
    ) {
      return 'completed';
    }
    return payment.status;
  };

  const getDisplayType = (payment: Payment) => {
    if (payment.type === 'refund' || payment.payment_type === 'refund') {
      // For refunds, check if we have a specific refund_type that's not just "refund"
      if (
        payment.refund_type &&
        payment.refund_type.toLowerCase() !== 'refund' &&
        payment.refund_type !== 'full' &&
        payment.refund_type !== 'partial'
      ) {
        return `${payment.refund_type} refund`;
      }
      // Otherwise just show "refund"
      return 'refund';
    }
    return payment.payment_type;
  };

  const getRefundMethodLabel = (method: string) => {
    switch (method) {
      case 'stripe':
        return 'Stripe Refund';
      case 'cash':
        return 'Cash Refund';
      case 'external_pos':
        return 'POS Refund';
      case 'other':
        return 'Other Refund';
      default:
        return method;
    }
  };

  // Use the improved formatPaymentAge utility function

  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const completedPayments = payments.filter((p) => p.status === 'completed');
  const failedPayments = payments.filter((p) => p.status === 'failed');

  return (
    <Box>
      {/* Pending Payments Alert */}
      {pendingPayments.length > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            pendingPayments.some((p) => canCancelPayment(p)) ? (
              <Button
                color="inherit"
                size="small"
                onClick={() =>
                  handleCancelClick(
                    pendingPayments.find((p) => canCancelPayment(p))!
                  )
                }
              >
                Cancel Pending
              </Button>
            ) : undefined
          }
        >
          <Typography variant="body2">
            {pendingPayments.length} payment
            {pendingPayments.length > 1 ? 's' : ''} in progress.
            {pendingPayments.some((p) => canCancelPayment(p))
              ? ' You can cancel pending Stripe payments if needed.'
              : null}
          </Typography>
        </Alert>
      )}

      {/* Payment History Table */}
      <Card>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <PaymentIcon />
            Payment History
          </Typography>

          {payments.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ textAlign: 'center', py: 3 }}
            >
              No payments recorded yet
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payments
                    .sort(
                      (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                    )
                    .map((payment) => (
                      <TableRow
                        key={payment.id}
                        sx={{
                          backgroundColor:
                            payment.status === 'pending'
                              ? 'warning.light'
                              : 'inherit',
                          opacity: payment.status === 'failed' ? 0.7 : 1,
                        }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="body2">
                              {formatDateTime(
                                payment.processed_at || payment.created_at
                              )}
                            </Typography>
                            {payment.status === 'pending' && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {formatPaymentAge(payment.created_at)}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>
                          {getDisplayType(payment)}
                        </TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>
                          {(payment.type === 'refund' ||
                            payment.payment_type === 'refund') &&
                          payment.refund_method
                            ? getRefundMethodLabel(payment.refund_method)
                            : payment.payment_method.replace('_', ' ')}
                        </TableCell>
                        <TableCell align="right">
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: 0.5,
                            }}
                          >
                            {/* Show pending icon for pending payments */}
                            {payment.status === 'pending' && (
                              <Tooltip title="Payment pending" arrow>
                                <ScheduleIcon
                                  sx={{
                                    fontSize: '1.25rem',
                                    color: 'warning.main',
                                    mr: 0.5,
                                  }}
                                />
                              </Tooltip>
                            )}
                            {/* Show amount with + for payments and - for refunds */}
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                color:
                                  payment.type === 'refund' ||
                                  payment.payment_type === 'refund'
                                    ? 'error.main'
                                    : payment.status === 'failed'
                                      ? 'text.disabled'
                                      : 'success.main',
                              }}
                            >
                              {payment.type === 'refund' ||
                              payment.payment_type === 'refund'
                                ? `− ${formatCurrency(Math.abs(payment.amount_cents))}`
                                : `+ ${formatCurrency(payment.amount_cents)}`}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            {getStatusIcon(payment)}
                            <Chip
                              label={getDisplayStatus(payment)}
                              size="small"
                              color={getStatusColor(payment) as any}
                            />
                          </Box>
                          {(payment.notes || payment.merchant_notes) && (
                            <Typography
                              variant="caption"
                              display="block"
                              color="text.secondary"
                            >
                              {payment.notes || payment.merchant_notes}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 0.5,
                              justifyContent: 'center',
                            }}
                          >
                            {canCancelPayment(payment) && (
                              <Tooltip title="Cancel this payment attempt">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleCancelClick(payment)}
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canRefundPayment(payment) && (
                              <RefundManagement
                                payment={payment}
                                onRefundComplete={onPaymentUpdate}
                                {...(onOptimisticRefund && {
                                  onOptimisticRefund,
                                })}
                              />
                            )}
                            {canManualRefund(payment) && (
                              <ManualRefundManagement
                                payment={payment}
                                onRefundComplete={onPaymentUpdate}
                                {...(onOptimisticRefund && {
                                  onOptimisticRefund,
                                })}
                              />
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Cancel Payment Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Cancel Payment</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to cancel this payment attempt?
          </Typography>
          {selectedPayment && (
            <Box
              sx={{ mt: 2, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Payment Details:
              </Typography>
              <Typography variant="body2">
                <strong>Amount:</strong>{' '}
                {formatCurrency(selectedPayment.amount_cents)}
              </Typography>
              <Typography variant="body2">
                <strong>Type:</strong> {selectedPayment.payment_type}
              </Typography>
              <Typography variant="body2">
                <strong>Created:</strong>{' '}
                {formatPaymentAge(selectedPayment.created_at)}
              </Typography>
              {selectedPayment.stripe_payment_intent_id && (
                <Typography variant="body2">
                  <strong>Payment Intent:</strong>{' '}
                  {selectedPayment.stripe_payment_intent_id}
                </Typography>
              )}
            </Box>
          )}
          <Alert severity="info" sx={{ mt: 2 }}>
            This will cancel the payment on Stripe and mark it as failed in your
            system. The customer will not be charged.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCancelDialogOpen(false)}
            disabled={cancelling}
          >
            Keep Payment
          </Button>
          <Button
            onClick={handleConfirmCancel}
            color="error"
            variant="contained"
            disabled={cancelling}
            startIcon={
              cancelling ? <CircularProgress size={16} /> : <CancelIcon />
            }
          >
            {cancelling ? 'Cancelling...' : 'Cancel Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
