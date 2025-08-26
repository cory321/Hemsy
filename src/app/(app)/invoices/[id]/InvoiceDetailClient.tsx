'use client';

import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import PrintIcon from '@mui/icons-material/Print';
import SendIcon from '@mui/icons-material/Send';
import PaymentIcon from '@mui/icons-material/Payment';
import LinkIcon from '@mui/icons-material/Link';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CancelIcon from '@mui/icons-material/Cancel';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  getInvoiceById,
  cancelInvoice,
  generatePaymentLink,
  recordManualPayment,
} from '@/lib/actions/invoices';
import {
  createPaymentIntent,
  cancelPendingPayment,
} from '@/lib/actions/payments';
import {
  sendPaymentRequestEmail,
  sendInvoiceReceiptEmail,
} from '@/lib/actions/emails/invoice-emails';
import { restoreRemovedService } from '@/lib/actions/garments';
import PaymentManagement from '@/components/invoices/PaymentManagement';
import InvoiceLineItems from '@/components/invoices/InvoiceLineItems';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@/lib/utils/formatting';
import { formatCentsAsCurrency } from '@/lib/utils/currency';
import type { Tables } from '@/types/supabase';

interface InvoiceDetailClientProps {
  invoiceId: string;
}

export default function InvoiceDetailClient({
  invoiceId,
}: InvoiceDetailClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentType: 'remainder' as 'remainder' | 'custom',
    paymentMethod: 'cash' as 'cash' | 'external_pos',
    amountCents: 0,
    externalReference: '',
    notes: '',
  });
  const [cancellingPayment, setCancellingPayment] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      const data = await getInvoiceById(invoiceId);
      setInvoice(data);

      // Calculate default payment amount accounting for refunds
      const totalPaid =
        data.payments
          ?.filter((p: any) => p.status === 'completed')
          .reduce((sum: number, p: any) => sum + p.amount_cents, 0) || 0;
      const totalRefunded =
        data.payments
          ?.filter((p: any) => p.status === 'completed')
          .reduce(
            (sum: number, p: any) => sum + (p.refunded_amount_cents || 0),
            0
          ) || 0;
      const netPaid = totalPaid - totalRefunded;
      const remaining = data.amount_cents - netPaid;

      setPaymentForm((prev) => ({
        ...prev,
        amountCents: remaining,
      }));
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCancelInvoice = async () => {
    if (!confirm('Are you sure you want to cancel this invoice?')) return;

    try {
      const result = await cancelInvoice(invoiceId);
      if (result.success) {
        toast.success('Invoice cancelled');
        fetchInvoice();
      } else {
        toast.error(result.error || 'Failed to cancel invoice');
      }
    } catch (error) {
      toast.error('Failed to cancel invoice');
    }
  };

  const handleCancelPendingPayments = async () => {
    const pendingStripePayments =
      invoice?.payments?.filter(
        (p: any) => p.payment_method === 'stripe' && p.status === 'pending'
      ) || [];

    if (pendingStripePayments.length === 0) {
      toast.error('No pending Stripe payments to cancel');
      return;
    }

    if (!confirm(`Cancel ${pendingStripePayments.length} pending payment(s)?`))
      return;

    setCancellingPayment(true);
    try {
      let cancelledCount = 0;
      for (const payment of pendingStripePayments) {
        const result = await cancelPendingPayment(payment.id);
        if (result.success) {
          cancelledCount++;
        }
      }

      if (cancelledCount > 0) {
        toast.success(`Cancelled ${cancelledCount} payment(s)`);
        fetchInvoice();
      } else {
        toast.error('Failed to cancel payments');
      }
    } catch (error) {
      toast.error('Failed to cancel payments');
    } finally {
      setCancellingPayment(false);
    }
  };

  const handleSendPaymentLink = async () => {
    try {
      const result = await generatePaymentLink(invoiceId);
      if (result.success) {
        toast.success('Payment link sent to client');
      } else {
        toast.error(result.error || 'Failed to send payment link');
      }
    } catch (error) {
      toast.error('Failed to send payment link');
    }
  };

  const handleResendInvoice = async () => {
    try {
      const result = await sendPaymentRequestEmail(invoiceId);
      if (result.success) {
        toast.success('Invoice sent to client');
      } else {
        toast.error(result.error || 'Failed to send invoice');
      }
    } catch (error) {
      toast.error('Failed to send invoice');
    }
  };

  const handleRecordPayment = async () => {
    setPaymentProcessing(true);
    try {
      const result = await recordManualPayment({
        invoiceId,
        paymentType: paymentForm.paymentType,
        paymentMethod: paymentForm.paymentMethod,
        amountCents: paymentForm.amountCents,
        externalReference: paymentForm.externalReference || undefined,
        notes: paymentForm.notes || undefined,
      });

      if (result.success) {
        toast.success('Payment recorded successfully');
        setPaymentDialogOpen(false);
        fetchInvoice();
      } else {
        toast.error(result.error || 'Failed to record payment');
      }
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handlePayOnline = async () => {
    try {
      // Create payment intent
      const result = await createPaymentIntent({
        invoiceId,
        paymentType: 'remainder',
      });

      if (result.success && result.data) {
        // Redirect to payment page
        router.push(
          `/invoices/${invoiceId}/pay?client_secret=${result.data.clientSecret}`
        );
      } else {
        toast.error(result.error || 'Failed to create payment');
      }
    } catch (error) {
      toast.error('Failed to create payment');
    }
  };

  const handleRestoreService = async (serviceId: string, garmentId: string) => {
    try {
      const result = await restoreRemovedService({
        garmentServiceId: serviceId,
        garmentId: garmentId,
      });
      if (result.success) {
        toast.success('Service restored successfully');
        fetchInvoice(); // Refresh the invoice data
      } else {
        toast.error(result.error || 'Failed to restore service');
      }
    } catch (error) {
      toast.error('Failed to restore service');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!invoice) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">Invoice not found</Alert>
        </Box>
      </Container>
    );
  }

  // Calculate total paid amount from completed payments
  const totalPaid =
    invoice.payments
      ?.filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + p.amount_cents, 0) || 0;

  // Calculate total refunded amount
  const totalRefunded =
    invoice.payments
      ?.filter((p: any) => p.status === 'completed')
      .reduce(
        (sum: number, p: any) => sum + (p.refunded_amount_cents || 0),
        0
      ) || 0;

  // Net paid amount after refunds
  const netPaid = totalPaid - totalRefunded;

  // Balance due is invoice amount minus net paid amount
  const remainingAmount = invoice.amount_cents - netPaid;
  const isFullyPaid = remainingAmount <= 0;
  const isPartiallyPaid = netPaid > 0 && !isFullyPaid;
  const hasRefunds = totalRefunded > 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'partially_paid':
        return 'info';
      case 'paid':
        return 'success';
      case 'cancelled':
        return 'default';
      case 'refunded':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" className="invoice-detail">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" component="h1">
              {invoice.invoice_number}
            </Typography>
            <Chip
              label={invoice.status.toUpperCase().replace('_', ' ')}
              color={getStatusColor(invoice.status) as any}
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>
          <Box
            sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
            className="no-print"
          >
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
            >
              Print
            </Button>
            {invoice.status === 'pending' && (
              <>
                <Button
                  variant="outlined"
                  startIcon={<SendIcon />}
                  onClick={handleResendInvoice}
                >
                  Send Invoice
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<LinkIcon />}
                  onClick={handleSendPaymentLink}
                >
                  Send Payment Link
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PaymentIcon />}
                  onClick={() => setPaymentDialogOpen(true)}
                >
                  Record Payment
                </Button>
              </>
            )}
            {invoice.status === 'partially_paid' && (
              <Button
                variant="contained"
                startIcon={<PaymentIcon />}
                onClick={() => setPaymentDialogOpen(true)}
              >
                Record Payment
              </Button>
            )}
            {invoice.status === 'paid' && (
              <Button
                variant="outlined"
                startIcon={<ReceiptIcon />}
                onClick={() => sendInvoiceReceiptEmail(invoiceId)}
              >
                Send Receipt
              </Button>
            )}
            {/* Quick cancel pending payments button */}
            {invoice?.payments?.some(
              (p: any) =>
                p.payment_method === 'stripe' && p.status === 'pending'
            ) && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={
                  cancellingPayment ? (
                    <CircularProgress size={16} />
                  ) : (
                    <CancelIcon />
                  )
                }
                onClick={handleCancelPendingPayments}
                disabled={cancellingPayment}
              >
                {cancellingPayment
                  ? 'Cancelling...'
                  : 'Cancel Pending Payments'}
              </Button>
            )}
            {(invoice.status === 'pending' ||
              invoice.status === 'partially_paid') && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={handleCancelInvoice}
              >
                Cancel Invoice
              </Button>
            )}
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Invoice Details */}
            <Card>
              <CardContent>
                {/* Business & Client Info */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="h6" gutterBottom>
                      From
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {invoice.shop?.name || 'Your Shop'}
                    </Typography>
                    {invoice.shop?.mailing_address && (
                      <Typography variant="body2">
                        {invoice.shop.mailing_address}
                      </Typography>
                    )}
                    {invoice.shop?.email && (
                      <Typography variant="body2">
                        {invoice.shop.email}
                      </Typography>
                    )}
                    {invoice.shop?.phone_number && (
                      <Typography variant="body2">
                        {invoice.shop.phone_number}
                      </Typography>
                    )}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="h6" gutterBottom>
                      Bill To
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {invoice.client.first_name} {invoice.client.last_name}
                    </Typography>
                    {invoice.client.mailing_address && (
                      <Typography variant="body2">
                        {invoice.client.mailing_address}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      {invoice.client.email}
                    </Typography>
                    <Typography variant="body2">
                      {invoice.client.phone_number}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Invoice Items */}
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Services
                </Typography>
                <InvoiceLineItems
                  items={invoice.garment_services || []}
                  showRemoved={true}
                  onRestoreItem={handleRestoreService}
                  readonly={false}
                />

                {/* Description */}
                {invoice.description && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      {invoice.description}
                    </Typography>
                  </Box>
                )}

                {/* Totals */}
                <Box sx={{ mt: 3, ml: 'auto', maxWidth: 350 }}>
                  {invoice.deposit_amount_cents > 0 && (
                    <>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography>Total Amount</Typography>
                        <Typography>
                          {formatCentsAsCurrency(invoice.amount_cents)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Typography>Deposit Required</Typography>
                        <Typography>
                          {formatCentsAsCurrency(invoice.deposit_amount_cents)}
                        </Typography>
                      </Box>
                    </>
                  )}

                  {totalPaid > 0 && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography color="success.main">Total Paid</Typography>
                      <Typography color="success.main">
                        {formatCentsAsCurrency(totalPaid)}
                      </Typography>
                    </Box>
                  )}

                  {hasRefunds && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography color="error.main">Total Refunded</Typography>
                      <Typography color="error.main">
                        -{formatCentsAsCurrency(totalRefunded)}
                      </Typography>
                    </Box>
                  )}

                  {hasRefunds && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Typography color="info.main">Net Paid</Typography>
                      <Typography color="info.main">
                        {formatCentsAsCurrency(netPaid)}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 1 }} />

                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant="h6">
                      {isFullyPaid ? 'Fully Paid' : 'Balance Due'}
                    </Typography>
                    <Typography
                      variant="h6"
                      color={
                        isFullyPaid
                          ? 'success.main'
                          : remainingAmount < 0
                            ? 'error.main'
                            : 'inherit'
                      }
                    >
                      {isFullyPaid
                        ? formatCentsAsCurrency(invoice.amount_cents)
                        : remainingAmount < 0
                          ? `Credit: ${formatCentsAsCurrency(Math.abs(remainingAmount))}`
                          : formatCentsAsCurrency(remainingAmount)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Payment Management */}
            <PaymentManagement
              payments={invoice.payments || []}
              onPaymentUpdate={fetchInvoice}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            {/* Invoice Info */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Invoice Details
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Invoice Number
                  </Typography>
                  <Typography>{invoice.invoice_number}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Order Number
                  </Typography>
                  <Typography>{invoice.order.order_number}</Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Created Date
                  </Typography>
                  <Typography>{formatDate(invoice.created_at)}</Typography>
                </Box>
                {invoice.due_date && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Due Date
                    </Typography>
                    <Typography>{formatDate(invoice.due_date)}</Typography>
                  </Box>
                )}
                {invoice.order.order_due_date && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Order Due Date
                    </Typography>
                    <Typography>
                      {formatDate(invoice.order.order_due_date)}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Payment Options */}
            {!isFullyPaid && invoice.status !== 'cancelled' && (
              <Card className="no-print">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Payment Options
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<PaymentIcon />}
                    onClick={handlePayOnline}
                    sx={{ mb: 2 }}
                  >
                    Pay Online
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    Or record manual payment if received by cash or other means.
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>

        {/* Record Payment Dialog */}
        <Dialog
          open={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Record Payment</DialogTitle>
          <DialogContent>
            {remainingAmount < 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                This invoice has a credit balance of{' '}
                {formatCentsAsCurrency(Math.abs(remainingAmount))}. No
                additional payment is needed.
              </Alert>
            )}
            <Box
              sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              <FormControl fullWidth>
                <InputLabel>Payment Type</InputLabel>
                <Select
                  value={paymentForm.paymentType}
                  label="Payment Type"
                  onChange={(e) => {
                    const type = e.target
                      .value as typeof paymentForm.paymentType;
                    const amount = Math.max(0, remainingAmount); // Don't allow negative amounts

                    setPaymentForm((prev) => ({
                      ...prev,
                      paymentType: type,
                      amountCents: amount,
                    }));
                  }}
                >
                  <MenuItem value="remainder">Pay Remaining Balance</MenuItem>
                  <MenuItem value="custom">Custom Amount</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={paymentForm.paymentMethod}
                  label="Payment Method"
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      paymentMethod: e.target
                        .value as typeof paymentForm.paymentMethod,
                    }))
                  }
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="external_pos">External POS</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={(paymentForm.amountCents / 100).toFixed(2)}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    amountCents: Math.round(parseFloat(e.target.value) * 100),
                  }))
                }
                InputProps={{
                  startAdornment: '$',
                }}
              />

              {paymentForm.paymentMethod === 'external_pos' && (
                <TextField
                  fullWidth
                  label="Reference Number"
                  value={paymentForm.externalReference}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({
                      ...prev,
                      externalReference: e.target.value,
                    }))
                  }
                  helperText="Transaction ID or reference from external system"
                />
              )}

              <TextField
                fullWidth
                label="Notes (optional)"
                multiline
                rows={2}
                value={paymentForm.notes}
                onChange={(e) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleRecordPayment}
              variant="contained"
              disabled={paymentProcessing || paymentForm.amountCents <= 0}
            >
              {paymentProcessing ? 'Processing...' : 'Record Payment'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }

          .invoice-detail {
            max-width: 100% !important;
          }

          .MuiContainer-root {
            padding: 0 !important;
          }

          .MuiCard-root {
            box-shadow: none !important;
            border: 1px solid #ddd !important;
          }
        }
      `}</style>
    </Container>
  );
}
