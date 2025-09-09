import { Metadata } from 'next';
import InvoicesClient from './InvoicesClient';
import { Suspense } from 'react';
import { Container, Skeleton, Box } from '@mui/material';

export const metadata: Metadata = {
  title: 'Invoices | Hemsy',
  description: 'Manage your invoices and payments',
};

function InvoicesLoading() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 3 }} />
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 2,
            mb: 3,
          }}
        >
          {[1, 2, 3, 4].map((i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={120}
              sx={{ borderRadius: 1 }}
            />
          ))}
        </Box>
        <Skeleton
          variant="rectangular"
          height={56}
          sx={{ mb: 3, borderRadius: 1 }}
        />
        <Skeleton
          variant="rectangular"
          height={48}
          sx={{ mb: 3, borderRadius: 1 }}
        />
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={80}
            sx={{ mb: 1, borderRadius: 1 }}
          />
        ))}
      </Box>
    </Container>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<InvoicesLoading />}>
      <InvoicesClient />
    </Suspense>
  );
}
