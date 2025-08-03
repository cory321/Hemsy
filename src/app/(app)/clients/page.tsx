import { Container, Typography, Box, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import ClientsList from '@/components/clients/ClientsList';
import { getClients } from '@/lib/actions/clients';

export default async function ClientsPage() {
  // Fetch initial data server-side
  const initialData = await getClients(1, 10);

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Clients
        </Typography>

        {/* Clients List with pagination */}
        <ClientsList initialData={initialData} getClientsAction={getClients} />

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add client"
          component={Link}
          href="/clients/new"
          sx={{
            position: 'fixed',
            bottom: 80,
            right: 16,
          }}
        >
          <AddIcon />
        </Fab>
      </Box>
    </Container>
  );
}
