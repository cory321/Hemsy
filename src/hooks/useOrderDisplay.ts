/**
 * Hook for displaying orders with proper timezone conversion
 *
 * This hook handles converting UTC order due dates to the user's local timezone
 * and provides formatted display strings.
 */

import { useMemo } from 'react';
import type { Tables } from '@/types/supabase';
import { useUserTimezone } from '@/hooks/useAppointmentDisplay';
import { convertUTCToLocal, formatInTimezone } from '@/lib/utils/date-time-utc';
import { format, parseISO } from 'date-fns';

export interface OrderDisplay extends Omit<Tables<'orders'>, 'due_at'> {
  // Local display values
  displayDueDate: string | null;
  displayDueDateFormatted: string | null;
  // Original UTC value (if available)
  dueAtUTC?: string | null;
}

/**
 * Convert a single order to display format
 */
function convertOrderForDisplay(
  order: Tables<'orders'> & { due_at?: string | null },
  timezone: string
): OrderDisplay {
  // Check if we have UTC field
  const hasUTCField = !!(order as any).due_at;

  let displayDueDate = order.order_due_date;
  let displayDueDateFormatted: string | null = null;

  if (hasUTCField && order.due_at) {
    // Convert from UTC to local timezone
    const dueLocal = convertUTCToLocal(order.due_at, timezone);
    displayDueDate = dueLocal.date;
  }

  // Format the due date if available
  if (displayDueDate) {
    const dateObj = parseISO(displayDueDate);
    displayDueDateFormatted = format(dateObj, 'MMM d, yyyy');
  }

  const { due_at, ...orderWithoutUTC } = order;

  return {
    ...orderWithoutUTC,
    displayDueDate,
    displayDueDateFormatted,
    ...(hasUTCField
      ? {
          dueAtUTC: order.due_at,
        }
      : {}),
  };
}

/**
 * Hook to convert order for display with timezone support
 */
export function useOrderDisplay(
  order: (Tables<'orders'> & { due_at?: string | null }) | null | undefined
): {
  order: OrderDisplay | null;
  isLoading: boolean;
  timezone: string | null;
} {
  const { data: timezone, isLoading } = useUserTimezone();

  const displayOrder = useMemo(() => {
    if (!order || !timezone) return null;
    return convertOrderForDisplay(order, timezone);
  }, [order, timezone]);

  return {
    order: displayOrder,
    isLoading,
    timezone: timezone || null,
  };
}

/**
 * Hook to convert multiple orders for display
 */
export function useOrdersDisplay(
  orders: Array<Tables<'orders'> & { due_at?: string | null }>
): {
  orders: OrderDisplay[];
  isLoading: boolean;
  timezone: string | null;
} {
  const { data: timezone, isLoading } = useUserTimezone();

  const displayOrders = useMemo(() => {
    if (!timezone) return [];
    return orders.map((order) => convertOrderForDisplay(order, timezone));
  }, [orders, timezone]);

  return {
    orders: displayOrders,
    isLoading,
    timezone: timezone || null,
  };
}

/**
 * Utility to check if order is using UTC fields
 */
export function isOrderUsingUTC(
  order: Tables<'orders'> & { due_at?: string | null }
): boolean {
  return !!(order as any).due_at;
}
