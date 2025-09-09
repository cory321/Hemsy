import { Typography, Box } from '@mui/material';
import { Suspense } from 'react';
import AddClientCtas from '@/components/clients/AddClientCtas';
import ClientsListWrapper from './ClientsListWrapper';
import ClientsListSkeleton from '@/components/clients/ClientsListSkeleton';

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic';

export default function ClientsPage() {
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mt: 2, mb: 4 }}>
        {/* Header with title and desktop CTA - loads immediately */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography variant="h4" component="h1">
            Clients
          </Typography>
          <AddClientCtas />
        </Box>

        {/* Clients List with pagination - shows skeleton while loading */}
        <Suspense fallback={<ClientsListSkeleton />}>
          <ClientsListWrapper />
        </Suspense>

        {/* Mobile FAB is rendered inside AddClientCtas */}
      </Box>
    </Box>
  );
}
