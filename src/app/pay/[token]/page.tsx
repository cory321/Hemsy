import { Metadata } from 'next';
import PublicPaymentClient from './PublicPaymentClient';
import { Suspense } from 'react';
import { Container, CircularProgress, Box } from '@mui/material';

export const metadata: Metadata = {
  title: 'Pay Invoice | Threadfolio',
  description: 'Complete your payment securely',
};

function PublicPaymentLoading() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    </Container>
  );
}

export default async function PublicPaymentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <Suspense fallback={<PublicPaymentLoading />}>
      <PublicPaymentClient token={token} />
    </Suspense>
  );
}
