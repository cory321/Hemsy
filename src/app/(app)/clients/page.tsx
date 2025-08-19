import { Container, Typography, Box } from '@mui/material';
import ClientsList from '@/components/clients/ClientsList';
import { getClients } from '@/lib/actions/clients';
import AddClientCtas from '@/components/clients/AddClientCtas';

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  // Fetch initial data server-side
  const initialData = await getClients(1, 10);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header with title and desktop CTA */}
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

        {/* Clients List with pagination */}
        <ClientsList initialData={initialData} getClientsAction={getClients} />

        {/* Mobile FAB is rendered inside AddClientCtas */}
      </Box>
    </Container>
  );
}
