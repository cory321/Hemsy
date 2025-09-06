import type { Database } from '@/types/supabase';

/**
 * Get service modification error message for display in UI
 */
export function getServiceModificationError(
  orderStatus: Database['public']['Enums']['order_status']
): string | null {
  if (orderStatus === 'cancelled') {
    return 'Services cannot be modified for cancelled orders';
  }
  return null;
}

/**
 * Check if an order can be cancelled based on its status
 */
export function canCancelOrder(
  orderStatus: Database['public']['Enums']['order_status']
): boolean {
  return orderStatus !== 'completed' && orderStatus !== 'cancelled';
}

/**
 * Check if an order can be restored (uncancelled)
 */
export function canRestoreOrder(
  orderStatus: Database['public']['Enums']['order_status']
): boolean {
  return orderStatus === 'cancelled';
}

/**
 * Get the display label for order cancellation status
 */
export function getCancellationStatusLabel(
  orderStatus: Database['public']['Enums']['order_status']
): string | null {
  switch (orderStatus) {
    case 'cancelled':
      return 'CANCELLED';
    default:
      return null;
  }
}
