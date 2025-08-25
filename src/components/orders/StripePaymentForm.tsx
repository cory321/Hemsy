'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Alert,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface StripePaymentFormProps {
  totalAmount: number;
  depositAmount?: number;
  clientEmail: string;
  onPaymentMethodCollected: (paymentMethod: any) => void;
  onCancel: () => void;
}

export default function StripePaymentForm({
  totalAmount,
  depositAmount,
  clientEmail,
  onPaymentMethodCollected,
  onCancel,
}: StripePaymentFormProps) {
  const amountToCharge = depositAmount || totalAmount;

  if (!publishableKey) {
    return (
      <Alert severity="error">
        Stripe is not configured. Please contact support.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        💳 Card Payment Setup
      </Typography>

      <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Will charge: <strong>${(amountToCharge / 100).toFixed(2)}</strong>
        </Typography>
        {depositAmount && (
          <Typography variant="caption" color="text.secondary">
            (Deposit payment - $
            {((totalAmount - depositAmount) / 100).toFixed(2)} remaining)
          </Typography>
        )}
      </Box>

      <Elements
        stripe={stripePromise!}
        options={{
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#1976d2',
              fontFamily: 'Roboto, sans-serif',
            },
          },
        }}
      >
        <CardInputForm
          amountToCharge={amountToCharge}
          clientEmail={clientEmail}
          onPaymentMethodCollected={onPaymentMethodCollected}
          onCancel={onCancel}
        />
      </Elements>
    </Box>
  );
}

function CardInputForm({
  amountToCharge,
  clientEmail,
  onPaymentMethodCollected,
  onCancel,
}: {
  amountToCharge: number;
  clientEmail: string;
  onPaymentMethodCollected: (paymentMethod: any) => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardholderName, setCardholderName] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [paymentMethodReady, setPaymentMethodReady] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError('Card element not found');
        setProcessing(false);
        return;
      }

      // Create payment method (but don't charge yet)
      const { error: paymentMethodError, paymentMethod } =
        await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            name: cardholderName,
            email: clientEmail,
          },
        });

      if (paymentMethodError) {
        setError(paymentMethodError.message || 'Failed to process card');
        setProcessing(false);
        return;
      }

      // Pass the payment method back to the parent
      onPaymentMethodCollected({
        id: paymentMethod.id,
        card: paymentMethod.card,
        billing_details: paymentMethod.billing_details,
        save_for_future: saveCard,
      });

      setProcessing(false); // Reset processing state after success
      setPaymentMethodReady(true); // Show success state
    } catch (err) {
      setError('An unexpected error occurred');
      setProcessing(false);
    }
  };

  if (paymentMethodReady) {
    return (
      <Box>
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ Card validated and ready for payment
        </Alert>
        <Typography variant="body2" color="text.secondary">
          The card will be charged when you create the order.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            onClick={() => {
              setPaymentMethodReady(false);
              setCardholderName('');
              setError(null);
            }}
            variant="outlined"
            sx={{ flex: 1 }}
          >
            Change Card
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          label="Customer Email"
          value={clientEmail}
          disabled
          helperText="Payment receipt will be sent to this email"
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Cardholder Name"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          required
          sx={{ mb: 2 }}
        />
      </Box>

      <Box sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
            hidePostalCode: false,
          }}
        />
      </Box>

      <FormControlLabel
        control={
          <Checkbox
            checked={saveCard}
            onChange={(e) => setSaveCard(e.target.checked)}
          />
        }
        label="Save card for future payments (optional)"
        sx={{ mb: 2 }}
      />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Button
          onClick={onCancel}
          disabled={processing}
          variant="outlined"
          sx={{ flex: 1 }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={!stripe || processing || !cardholderName}
          sx={{ flex: 1 }}
        >
          {processing ? 'Validating...' : 'Use This Card'}
        </Button>
      </Box>
    </form>
  );
}
