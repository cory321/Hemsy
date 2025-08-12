import {
  Container,
  Typography,
  Box,
  Button,
  Chip,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/actions/users';

function formatUSD(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format((cents || 0) / 100);
}

export default async function OrdersPage() {
  await ensureUserAndShop();
  const supabase = await createSupabaseClient();

  const { data: orders } = await supabase
    .from('orders')
    .select(
      `
			id,
			status,
			total_cents,
			created_at,
			client:clients(id, first_name, last_name),
			garments(id)
		`
    )
    .order('created_at', { ascending: false });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'info';
      case 'ready_for_pickup':
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header with title and CTA */}
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

        {/* Orders List */}
        <Stack spacing={2}>
          {!orders || orders.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No orders yet
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  Create your first order to get started
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  component={Link}
                  href="/orders/new"
                >
                  Create Order
                </Button>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => (
              <Card
                key={order.id}
                component={Link}
                href={`/orders/${order.id}`}
                sx={{
                  textDecoration: 'none',
                  '&:hover': {
                    boxShadow: 2,
                  },
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                    }}
                  >
                    <Box>
                      <Typography variant="h6" component="div">
                        {order.client
                          ? `${order.client.first_name} ${order.client.last_name}`
                          : 'Order #' + order.id.slice(0, 8)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString()
                          : 'No date'}{' '}
                        • {order.garments?.length || 0} garment
                        {order.garments?.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        {formatUSD(order.total_cents)}
                      </Typography>
                      <Chip
                        label={getStatusLabel(order.status)}
                        color={getStatusColor(order.status) as any}
                        size="small"
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>

        {/* Mobile Floating Action Button */}
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          href="/orders/new"
          sx={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            display: { xs: 'flex', sm: 'none' },
            zIndex: 1000,
          }}
        >
          Create Order
        </Button>
      </Box>
    </Container>
  );
}
