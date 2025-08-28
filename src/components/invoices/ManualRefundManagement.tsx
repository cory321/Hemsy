'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableRow,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Undo as RefundIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  AccountBalance as CashIcon,
  CreditCard as PosIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDateTime } from '@/lib/utils/formatting';
import { processManualRefund } from '@/lib/actions/payments';
import toast from 'react-hot-toast';

interface Payment {
  id: string;
  payment_type: string;
  payment_method: string;
  amount_cents: number;
  status: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  processed_at?: string;
  notes?: string;
  stripe_metadata?: any;
}

interface ManualRefundManagementProps {
  payment: Payment;
  onRefundComplete: () => void;
}

export default function ManualRefundManagement({
  payment,
  onRefundComplete,
}: ManualRefundManagementProps) {
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundForm, setRefundForm] = useState({
    amount: payment.amount_cents / 100,
    reason: '',
    type: 'full' as 'full' | 'partial',
    method:
      payment.payment_method === 'cash'
        ? 'cash'
        : ('external_pos' as 'cash' | 'external_pos' | 'other'),
  });

  const canManualRefund = () => {
    return (
      payment.status === 'completed' &&
      payment.payment_method !== 'stripe' &&
      !isAlreadyRefunded()
    );
  };

  const isAlreadyRefunded = () => {
    return (
      payment.status === 'refunded' || payment.status === 'partially_refunded'
    );
  };

  const handleRefundClick = () => {
    setRefundForm({
      amount: payment.amount_cents / 100,
      reason: '',
      type: 'full',
      method: payment.payment_method === 'cash' ? 'cash' : 'external_pos',
    });
    setRefundDialogOpen(true);
  };

  const handleRefundTypeChange = (type: 'full' | 'partial') => {
    setRefundForm((prev) => ({
      ...prev,
      type,
      amount: type === 'full' ? payment.amount_cents / 100 : 0,
    }));
  };

  const handleConfirmRefund = async () => {
    if (!payment.id) return;

    setRefunding(true);
    try {
      const refundAmountCents = Math.round(refundForm.amount * 100);

      // Validate refund amount
      if (refundAmountCents <= 0) {
        toast.error('Refund amount must be greater than $0');
        return;
      }

      if (refundAmountCents > payment.amount_cents) {
        toast.error('Refund amount cannot exceed payment amount');
        return;
      }

      // Reason is optional - will use default if not provided

      const result = await processManualRefund(
        payment.id,
        refundAmountCents,
        refundForm.reason.trim(),
        refundForm.method
      );

      if (result.success) {
        toast.success(
          `${refundForm.type === 'full' ? 'Full' : 'Partial'} refund recorded successfully`
        );
        setRefundDialogOpen(false);
        onRefundComplete();
      } else {
        toast.error(result.error || 'Failed to process refund');
      }
    } catch (error) {
      toast.error('Failed to process refund');
    } finally {
      setRefunding(false);
    }
  };

  const getRefundStatusInfo = () => {
    if (payment.status === 'refunded') {
      return {
        color: 'info' as const,
        text: 'Fully Refunded',
        description: 'This payment has been completely refunded.',
      };
    }

    if (payment.status === 'partially_refunded') {
      const refundedAmount =
        payment.stripe_metadata?.refunded_amount_cents || 0;
      return {
        color: 'warning' as const,
        text: 'Partially Refunded',
        description: `${formatCurrency(refundedAmount)} has been refunded.`,
      };
    }

    return null;
  };

  const getPaymentMethodIcon = () => {
    switch (payment.payment_method) {
      case 'cash':
        return <CashIcon fontSize="small" />;
      case 'external_pos':
        return <PosIcon fontSize="small" />;
      default:
        return <RefundIcon fontSize="small" />;
    }
  };

  const getPaymentMethodLabel = () => {
    switch (payment.payment_method) {
      case 'cash':
        return 'Cash Payment';
      case 'external_pos':
        return 'External POS Payment';
      default:
        return 'Manual Payment';
    }
  };

  const getRefundMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Cash Refund';
      case 'external_pos':
        return 'External POS Refund';
      case 'other':
        return 'Other Method';
      default:
        return method;
    }
  };

  const refundInfo = getRefundStatusInfo();

  return (
    <Box>
      {/* Manual Refund Action Button */}
      {canManualRefund() && (
        <Tooltip title="Process a manual refund for this payment">
          <IconButton size="small" color="warning" onClick={handleRefundClick}>
            <RefundIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {/* Manual Refund Dialog */}
      <Dialog
        open={refundDialogOpen}
        onClose={() => setRefundDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getPaymentMethodIcon()}
          Process Manual Refund
          <IconButton
            aria-label="close"
            onClick={() => setRefundDialogOpen(false)}
            sx={{ marginLeft: 'auto' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {/* Payment Summary */}
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Payment Details
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <strong>Original Amount:</strong>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(payment.amount_cents)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <strong>Payment Method:</strong>
                    </TableCell>
                    <TableCell>{getPaymentMethodLabel()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <strong>Payment Date:</strong>
                    </TableCell>
                    <TableCell>
                      {formatDateTime(
                        payment.processed_at || payment.created_at
                      )}
                    </TableCell>
                  </TableRow>
                  {payment.notes && (
                    <TableRow>
                      <TableCell>
                        <strong>Notes:</strong>
                      </TableCell>
                      <TableCell>{payment.notes}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Refund Options */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Refund Type</InputLabel>
              <Select
                value={refundForm.type}
                label="Refund Type"
                onChange={(e) =>
                  handleRefundTypeChange(e.target.value as 'full' | 'partial')
                }
              >
                <MenuItem value="full">Full Refund</MenuItem>
                <MenuItem value="partial">Partial Refund</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Refund Amount"
              type="number"
              value={refundForm.amount}
              onChange={(e) =>
                setRefundForm((prev) => ({
                  ...prev,
                  amount: parseFloat(e.target.value) || 0,
                }))
              }
              disabled={refundForm.type === 'full'}
              InputProps={{
                startAdornment: '$',
              }}
              helperText={
                refundForm.type === 'full'
                  ? 'Full refund amount is automatically set'
                  : `Maximum: ${formatCurrency(payment.amount_cents)}`
              }
            />

            <FormControl fullWidth>
              <InputLabel>Refund Method</InputLabel>
              <Select
                value={refundForm.method}
                label="Refund Method"
                onChange={(e) =>
                  setRefundForm((prev) => ({
                    ...prev,
                    method: e.target.value as 'cash' | 'external_pos' | 'other',
                  }))
                }
              >
                <MenuItem value="cash">Cash Refund</MenuItem>
                <MenuItem value="external_pos">External POS Refund</MenuItem>
                <MenuItem value="other">Other Method</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Refund Reason"
              multiline
              rows={3}
              value={refundForm.reason}
              onChange={(e) =>
                setRefundForm((prev) => ({
                  ...prev,
                  reason: e.target.value,
                }))
              }
              placeholder="e.g., Customer not satisfied with alterations, Order cancelled, Defective work..."
              helperText="Optional: Provide a reason for the refund for your records"
            />
          </Box>

          {/* Manual Refund Warning */}
          <Alert severity="warning" sx={{ mt: 2 }} icon={<WarningIcon />}>
            <Typography variant="body2">
              <strong>Manual Refund:</strong> This will record the refund in
              your system but will NOT process any automatic payment. You must
              handle the actual refund to the customer separately (cash,
              external POS system, etc.).
            </Typography>
          </Alert>

          {/* Refund Method Info */}
          <Alert severity="info" sx={{ mt: 1 }} icon={<InfoIcon />}>
            <Typography variant="body2">
              <strong>
                Refund Method: {getRefundMethodLabel(refundForm.method)}
              </strong>
              <br />
              {refundForm.method === 'cash' &&
                '• Refund cash directly to the customer from your register'}
              {refundForm.method === 'external_pos' &&
                '• Process the refund through your external POS system'}
              {refundForm.method === 'other' &&
                '• Handle the refund using your preferred method'}
            </Typography>
          </Alert>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setRefundDialogOpen(false)}
            disabled={refunding}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRefund}
            color="warning"
            variant="contained"
            disabled={refunding || refundForm.amount <= 0}
            startIcon={
              refunding ? <CircularProgress size={16} /> : <RefundIcon />
            }
          >
            {refunding
              ? 'Recording Refund...'
              : `Record ${refundForm.type === 'full' ? 'Full' : 'Partial'} Refund`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
