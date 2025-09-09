import { Metadata } from 'next';
import InvoiceDetailClient from './InvoiceDetailClient';
import { Suspense } from 'react';
import { Container, CircularProgress, Box } from '@mui/material';

export const metadata: Metadata = {
  title: 'Invoice Details | Hemsy',
  description: 'View invoice details and payment history',
};

function InvoiceDetailLoading() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    </Container>
  );
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<InvoiceDetailLoading />}>
      <InvoiceDetailClient invoiceId={id} />
    </Suspense>
  );
}
