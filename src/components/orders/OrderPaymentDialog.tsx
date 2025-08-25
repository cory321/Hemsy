'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { createPaymentIntent } from '@/lib/actions/payments';
import { formatCurrency } from '@/lib/utils/currency';
import { toast } from 'react-hot-toast';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface OrderPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  order: {
    id: string;
    orderNumber: string;
    total: number;
  };
  invoice: {
    id: string;
    invoiceNumber: string;
  };
  client: {
    email: string;
    firstName: string;
    lastName: string;
  };
  paymentType: 'deposit' | 'full';
  depositAmount?: number;
  onPaymentSuccess: () => void;
}

export default function OrderPaymentDialog({
  open,
  onClose,
  order,
  invoice,
  client,
  paymentType,
  depositAmount,
  onPaymentSuccess,
}: OrderPaymentDialogProps) {
  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const amountToCharge =
    paymentType === 'deposit' && depositAmount ? depositAmount : order.total;

  useEffect(() => {
    if (open) {
      createPaymentIntentForOrder();
    }
  }, [open, invoice.id]);

  const createPaymentIntentForOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await createPaymentIntent({
        invoiceId: invoice.id,
        paymentType,
        amountCents: amountToCharge,
      });

      if (result.success && result.data) {
        setClientSecret(result.data.clientSecret);
      } else {
        throw new Error(result.error || 'Failed to initialize payment');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to initialize payment'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!publishableKey) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Payment Setup Error</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            Stripe is not configured. Please contact support.
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        💳 Collect Payment for Order {order.orderNumber}
      </DialogTitle>

      <DialogContent>
        {/* Order Summary */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Payment Summary
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Customer:
            </Typography>
            <Typography variant="body2">
              {client.firstName} {client.lastName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Order Total:
            </Typography>
            <Typography variant="body2">
              {formatCurrency(order.total / 100)}
            </Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" fontWeight="bold">
              Charging:
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="primary">
              {formatCurrency(amountToCharge / 100)}
            </Typography>
          </Box>
          {paymentType === 'deposit' && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 0.5 }}
            >
              Remaining balance:{' '}
              {formatCurrency((order.total - amountToCharge) / 100)}
            </Typography>
          )}
        </Box>

        {/* Payment Form */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Setting up payment...</Typography>
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : clientSecret ? (
          <Elements
            stripe={stripePromise!}
            options={{
              clientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#1976d2',
                  fontFamily: 'Roboto, sans-serif',
                },
              },
            }}
          >
            <PaymentForm
              invoiceId={invoice.id}
              amountCents={amountToCharge}
              onSuccess={onPaymentSuccess}
              onCancel={onClose}
            />
          </Elements>
        ) : (
          <Alert severity="warning">
            Payment initialization failed. Please try again.
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PaymentForm({
  invoiceId,
  amountCents,
  onSuccess,
  onCancel,
}: {
  invoiceId: string;
  amountCents: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

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
        return_url: `${window.location.origin}/orders/${invoiceId}?payment=success`,
      },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      setProcessing(false);
    } else {
      toast.success('Payment successful!');
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          defaultValues: {
            billingDetails: {
              email: '', // Will be filled from client data
            },
          },
        }}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          style={{
            flex: 1,
            padding: '12px',
            border: '1px solid #1976d2',
            backgroundColor: 'white',
            color: '#1976d2',
            borderRadius: '4px',
            cursor: processing ? 'not-allowed' : 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            backgroundColor: processing ? '#ccc' : '#1976d2',
            color: 'white',
            borderRadius: '4px',
            cursor: processing ? 'not-allowed' : 'pointer',
          }}
        >
          {processing
            ? 'Processing...'
            : `Pay ${formatCurrency(amountCents / 100)}`}
        </button>
      </Box>
    </form>
  );
}
