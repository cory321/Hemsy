import { describe, it, expect } from '@jest/globals';
import {
  getServiceModificationError,
  canCancelOrder,
  canRestoreOrder,
  getCancellationStatusLabel,
} from '@/lib/utils/order-cancellation';
import type { Database } from '@/types/supabase';

type OrderStatus = Database['public']['Enums']['order_status'];

describe('Order Cancellation Utils', () => {
  describe('getServiceModificationError', () => {
    it('should return error message for cancelled orders', () => {
      const result = getServiceModificationError('cancelled' as OrderStatus);
      expect(result).toBe('Services cannot be modified for cancelled orders');
    });

    it('should return null for non-cancelled orders', () => {
      const statuses: OrderStatus[] = [
        'new',
        'active',
        'ready_for_pickup',
        'completed',
      ];

      statuses.forEach((status) => {
        const result = getServiceModificationError(status);
        expect(result).toBeNull();
      });
    });
  });

  describe('canCancelOrder', () => {
    it('should return true for cancellable order statuses', () => {
      const cancellableStatuses: OrderStatus[] = [
        'new',
        'active',
        'ready_for_pickup',
      ];

      cancellableStatuses.forEach((status) => {
        expect(canCancelOrder(status)).toBe(true);
      });
    });

    it('should return false for non-cancellable order statuses', () => {
      const nonCancellableStatuses: OrderStatus[] = ['completed', 'cancelled'];

      nonCancellableStatuses.forEach((status) => {
        expect(canCancelOrder(status)).toBe(false);
      });
    });
  });

  describe('canRestoreOrder', () => {
    it('should return true only for cancelled orders', () => {
      expect(canRestoreOrder('cancelled' as OrderStatus)).toBe(true);
    });

    it('should return false for non-cancelled orders', () => {
      const nonCancelledStatuses: OrderStatus[] = [
        'new',
        'active',
        'ready_for_pickup',
        'completed',
      ];

      nonCancelledStatuses.forEach((status) => {
        expect(canRestoreOrder(status)).toBe(false);
      });
    });
  });

  describe('getCancellationStatusLabel', () => {
    it('should return CANCELLED for cancelled orders', () => {
      expect(getCancellationStatusLabel('cancelled' as OrderStatus)).toBe(
        'CANCELLED'
      );
    });

    it('should return null for non-cancelled orders', () => {
      const nonCancelledStatuses: OrderStatus[] = [
        'new',
        'active',
        'ready_for_pickup',
        'completed',
      ];

      nonCancelledStatuses.forEach((status) => {
        expect(getCancellationStatusLabel(status)).toBeNull();
      });
    });
  });
});
