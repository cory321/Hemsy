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
  Link as MuiLink,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getPaymentLinkByToken } from '@/lib/actions/invoices';
import { createPaymentIntent } from '@/lib/actions/payments';
import { formatCurrency, formatDate } from '@/lib/utils/formatting';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { getShopDisplayName } from '@/lib/utils/shop';

// NOTE: This component requires @stripe/react-stripe-js and @stripe/stripe-js
// import { loadStripe } from '@stripe/stripe-js';
// import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PublicPaymentClientProps {
  token: string;
}

export default function PublicPaymentClient({
  token,
}: PublicPaymentClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paymentLink, setPaymentLink] = useState<any>(null);
  const [paymentIntent, setPaymentIntent] = useState<string | null>(null);
  const [creatingIntent, setCreatingIntent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentLink();
  }, [token]);

  const fetchPaymentLink = async () => {
    try {
      const data = await getPaymentLinkByToken(token);

      if (!data) {
        setError('This payment link is invalid or has expired.');
        setLoading(false);
        return;
      }

      setPaymentLink(data);

      // Check invoice status
      if (data.invoice.status === 'paid') {
        setLoading(false);
        return;
      }

      if (data.invoice.status === 'cancelled') {
        setError('This invoice has been cancelled and cannot be paid.');
        setLoading(false);
        return;
      }

      // Create payment intent
      await createNewPaymentIntent(data.invoice);
    } catch (error) {
      console.error('Error fetching payment link:', error);
      setError('Unable to load payment information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createNewPaymentIntent = async (invoice: any) => {
    setCreatingIntent(true);
    try {
      const totalPaid =
        invoice.payments
          ?.filter((p: any) => p.status === 'completed')
          .reduce((sum: number, p: any) => sum + p.amount_cents, 0) || 0;

      const isFirstPayment = totalPaid === 0;
      const hasDeposit = invoice.deposit_amount_cents > 0;

      let paymentType: 'deposit' | 'remainder' | 'full' = 'full';
      if (hasDeposit && isFirstPayment) {
        paymentType = 'deposit';
      } else if (totalPaid > 0) {
        paymentType = 'remainder';
      }

      const result = await createPaymentIntent({
        invoiceId: invoice.id,
        paymentType,
        returnUrl: `${window.location.origin}/pay/${token}/success`,
      });

      if (result.success && result.data) {
        setPaymentIntent(result.data.clientSecret);
      } else {
        setError(
          result.error || 'Failed to initialize payment. Please try again.'
        );
      }
    } catch (error) {
      setError('Failed to initialize payment. Please try again.');
    } finally {
      setCreatingIntent(false);
    }
  };

  // Check for success/error in URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');

    if (paymentStatus === 'success') {
      toast.success('Payment successful!');
    } else if (paymentStatus === 'cancelled') {
      toast.error('Payment was cancelled');
    }
  }, []);

  if (loading || creatingIntent) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mt: 8,
          }}
        >
          <CircularProgress />
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            Loading payment information...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <ErrorIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Payment Link Error
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {error}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                If you believe this is an error, please contact the business
                directly.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  if (!paymentLink) {
    return null;
  }

  const invoice = paymentLink.invoice;
  const shop = invoice.shop;
  const client = invoice.client;

  if (invoice.status === 'paid') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ mt: 8 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Invoice Already Paid
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                This invoice has already been paid in full.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Invoice #{invoice.invoice_number}
              </Typography>
            </CardContent>
          </Card>
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
        {/* Business Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {getShopDisplayName(shop)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Secure Payment Portal
          </Typography>
        </Box>

        {/* Invoice Summary */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Invoice Details
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Invoice Number
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {invoice.invoice_number}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Bill To
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {client.first_name} {client.last_name}
              </Typography>
              <Typography variant="body2">{client.email}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Invoice Date
              </Typography>
              <Typography variant="body1">
                {formatDate(invoice.created_at)}
              </Typography>
            </Box>

            {invoice.order && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Order Number
                </Typography>
                <Typography variant="body1">
                  {invoice.order.order_number}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Payment Summary */}
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Total Amount</Typography>
                <Typography>{formatCurrency(invoice.amount_cents)}</Typography>
              </Box>
            </Box>

            {hasDeposit && isFirstPayment && (
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Deposit Required
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(invoice.deposit_amount_cents)}
                  </Typography>
                </Box>
              </Box>
            )}

            {totalPaid > 0 && (
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="success.main">Previously Paid</Typography>
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
              Payment Information
            </Typography>

            {!paymentIntent ? (
              <Alert severity="error">
                Unable to initialize payment. Please refresh the page or contact
                support.
              </Alert>
            ) : (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  To complete the payment functionality, please install:
                  <br />
                  <code>
                    npm install @stripe/react-stripe-js @stripe/stripe-js
                  </code>
                </Alert>

                {/* Uncomment after installing Stripe packages:
                <Elements stripe={stripePromise} options={{ clientSecret: paymentIntent }}>
                  <PublicPaymentForm 
                    amountCents={amountDue}
                    shopName={getShopDisplayName(shop)}
                  />
                </Elements>
                */}

                {/* Temporary placeholder */}
                <Box
                  sx={{
                    p: 3,
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    textAlign: 'center',
                  }}
                >
                  <Typography color="text.secondary">
                    Stripe Payment Element will appear here
                  </Typography>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Security Badge */}
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="caption" color="text.secondary">
            🔒 Your payment information is secure and encrypted
          </Typography>
        </Box>

        {/* Contact Info */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Questions? Contact {shop.name}
          </Typography>
          {shop.email && (
            <Typography variant="body2">
              <MuiLink href={`mailto:${shop.email}`}>{shop.email}</MuiLink>
            </Typography>
          )}
          {shop.phone_number && (
            <Typography variant="body2">{shop.phone_number}</Typography>
          )}
        </Box>
      </Box>
    </Container>
  );
}

// Uncomment after installing Stripe packages:
/*
function PublicPaymentForm({ 
  amountCents, 
  shopName 
}: { 
  amountCents: number;
  shopName: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
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

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href + '/success',
      },
      redirect: 'if_required'
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment succeeded
      toast.success('Payment successful!');
      router.push(window.location.pathname + '/success');
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
        {processing ? 'Processing...' : `Pay ${formatCurrency(amountCents)} to ${shopName}`}
      </Button>
      
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
        By submitting payment, you authorize {shopName} to charge your payment method.
      </Typography>
    </form>
  );
}
*/
