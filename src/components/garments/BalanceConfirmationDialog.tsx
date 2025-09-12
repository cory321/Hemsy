'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Chip,
} from '@mui/material';
import { useState } from 'react';
import { formatCentsAsCurrency } from '@/lib/utils/currency';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RecordPaymentDialog from '@/components/orders/RecordPaymentDialog';

interface BalanceConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirmWithoutPayment: () => void;
  onPaymentSuccess: () => void;
  balanceDue: number; // in cents
  orderTotal: number; // in cents
  paidAmount: number; // in cents
  orderNumber: string;
  clientName: string;
  orderId: string | null;
  invoiceId?: string | undefined;
  clientEmail?: string | undefined;
}

export default function BalanceConfirmationDialog({
  open,
  onClose,
  onConfirmWithoutPayment,
  onPaymentSuccess,
  balanceDue,
  orderTotal,
  paidAmount,
  orderNumber,
  clientName,
  orderId,
  invoiceId,
  clientEmail,
}: BalanceConfirmationDialogProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleCollectPayment = () => {
    if (!invoiceId) {
      // If no invoice exists, we need to handle this case
      // For now, we'll proceed without payment
      console.warn('No invoice found for order, cannot collect payment');
      handleProceedWithoutPayment();
      return;
    }
    setShowPaymentDialog(true);
  };

  const handleProceedWithoutPayment = async () => {
    setProcessing(true);
    onConfirmWithoutPayment();
    // Processing state will be reset when dialog closes
  };

  const handlePaymentDialogSuccess = () => {
    setShowPaymentDialog(false);
    onPaymentSuccess();
  };

  const percentPaid =
    orderTotal > 0 ? Math.round((paidAmount / orderTotal) * 100) : 0;

  return (
    <>
      <Dialog
        open={open && !showPaymentDialog}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmberIcon color="warning" />
            <Typography variant="h6">Outstanding Balance on Order</Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              This is the last garment for order <strong>#{orderNumber}</strong>
              {clientName && ` (${clientName})`}. There is an outstanding
              balance that needs to be collected:
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
              mb: 3,
            }}
          >
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Order Total:
              </Typography>
              <Typography variant="body2">
                {formatCentsAsCurrency(orderTotal)}
              </Typography>
            </Box>

            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                Amount Paid:
              </Typography>
              <Typography variant="body2" color="success.main">
                {formatCentsAsCurrency(paidAmount)}
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                pt: 1,
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="subtitle1" fontWeight="bold">
                Balance Due:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  color="error.main"
                >
                  {formatCentsAsCurrency(balanceDue)}
                </Typography>
                <Chip
                  label={`${percentPaid}% paid`}
                  size="small"
                  color={percentPaid >= 50 ? 'success' : 'warning'}
                />
              </Box>
            </Box>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            Would you like to collect payment now before handing over the
            garment?
          </Alert>

          {!invoiceId && (
            <Alert severity="warning">
              No invoice found for this order. Payment collection requires an
              invoice.
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={onClose} color="inherit" disabled={processing}>
            Cancel
          </Button>

          <Button
            onClick={handleProceedWithoutPayment}
            variant="outlined"
            disabled={processing}
            startIcon={<CheckCircleIcon />}
          >
            {processing ? 'Processing...' : 'Mark Picked Up Without Payment'}
          </Button>

          <Button
            onClick={handleCollectPayment}
            variant="contained"
            color="primary"
            disabled={!invoiceId || processing}
            startIcon={<PaymentIcon />}
          >
            Collect Payment Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Collection Dialog */}
      {invoiceId && orderId && (
        <RecordPaymentDialog
          open={showPaymentDialog}
          onClose={() => setShowPaymentDialog(false)}
          orderId={orderId}
          invoiceId={invoiceId}
          amountDue={balanceDue}
          onPaymentSuccess={handlePaymentDialogSuccess}
          clientEmail={clientEmail}
        />
      )}
    </>
  );
}
