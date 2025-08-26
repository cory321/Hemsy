'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Collapse,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect, useCallback } from 'react';
import { formatCentsAsCurrency } from '@/lib/utils/currency';
import { recordManualPayment } from '@/lib/actions/invoices';
import { createPaymentIntent } from '@/lib/actions/payments';
import toast from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

interface RecordPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  invoiceId?: string;
  amountDue: number; // in cents
  onPaymentSuccess?: () => void;
  clientEmail?: string | undefined;
}

export default function RecordPaymentDialog({
  open,
  onClose,
  orderId,
  invoiceId,
  amountDue,
  onPaymentSuccess,
  clientEmail,
}: RecordPaymentDialogProps) {
  const [paymentType, setPaymentType] = useState<'balance_due' | 'custom'>(
    'balance_due'
  );
  const [customAmount, setCustomAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<
    'cash' | 'external_pos' | 'check' | 'stripe'
  >('cash');
  const [externalReference, setExternalReference] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(
    null
  );
  const [connectedAccountId, setConnectedAccountId] = useState<string | null>(
    null
  );
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [creatingStripeIntent, setCreatingStripeIntent] = useState(false);

  // Calculate amount based on payment type
  const paymentAmount =
    paymentType === 'balance_due'
      ? amountDue
      : Math.round(parseFloat(customAmount || '0') * 100);

  const handleCreateStripePaymentIntent = useCallback(async () => {
    if (!invoiceId) {
      toast.error('Invoice ID required for Stripe payments');
      return;
    }

    if (!publishableKey) {
      toast.error('Stripe is not configured properly');
      console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      return;
    }

    setCreatingStripeIntent(true);
    try {
      const result = await createPaymentIntent({
        invoiceId,
        paymentType: paymentType === 'balance_due' ? 'remainder' : 'custom',
        ...(paymentType === 'custom' && { amountCents: paymentAmount }),
      });

      if (result.success && result.data) {
        setStripeClientSecret(result.data.clientSecret);

        // Handle direct charges with connected account
        if (result.data.isDirectCharge && result.data.connectedAccountId) {
          console.log(
            'Initializing Stripe for direct charge with connected account:',
            result.data.connectedAccountId
          );
          setConnectedAccountId(result.data.connectedAccountId);
          // For direct charges, we need to initialize Stripe with stripeAccount parameter
          // This is CRITICAL for the Payment Element to work with connected accounts
          const stripeWithAccount = await loadStripe(publishableKey!, {
            stripeAccount: result.data.connectedAccountId,
          });
          setStripePromise(stripeWithAccount);
        } else {
          console.log('Initializing Stripe for platform/destination charge');
          // For destination charges or platform payments
          const stripeInstance = await loadStripe(publishableKey!);
          setStripePromise(stripeInstance);
        }
      } else {
        toast.error(result.error || 'Failed to initialize Stripe payment');
        setPaymentMethod('cash'); // Fall back to cash
      }
    } catch (error) {
      toast.error('Failed to initialize payment');
      console.error('Stripe payment intent creation failed:', error);
      setPaymentMethod('cash'); // Fall back to cash
    } finally {
      setCreatingStripeIntent(false);
    }
  }, [invoiceId, paymentAmount, paymentType]);

  useEffect(() => {
    // If Stripe is selected and we have an amount, create payment intent
    if (
      paymentMethod === 'stripe' &&
      paymentAmount > 0 &&
      !stripeClientSecret &&
      !creatingStripeIntent && // Prevent duplicate calls
      invoiceId // Only create intent if we have an invoice ID
    ) {
      handleCreateStripePaymentIntent();
    }
  }, [
    paymentMethod,
    paymentAmount,
    stripeClientSecret,
    creatingStripeIntent,
    handleCreateStripePaymentIntent,
    invoiceId,
  ]);

  // Early return if no invoice ID
  if (!invoiceId) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mt: 2 }}>
            An invoice must be created before recording payments. Please create
            an invoice first.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const handleManualPayment = async () => {
    // Invoice ID is guaranteed to exist due to early return above
    if (!invoiceId) {
      return;
    }

    if (paymentAmount <= 0) {
      toast.error('Payment amount must be greater than zero');
      return;
    }

    setProcessing(true);
    try {
      const result = await recordManualPayment({
        invoiceId,
        paymentType: paymentType === 'balance_due' ? 'remainder' : 'custom',
        amountCents: paymentAmount,
        paymentMethod: paymentMethod as 'cash' | 'external_pos' | 'check',
        ...(externalReference && { externalReference }),
        ...(notes && { notes }),
      });

      if (result.success) {
        toast.success('Payment recorded successfully');
        onPaymentSuccess?.();
        handleClose();
      } else {
        toast.error(result.error || 'Failed to record payment');
      }
    } catch (error) {
      toast.error('Failed to record payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    setPaymentType('balance_due');
    setCustomAmount('');
    setPaymentMethod('cash');
    setExternalReference('');
    setNotes('');
    setStripeClientSecret(null);
    setConnectedAccountId(null);
    setStripePromise(null);
    onClose();
  };

  const formatAmountForDisplay = (cents: number) => {
    return formatCentsAsCurrency(cents);
  };

  const isValidAmount = paymentAmount > 0 && paymentAmount <= amountDue;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Record Payment</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Amount Due Display */}
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Total Balance Due:</strong>{' '}
              {formatAmountForDisplay(amountDue)}
            </Typography>
          </Alert>

          {/* Payment Type Selection */}
          <FormControl>
            <Typography variant="subtitle2" gutterBottom>
              Payment Amount
            </Typography>
            <RadioGroup
              value={paymentType}
              onChange={(e) =>
                setPaymentType(e.target.value as 'balance_due' | 'custom')
              }
            >
              <FormControlLabel
                value="balance_due"
                control={<Radio />}
                label={`Full Balance Due (${formatAmountForDisplay(amountDue)})`}
              />
              <FormControlLabel
                value="custom"
                control={<Radio />}
                label="Custom Amount"
              />
            </RadioGroup>
          </FormControl>

          {/* Custom Amount Input */}
          <Collapse in={paymentType === 'custom'}>
            <TextField
              fullWidth
              label="Custom Amount"
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              InputProps={{
                startAdornment: '$',
              }}
              inputProps={{
                min: 0.01,
                max: amountDue / 100,
                step: 0.01,
              }}
              error={
                paymentType === 'custom' &&
                parseFloat(customAmount) > amountDue / 100
              }
              helperText={
                paymentType === 'custom' &&
                parseFloat(customAmount) > amountDue / 100
                  ? `Amount cannot exceed balance due (${formatAmountForDisplay(amountDue)})`
                  : ''
              }
            />
          </Collapse>

          {/* Payment Method Selection */}
          <FormControl fullWidth>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={paymentMethod}
              label="Payment Method"
              onChange={(e) =>
                setPaymentMethod(e.target.value as typeof paymentMethod)
              }
            >
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="check">Check</MenuItem>
              <MenuItem value="external_pos">External POS</MenuItem>
              {invoiceId && publishableKey && (
                <MenuItem value="stripe">Credit/Debit Card (Stripe)</MenuItem>
              )}
            </Select>
          </FormControl>

          {/* Stripe Payment Form */}
          {paymentMethod === 'stripe' && (
            <Box>
              {!publishableKey ? (
                <Alert severity="error">
                  Stripe is not configured. Please use another payment method.
                </Alert>
              ) : creatingStripeIntent ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : stripeClientSecret && stripePromise ? (
                <Box>
                  {connectedAccountId && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="caption">
                        Processing via seamstress merchant account
                      </Typography>
                    </Alert>
                  )}
                  <Elements
                    key={`${stripeClientSecret}-${connectedAccountId || 'platform'}`} // Force re-mount if client secret or account changes
                    stripe={stripePromise}
                    options={{
                      clientSecret: stripeClientSecret,
                      appearance: {
                        theme: 'stripe',
                        variables: {
                          colorPrimary: '#1976d2',
                        },
                      },
                    }}
                  >
                    <StripePaymentForm
                      invoiceId={invoiceId!}
                      amountCents={paymentAmount}
                      onSuccess={() => {
                        toast.success('Payment successful!');
                        onPaymentSuccess?.();
                        handleClose();
                      }}
                    />
                  </Elements>
                </Box>
              ) : (
                <Alert severity="warning">
                  Unable to initialize card payment. Please try another method.
                </Alert>
              )}
            </Box>
          )}

          {/* External Reference for non-Stripe payments */}
          {paymentMethod !== 'stripe' && paymentMethod === 'external_pos' && (
            <TextField
              fullWidth
              label="Reference Number"
              value={externalReference}
              onChange={(e) => setExternalReference(e.target.value)}
              placeholder="e.g., Square transaction ID"
            />
          )}

          {/* Check Number for check payments */}
          {paymentMethod === 'check' && (
            <TextField
              fullWidth
              label="Check Number"
              value={externalReference}
              onChange={(e) => setExternalReference(e.target.value)}
              placeholder="Enter check number"
            />
          )}

          {/* Notes field for non-Stripe payments */}
          {paymentMethod !== 'stripe' && (
            <TextField
              fullWidth
              label="Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
              placeholder="Any additional payment details"
            />
          )}

          {/* Display payment amount summary */}
          {isValidAmount && (
            <Alert severity="success">
              <Typography variant="body2">
                <strong>Payment Amount:</strong>{' '}
                {formatAmountForDisplay(paymentAmount)}
                {paymentAmount < amountDue && (
                  <>
                    <br />
                    <strong>Remaining Balance:</strong>{' '}
                    {formatAmountForDisplay(amountDue - paymentAmount)}
                  </>
                )}
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={processing}>
          Cancel
        </Button>
        {paymentMethod !== 'stripe' && (
          <Button
            onClick={handleManualPayment}
            variant="contained"
            disabled={processing || !isValidAmount}
          >
            {processing ? 'Processing...' : 'Record Payment'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// Stripe Payment Form Component
function StripePaymentForm({
  invoiceId,
  amountCents,
  onSuccess,
}: {
  invoiceId: string;
  amountCents: number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'An error occurred');
      setProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders?payment=success`,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  // Check if Stripe is properly loaded
  if (!stripe || !elements) {
    setTimeout(() => {
      if (!stripe || !elements) {
        setError('Failed to load payment form. Please refresh and try again.');
      }
    }, 2000);
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
        onLoaderStart={() => {
          console.log('PaymentElement loader started');
        }}
        onReady={() => {
          console.log('PaymentElement ready');
          setError(null); // Clear any errors when element is ready
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={!stripe || processing}
        sx={{ mt: 3 }}
      >
        {processing
          ? 'Processing...'
          : `Pay ${formatCentsAsCurrency(amountCents)}`}
      </Button>
    </Box>
  );
}
