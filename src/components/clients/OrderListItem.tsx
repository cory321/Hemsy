'use client';

import { Box, Card, Chip, Typography, IconButton } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import Link from 'next/link';
import type { Order } from '@/types';

interface OrderListItemProps {
  order: Order;
  garmentCount: number;
}

export function OrderListItem({ order, garmentCount }: OrderListItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'default';
      case 'active':
        return 'info';
      case 'ready':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new':
        return 'New';
      case 'active':
        return 'Active';
      case 'ready':
        return 'Ready';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Card
      component={Link}
      href={`/orders/${order.id}`}
      sx={{
        p: 2,
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: 'action.hover',
          transform: 'translateY(-2px)',
          boxShadow: 2,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {/* Order Number and Status */}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="subtitle1" fontWeight="medium">
              Order #{(order as any).order_number ?? order.id.slice(0, 8)}
            </Typography>
            <Chip
              label={getStatusLabel(order.status || 'new')}
              color={getStatusColor(order.status || 'new')}
              size="small"
            />
            {(order as any).is_paid && (
              <Chip
                label="Paid"
                color="success"
                size="small"
                variant="outlined"
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {/* Garment Count */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckroomIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {garmentCount} {garmentCount === 1 ? 'garment' : 'garments'}
              </Typography>
            </Box>

            {/* Created Date */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CalendarTodayIcon
                sx={{ fontSize: 16, color: 'text.secondary' }}
              />
              <Typography variant="body2" color="text.secondary">
                {formatDate(order.created_at || new Date().toISOString())}
              </Typography>
            </Box>

            {/* Total */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AttachMoneyIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(
                  (order as any).total_cents ?? (order as any).total ?? 0
                )}
              </Typography>
            </Box>
          </Box>

          {/* Due Date if exists */}
          {order.order_due_date && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Due: {formatDate(order.order_due_date)}
            </Typography>
          )}
        </Box>

        {/* Arrow Icon */}
        <IconButton size="small" sx={{ ml: 'auto' }}>
          <ChevronRightIcon />
        </IconButton>
      </Box>
    </Card>
  );
}
