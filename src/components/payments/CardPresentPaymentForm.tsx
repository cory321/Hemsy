'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';

// Initialize Stripe with card-present optimized settings
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  {
    // Disable Link and other saved payment method features
    betas: [], // Don't include Link beta
  }
);

// Card Element styling optimized for POS use
const cardElementOptions = {
  style: {
    base: {
      fontSize: '18px', // Larger font for better visibility
      color: '#424770',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': {
        color: '#aab7c4',
      },
      iconColor: '#666EE8',
    },
    invalid: {
      color: '#e25950',
      iconColor: '#e25950',
    },
    complete: {
      iconColor: '#13ce66',
    },
  },
  // Card-present optimized settings
  hidePostalCode: false, // Keep for fraud protection
  disableLink: true, // Disable Link completely
  iconStyle: 'solid' as const,
  // Enhanced card validation
  classes: {
    focus: 'StripeElement--focus',
    empty: 'StripeElement--empty',
    invalid: 'StripeElement--invalid',
  },
};

interface CardPresentPaymentFormProps {
  invoiceId: string;
  amountCents: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

function PaymentForm({
  invoiceId,
  amountCents,
  onSuccess,
  onError,
}: CardPresentPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  // Set up card element event listeners
  useEffect(() => {
    if (!elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    const handleChange = (event: any) => {
      setCardComplete(event.complete);
      setCardError(event.error ? event.error.message : null);
    };

    const handleReady = () => {
      // Card element is ready - can focus if needed
      console.log('Card element ready');
    };

    const handleFocus = () => {
      // Clear any previous errors when user starts typing
      setCardError(null);
    };

    cardElement.on('change', handleChange);
    cardElement.on('ready', handleReady);
    cardElement.on('focus', handleFocus);

    return () => {
      cardElement.off('change', handleChange);
      cardElement.off('ready', handleReady);
      cardElement.off('focus', handleFocus);
    };
  }, [elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe has not loaded yet. Please try again.');
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError('Card element not found. Please refresh and try again.');
      return;
    }

    setProcessing(true);
    setError(null);
    setCardError(null);

    try {
      // Create payment intent for card-present transaction
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId,
          paymentType: 'full',
          amountCents,
          // Card-present specific metadata
          metadata: {
            payment_context: 'card_present_merchant_assisted',
            pos_location: 'seamstress_shop',
            merchant_present: 'true',
          },
        }),
      });

      const { clientSecret, error: backendError } = await response.json();

      if (backendError) {
        throw new Error(backendError);
      }

      // Create Radar session for enhanced fraud protection
      const radarSession = await stripe.createRadarSession();

      // Confirm payment with card-present optimized settings
      const { error: confirmError, paymentIntent } =
        await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                // Don't collect customer details - merchant handles this
                name: 'Card Present Transaction',
              },
            },
            // Include Radar session for fraud analysis
            // radar_options: radarSession?.radarSession
            // 	? {
            // 			session: radarSession.radarSession.id,
            // 		}
            // 	: undefined,
          },
          {
            // Handle actions immediately (no redirects in POS environment)
            handleActions: true,
          }
        );

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess(paymentIntent.id);
      } else {
        throw new Error(`Payment status: ${paymentIntent?.status}`);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ width: '100%', maxWidth: 400 }}
    >
      <Typography variant="h6" gutterBottom>
        Card Payment - ${(amountCents / 100).toFixed(2)}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Please insert, tap, or swipe the customer&apos;s card
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {cardError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {cardError}
        </Alert>
      )}

      <Box
        sx={{
          p: 2,
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          mb: 2,
          backgroundColor: '#fafafa',
        }}
      >
        <CardElement options={cardElementOptions} />
      </Box>

      <Button
        type="submit"
        variant="contained"
        fullWidth
        size="large"
        disabled={!stripe || processing}
        startIcon={processing ? <CircularProgress size={20} /> : null}
        sx={{ mt: 2 }}
      >
        {processing ? 'Processing Payment...' : 'Charge Card'}
      </Button>

      <Typography
        variant="caption"
        display="block"
        sx={{ mt: 1, textAlign: 'center' }}
      >
        Powered by Stripe • PCI Compliant
      </Typography>
    </Box>
  );
}

export default function CardPresentPaymentForm(
  props: CardPresentPaymentFormProps
) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
}
