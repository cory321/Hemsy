'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  IconButton,
  Skeleton,
  Typography,
  Chip,
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import AddIcon from '@mui/icons-material/Add';
import Link from 'next/link';
import type { Order } from '@/types';
import { OrderListItem } from './OrderListItem';

interface ClientOrdersSectionProps {
  clientId: string;
  clientName: string;
}

interface OrderWithGarmentCount extends Order {
  garment_count: number;
}

export function ClientOrdersSection({
  clientId,
  clientName,
}: ClientOrdersSectionProps) {
  const [orders, setOrders] = useState<OrderWithGarmentCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const url = new URL(
          `/api/clients/${clientId}/orders`,
          window.location.origin
        );
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('Failed to load orders');
        const data = await res.json();
        const normalized = (data.orders as any[]).map((o) => ({
          ...o,
          total: (o.total_cents ?? 0) / 100,
        }));
        setOrders(normalized);
      } catch (err) {
        setError('Failed to load orders');
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [clientId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'info';
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <Card elevation={2} sx={{ mt: 3 }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <ShoppingBagIcon color="primary" />
            Orders ({orders.length})
          </Typography>

          <Button
            component={Link}
            href={`/orders/new?clientId=${clientId}`}
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
          >
            New Order
          </Button>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
            <Skeleton variant="rounded" height={80} />
            <Skeleton variant="rounded" height={80} />
            <Skeleton variant="rounded" height={80} />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        ) : orders.length === 0 ? (
          <Typography
            color="text.secondary"
            sx={{ mt: 2, textAlign: 'center' }}
          >
            No orders yet for {clientName}
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {orders.map((order) => (
              <OrderListItem
                key={order.id}
                order={order}
                garmentCount={order.garment_count}
              />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

export default ClientOrdersSection;
