'use client';

import { Container, Typography, Box } from '@mui/material';
import Link from 'next/link';
import { OrderFlowProvider } from '@/contexts/OrderFlowContext';
import OrderFlowStepper from '@/components/orders/OrderFlowStepper';

export default function NewOrderPage() {
  return (
    <OrderFlowProvider>
      <Container maxWidth="lg">
        <Box
          sx={{
            mt: 4,
            mb: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography variant="h4" component="h1">
            Create New Order
          </Typography>
          <Typography
            component={Link}
            href="/orders"
            style={{ textDecoration: 'none' }}
          >
            Cancel
          </Typography>
        </Box>
        <OrderFlowStepper />
      </Container>
    </OrderFlowProvider>
  );
}
