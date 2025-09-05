/**
 * Consolidated overdue logic for garments and orders
 * A garment is NOT overdue if all its services are completed (Ready For Pickup stage)
 * even if the due date is in the past
 */

import type { GarmentStage } from '@/types';
import { parseDateString, parseAnyDateSafely } from './date-time-utils';

export interface GarmentOverdueInfo {
  id?: string;
  due_date?: string | null;
  stage?: GarmentStage | string | null;
  garment_services?: Array<{
    id: string;
    is_done?: boolean | null;
    is_removed?: boolean | null;
  }> | null;
}

export interface OrderOverdueInfo {
  order_due_date?: string | null;
  garments?: GarmentOverdueInfo[];
}

/**
 * Determines if a garment is overdue based on:
 * 1. Due date is in the past
 * 2. NOT all services are completed (excludes soft-deleted services)
 *
 * A garment with all services completed (Ready For Pickup) is never overdue
 */
export function isGarmentOverdue(garment: GarmentOverdueInfo): boolean {
  // No due date means not overdue
  if (!garment.due_date) {
    return false;
  }

  // Check if all active services are completed
  const hasAllServicesCompleted = areAllServicesCompleted(garment);

  // If all services are completed, garment is not overdue regardless of date
  if (hasAllServicesCompleted) {
    return false;
  }

  // Check if due date is in the past
  const dueDate = new Date(garment.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}

/**
 * Checks if all active (non-removed) services are completed
 */
export function areAllServicesCompleted(garment: GarmentOverdueInfo): boolean {
  // If we have service data, check completion status
  if (garment.garment_services && garment.garment_services.length > 0) {
    const activeServices = garment.garment_services.filter(
      (service) => !service.is_removed
    );

    // No active services means effectively complete
    if (activeServices.length === 0) {
      return true;
    }

    // Check if all active services are done
    return activeServices.every((service) => service.is_done === true);
  }

  // If no service data but we have stage, use stage to determine
  if (garment.stage === 'Ready For Pickup' || garment.stage === 'Done') {
    return true;
  }

  // Default to not complete if we can't determine
  return false;
}

/**
 * Calculate days until due (negative means overdue)
 * Returns null if no due date
 */
export function getDaysUntilDue(
  dueDateStr: string | null | undefined
): number | null {
  if (!dueDateStr) return null;

  // Use flexible date parsing to handle both YYYY-MM-DD and ISO formats
  let dueDate: Date;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dueDateStr)) {
    // Pure YYYY-MM-DD format - use safe parsing
    dueDate = parseDateString(dueDateStr);
  } else {
    // ISO format or other - use flexible parsing
    const parsed = parseAnyDateSafely(dueDateStr);
    if (!parsed) return null;
    dueDate = parsed;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const msInDay = 1000 * 60 * 60 * 24;
  return Math.ceil((dueDate.getTime() - today.getTime()) / msInDay);
}

/**
 * Enhanced due date info that includes overdue logic
 */
export interface EnhancedDueDateInfo {
  shortDate: string;
  daysUntilDue: number;
  isPast: boolean;
  isOverdue: boolean; // New field that considers service completion
  isUrgent: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  allServicesCompleted: boolean;
}

/**
 * Get enhanced due date information including service completion status
 */
export function getEnhancedDueDateInfo(
  garment: GarmentOverdueInfo
): EnhancedDueDateInfo | null {
  const daysUntilDue = getDaysUntilDue(garment.due_date);

  if (daysUntilDue === null || !garment.due_date) {
    return null;
  }

  const dueDate = new Date(garment.due_date);
  const allServicesCompleted = areAllServicesCompleted(garment);
  const isPast = daysUntilDue < 0;

  return {
    shortDate: formatDateShort(garment.due_date),
    daysUntilDue,
    isPast,
    isOverdue: isPast && !allServicesCompleted, // Only overdue if past AND services incomplete
    isUrgent: daysUntilDue >= 0 && daysUntilDue <= 3,
    isToday: daysUntilDue === 0,
    isTomorrow: daysUntilDue === 1,
    allServicesCompleted,
  };
}

/**
 * Determines if an order is overdue based on:
 * 1. Order due date OR earliest garment due date
 * 2. Considering service completion status of garments
 */
export function isOrderOverdue(order: OrderOverdueInfo): boolean {
  // First check order due date
  if (order.order_due_date) {
    const dueDate = new Date(order.order_due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    // For order-level due dates, we check if ANY garment is incomplete
    // If all garments have all services completed, order is not overdue
    const allGarmentsComplete =
      order.garments?.every((garment) => areAllServicesCompleted(garment)) ??
      true;

    if (dueDate < today && !allGarmentsComplete) {
      return true;
    }
  }

  // Check if any garment is overdue (considering service completion)
  if (order.garments && order.garments.length > 0) {
    return order.garments.some((garment) => isGarmentOverdue(garment));
  }

  return false;
}

/**
 * Get the effective due date for an order
 * Returns order due date if available, otherwise earliest garment due date
 */
export function getOrderEffectiveDueDate(
  order: OrderOverdueInfo
): string | null {
  if (order.order_due_date) {
    return order.order_due_date;
  }

  // Find earliest garment due date
  if (order.garments && order.garments.length > 0) {
    const garmentDueDates = order.garments
      .map((g) => g.due_date)
      .filter((date): date is string => date != null)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return garmentDueDates[0] || null;
  }

  return null;
}

// Helper function to format date (you may want to import this from date-time-utils)
function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
