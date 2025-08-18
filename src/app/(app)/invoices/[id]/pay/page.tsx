import { Metadata } from 'next';
import PaymentFormClient from './PaymentFormClient';
import { Suspense } from 'react';
import { Container, CircularProgress, Box } from '@mui/material';

// NOTE: You need to install these packages:
// npm install @stripe/react-stripe-js @stripe/stripe-js

export const metadata: Metadata = {
  title: 'Pay Invoice | Threadfolio',
  description: 'Make a payment for your invoice',
};

function PaymentFormLoading() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    </Container>
  );
}

export default async function PaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ client_secret?: string }>;
}) {
  const { id } = await params;
  const { client_secret } = await searchParams;

  return (
    <Suspense fallback={<PaymentFormLoading />}>
      {client_secret ? (
        <PaymentFormClient invoiceId={id} clientSecret={client_secret} />
      ) : (
        <PaymentFormClient invoiceId={id} />
      )}
    </Suspense>
  );
}
