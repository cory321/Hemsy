/**
 * Utility functions for order status display
 */

import type { OrderStatus } from '@/types';

/**
 * Get the color for an order status
 */
export function getOrderStatusColor(
  status: OrderStatus | string
): 'default' | 'info' | 'warning' | 'success' | 'error' {
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
}

/**
 * Get the display label for an order status
 */
export function getOrderStatusLabel(status: OrderStatus | string): string {
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
      // Capitalize first letter as fallback
      return status
        ? status.charAt(0).toUpperCase() + status.slice(1)
        : 'Unknown';
  }
}
