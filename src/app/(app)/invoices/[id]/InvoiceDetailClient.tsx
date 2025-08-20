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
import { createPaymentIntent } from '@/lib/actions/payments';
import {
  sendPaymentRequestEmail,
  sendInvoiceReceiptEmail,
} from '@/lib/actions/emails/invoice-emails';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
} from '@/lib/utils/formatting';
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
    paymentType: 'full' as 'deposit' | 'remainder' | 'full',
    paymentMethod: 'cash' as 'cash' | 'external_pos',
    amountCents: 0,
    externalReference: '',
    notes: '',
  });

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      const data = await getInvoiceById(invoiceId);
      setInvoice(data);

      // Calculate default payment amount
      const totalPaid =
        data.payments
          ?.filter((p: any) => p.status === 'completed')
          .reduce((sum: number, p: any) => sum + p.amount_cents, 0) || 0;
      const remaining = data.amount_cents - totalPaid;

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
        paymentType: invoice.deposit_amount_cents > 0 ? 'deposit' : 'full',
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

  const totalPaid =
    invoice.payments
      ?.filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + p.amount_cents, 0) || 0;
  const remainingAmount = invoice.amount_cents - totalPaid;
  const isFullyPaid = remainingAmount <= 0;
  const isPartiallyPaid = totalPaid > 0 && !isFullyPaid;

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
            {(invoice.status === 'pending' ||
              invoice.status === 'partially_paid') && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={handleCancelInvoice}
              >
                Cancel
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
                {invoice.line_items && invoice.line_items.length > 0 && (
                  <>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Description</TableCell>
                            <TableCell align="center">Qty</TableCell>
                            <TableCell align="right">Price</TableCell>
                            <TableCell align="right">Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {invoice.line_items.map(
                            (item: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {item.name}
                                  {item.description && (
                                    <Typography
                                      variant="caption"
                                      display="block"
                                      color="text.secondary"
                                    >
                                      {item.description}
                                    </Typography>
                                  )}
                                </TableCell>
                                <TableCell align="center">
                                  {item.quantity}
                                </TableCell>
                                <TableCell align="right">
                                  {formatCurrency(item.unit_price_cents)}
                                </TableCell>
                                <TableCell align="right">
                                  {formatCurrency(item.line_total_cents)}
                                </TableCell>
                              </TableRow>
                            )
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </>
                )}

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
                          {formatCurrency(invoice.amount_cents)}
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
                          {formatCurrency(invoice.deposit_amount_cents)}
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
                      <Typography color="success.main">Paid</Typography>
                      <Typography color="success.main">
                        {formatCurrency(totalPaid)}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 1 }} />

                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Typography variant="h6">
                      {isFullyPaid ? 'Total Paid' : 'Balance Due'}
                    </Typography>
                    <Typography
                      variant="h6"
                      color={isFullyPaid ? 'success.main' : 'inherit'}
                    >
                      {formatCurrency(
                        isFullyPaid ? invoice.amount_cents : remainingAmount
                      )}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Payment History */}
            {invoice.payments && invoice.payments.length > 0 && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Payment History
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Method</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoice.payments
                          .sort(
                            (a: any, b: any) =>
                              new Date(b.created_at).getTime() -
                              new Date(a.created_at).getTime()
                          )
                          .map((payment: any) => (
                            <TableRow key={payment.id}>
                              <TableCell>
                                {formatDateTime(
                                  payment.processed_at || payment.created_at
                                )}
                              </TableCell>
                              <TableCell sx={{ textTransform: 'capitalize' }}>
                                {payment.payment_type}
                              </TableCell>
                              <TableCell sx={{ textTransform: 'capitalize' }}>
                                {payment.payment_method.replace('_', ' ')}
                              </TableCell>
                              <TableCell align="right">
                                {formatCurrency(payment.amount_cents)}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={payment.status}
                                  size="small"
                                  color={
                                    payment.status === 'completed'
                                      ? 'success'
                                      : payment.status === 'failed'
                                        ? 'error'
                                        : 'default'
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            )}
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
                    let amount = remainingAmount;

                    if (type === 'deposit' && invoice.deposit_amount_cents) {
                      amount = Math.min(
                        invoice.deposit_amount_cents,
                        remainingAmount
                      );
                    }

                    setPaymentForm((prev) => ({
                      ...prev,
                      paymentType: type,
                      amountCents: amount,
                    }));
                  }}
                >
                  {invoice.deposit_amount_cents > 0 && totalPaid === 0 && (
                    <MenuItem value="deposit">Deposit</MenuItem>
                  )}
                  {isPartiallyPaid && (
                    <MenuItem value="remainder">Remainder</MenuItem>
                  )}
                  <MenuItem value="full">Full Payment</MenuItem>
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
