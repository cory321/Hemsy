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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableRow,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Undo as RefundIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { formatCurrency, formatDateTime } from '@/lib/utils/formatting';
import { refundPayment } from '@/lib/actions/payments';
import toast from 'react-hot-toast';

interface Payment {
  id: string;
  payment_type: string;
  payment_method: string;
  amount_cents: number;
  refunded_amount_cents?: number;
  status: string;
  stripe_payment_intent_id?: string;
  created_at: string;
  processed_at?: string;
  notes?: string;
  stripe_metadata?: any;
}

interface RefundManagementProps {
  payment: Payment;
  onRefundComplete: () => void;
  onOptimisticRefund?: (
    paymentId: string,
    refundAmount: number,
    serverAction: () => Promise<any>
  ) => void;
}

export default function RefundManagement({
  payment,
  onRefundComplete,
  onOptimisticRefund,
}: RefundManagementProps) {
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundForm, setRefundForm] = useState({
    amount: payment.amount_cents / 100,
    reason: '',
    type: 'full' as 'full' | 'partial',
  });

  const canRefund = () => {
    return (
      (payment.status === 'completed' ||
        payment.status === 'partially_refunded' ||
        payment.status === 'refunded') &&
      payment.payment_method === 'stripe' &&
      payment.stripe_payment_intent_id
    );
  };

  const getRemainingRefundableAmount = () => {
    const refundedAmount = payment.refunded_amount_cents || 0;
    return payment.amount_cents - refundedAmount;
  };

  const getRemainingRefundableAmountInDollars = () => {
    return getRemainingRefundableAmount() / 100;
  };

  // Show previous refunds count if any
  const getPreviousRefundsInfo = () => {
    const refundedAmount = payment.refunded_amount_cents || 0;
    if (refundedAmount === 0) return null;

    const refundCount = (payment.stripe_metadata as any)?.refund_count || 1;
    return {
      count: refundCount,
      amount: refundedAmount,
      isPartial: refundedAmount < payment.amount_cents,
    };
  };

  const handleRefundClick = () => {
    const remainingAmount = getRemainingRefundableAmountInDollars();
    setRefundForm({
      amount: remainingAmount,
      reason: '',
      type: remainingAmount === payment.amount_cents / 100 ? 'full' : 'partial',
    });
    setRefundDialogOpen(true);
  };

  const handleRefundTypeChange = (type: 'full' | 'partial') => {
    setRefundForm((prev) => ({
      ...prev,
      type,
      amount: type === 'full' ? getRemainingRefundableAmountInDollars() : 0,
    }));
  };

  const handleConfirmRefund = async () => {
    if (!payment.id) return;

    setRefunding(true);

    const refundAmountCents = Math.round(refundForm.amount * 100);

    // Validate refund amount
    if (refundAmountCents <= 0) {
      toast.error('Refund amount must be greater than $0');
      setRefunding(false);
      return;
    }

    if (refundAmountCents > getRemainingRefundableAmount()) {
      toast.error('Refund amount cannot exceed remaining refundable amount');
      setRefunding(false);
      return;
    }

    // Server action function
    const serverAction = () =>
      refundPayment(
        payment.id,
        refundForm.type === 'full' ? undefined : refundAmountCents,
        refundForm.reason || undefined
      );

    try {
      if (onOptimisticRefund) {
        // Use optimistic update
        onOptimisticRefund(payment.id, refundAmountCents, serverAction);
        toast.success(
          `${refundForm.type === 'full' ? 'Full' : 'Partial'} refund processed successfully`
        );
        setRefundDialogOpen(false);
        onRefundComplete();
      } else {
        // Fallback to direct server action
        const result = await serverAction();
        if (result.success) {
          toast.success(
            `${refundForm.type === 'full' ? 'Full' : 'Partial'} refund processed successfully`
          );
          setRefundDialogOpen(false);
          onRefundComplete();
        } else {
          toast.error(result.error || 'Failed to process refund');
        }
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

  const refundInfo = getRefundStatusInfo();

  return (
    <Box>
      {/* Refund Action Button */}
      {canRefund() && getRemainingRefundableAmount() > 0 && (
        <Button
          size="small"
          color="warning"
          variant="outlined"
          onClick={handleRefundClick}
          startIcon={<RefundIcon fontSize="small" />}
          sx={{
            fontWeight: 'medium',
            '&:hover': {
              backgroundColor: 'warning.light',
              borderColor: 'warning.main',
            },
          }}
          aria-label={`Refund ${formatCurrency(getRemainingRefundableAmount())}`}
        >
          Refund
        </Button>
      )}

      {/* Refund Dialog */}
      <Dialog
        open={refundDialogOpen}
        onClose={() => setRefundDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RefundIcon />
          Process Refund
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
                  {getPreviousRefundsInfo() && (
                    <>
                      <TableRow>
                        <TableCell>
                          <strong>Previously Refunded:</strong>
                        </TableCell>
                        <TableCell sx={{ color: 'error.main' }}>
                          -{formatCurrency(getPreviousRefundsInfo()!.amount)}
                          {getPreviousRefundsInfo()!.count > 1 &&
                            ` (${getPreviousRefundsInfo()!.count} refunds)`}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <strong>Remaining Refundable:</strong>
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: 'bold', color: 'primary.main' }}
                        >
                          {formatCurrency(getRemainingRefundableAmount())}
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                  <TableRow>
                    <TableCell>
                      <strong>Payment Method:</strong>
                    </TableCell>
                    <TableCell sx={{ textTransform: 'capitalize' }}>
                      {payment.payment_method === 'stripe'
                        ? 'Credit Card'
                        : payment.payment_method}
                    </TableCell>
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
                  {payment.stripe_payment_intent_id && (
                    <TableRow>
                      <TableCell>
                        <strong>Transaction ID:</strong>
                      </TableCell>
                      <TableCell
                        sx={{ fontFamily: 'monospace', fontSize: '0.8em' }}
                      >
                        {payment.stripe_payment_intent_id}
                      </TableCell>
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
                  ? `Full refund amount: ${formatCurrency(getRemainingRefundableAmount())}`
                  : `Maximum refundable: ${formatCurrency(getRemainingRefundableAmount())}`
              }
            />

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
              helperText="Provide a clear reason for the refund for your records"
            />
          </Box>

          {/* Refund Warning */}
          <Alert severity="warning" sx={{ mt: 2 }} icon={<WarningIcon />}>
            <Typography variant="body2">
              <strong>Important:</strong> This will process an immediate refund
              to the customer&apos;s original payment method. Refunds typically
              take 5-10 business days to appear on the customer&apos;s
              statement.
            </Typography>
          </Alert>

          {/* Refund Timeline Info */}
          <Alert severity="info" sx={{ mt: 1 }} icon={<InfoIcon />}>
            <Typography variant="body2">
              • <strong>Credit Cards:</strong> 5-10 business days
              <br />• <strong>Bank Transfers:</strong> Up to 10 business days
              <br />• <strong>Digital Wallets:</strong> 1-3 business days
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
              ? 'Processing Refund...'
              : `Process ${refundForm.type === 'full' ? 'Full' : 'Partial'} Refund`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
