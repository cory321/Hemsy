import { Container, Typography, Box, Fab, Button } from '@mui/material';
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            href="/clients/new"
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Add Client
          </Button>
        </Box>

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
            display: { xs: 'flex', sm: 'none' },
          }}
        >
          <AddIcon />
        </Fab>
      </Box>
    </Container>
  );
}
