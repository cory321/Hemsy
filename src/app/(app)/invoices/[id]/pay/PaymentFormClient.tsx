'use client';

import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getInvoiceById } from '@/lib/actions/invoices';
import { createPaymentIntent } from '@/lib/actions/payments';
import { formatCurrency } from '@/lib/utils/formatting';

// NOTE: This component requires @stripe/react-stripe-js and @stripe/stripe-js
// Once installed, uncomment the imports below and the Stripe Elements implementation

import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface PaymentFormClientProps {
  invoiceId: string;
  clientSecret?: string;
}

export default function PaymentFormClient({
  invoiceId,
  clientSecret,
}: PaymentFormClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [paymentIntent, setPaymentIntent] = useState<string | null>(
    clientSecret || null
  );
  const [creatingIntent, setCreatingIntent] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      const data = await getInvoiceById(invoiceId);
      setInvoice(data);

      // Create payment intent if not provided
      if (
        !clientSecret &&
        data.status !== 'paid' &&
        data.status !== 'cancelled'
      ) {
        await createNewPaymentIntent(data);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const createNewPaymentIntent = async (invoiceData: any) => {
    setCreatingIntent(true);
    try {
      const totalPaid =
        invoiceData.payments
          ?.filter((p: any) => p.status === 'completed')
          .reduce((sum: number, p: any) => sum + p.amount_cents, 0) || 0;

      const isFirstPayment = totalPaid === 0;
      const hasDeposit = invoiceData.deposit_amount_cents > 0;

      let paymentType: 'deposit' | 'remainder' | 'full' = 'full';
      if (hasDeposit && isFirstPayment) {
        paymentType = 'deposit';
      } else if (totalPaid > 0) {
        paymentType = 'remainder';
      }

      const result = await createPaymentIntent({
        invoiceId,
        paymentType,
      });

      if (result.success && result.data) {
        setPaymentIntent(result.data.clientSecret);
      } else {
        toast.error(result.error || 'Failed to initialize payment');
      }
    } catch (error) {
      toast.error('Failed to initialize payment');
    } finally {
      setCreatingIntent(false);
    }
  };

  if (loading || creatingIntent) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!invoice) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">Invoice not found</Alert>
        </Box>
      </Container>
    );
  }

  if (invoice.status === 'paid') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 4 }}>
          <Alert severity="success">
            This invoice has already been paid in full.
          </Alert>
          <Button
            variant="contained"
            onClick={() => router.push(`/invoices/${invoiceId}`)}
            sx={{ mt: 2 }}
          >
            View Invoice
          </Button>
        </Box>
      </Container>
    );
  }

  if (invoice.status === 'cancelled') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">
            This invoice has been cancelled and cannot be paid.
          </Alert>
        </Box>
      </Container>
    );
  }

  const totalPaid =
    invoice.payments
      ?.filter((p: any) => p.status === 'completed')
      .reduce((sum: number, p: any) => sum + p.amount_cents, 0) || 0;
  const remainingAmount = invoice.amount_cents - totalPaid;
  const isFirstPayment = totalPaid === 0;
  const hasDeposit = invoice.deposit_amount_cents > 0;

  let amountDue = remainingAmount;
  let paymentDescription = 'Full Payment';

  if (hasDeposit && isFirstPayment) {
    amountDue = Math.min(invoice.deposit_amount_cents, remainingAmount);
    paymentDescription = 'Deposit Payment';
  } else if (totalPaid > 0) {
    paymentDescription = 'Remaining Balance';
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Pay Invoice
        </Typography>

        {/* Invoice Summary */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Invoice Summary
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Invoice Number
              </Typography>
              <Typography>{invoice.invoice_number}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Client
              </Typography>
              <Typography>
                {invoice.client.first_name} {invoice.client.last_name}
              </Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Total Amount</Typography>
                <Typography>{formatCurrency(invoice.amount_cents)}</Typography>
              </Box>
            </Box>
            {totalPaid > 0 && (
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="success.main">Paid</Typography>
                  <Typography color="success.main">
                    -{formatCurrency(totalPaid)}
                  </Typography>
                </Box>
              </Box>
            )}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6">{paymentDescription}</Typography>
              <Typography variant="h6" color="primary">
                {formatCurrency(amountDue)}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Payment Details
            </Typography>

            {!publishableKey ? (
              <Alert severity="error">
                Stripe is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
                in your environment and restart the app.
              </Alert>
            ) : !paymentIntent ? (
              <Alert severity="error">
                Unable to initialize payment. Please try again or contact
                support.
              </Alert>
            ) : (
              <Box>
                <Elements
                  stripe={stripePromise!}
                  options={{ clientSecret: paymentIntent }}
                >
                  <PaymentForm
                    invoiceId={invoiceId}
                    amountCents={amountDue}
                    onSuccess={() =>
                      router.push(`/invoices/${invoiceId}?payment=success`)
                    }
                  />
                </Elements>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

function PaymentForm({
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
        return_url: `${window.location.origin}/invoices/${invoiceId}?payment=success`,
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
      <PaymentElement />

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
        {processing ? 'Processing...' : `Pay ${formatCurrency(amountCents)}`}
      </Button>
    </form>
  );
}
