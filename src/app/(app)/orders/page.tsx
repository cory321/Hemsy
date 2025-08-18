import { Container, Typography, Box, Button, Fab } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import OrdersList from '@/components/orders/OrdersList';
import { getOrdersPaginated } from '@/lib/actions/orders';

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  // Fetch initial data server-side
  const initialData = await getOrdersPaginated(1, 10);

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
            Orders
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            href="/orders/new"
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            Create Order
          </Button>
        </Box>

        {/* Orders List with pagination */}
        <OrdersList
          initialData={initialData}
          getOrdersAction={getOrdersPaginated}
        />

        {/* Floating Action Button */}
        <Fab
          color="primary"
          aria-label="add order"
          component={Link}
          href="/orders/new"
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
