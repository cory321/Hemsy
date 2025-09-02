import { addService } from '@/lib/actions/services';
import { addService as addServiceFromOrders } from '@/lib/actions/orders';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth/user-shop');
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('Service Duplicate Name Handling - Server Actions', () => {
  const mockSupabase = {
    from: jest.fn(),
  };

  const mockShop = {
    id: 'shop-123',
    name: 'Test Shop',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (ensureUserAndShop as jest.Mock).mockResolvedValue({ shop: mockShop });
  });

  describe('addService from services.ts', () => {
    it('should throw a user-friendly error for duplicate service names', async () => {
      const duplicateError = {
        code: '23505',
        message:
          'duplicate key value violates unique constraint "services_shop_id_name_key"',
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: duplicateError,
            }),
          }),
        }),
      });

      const serviceData = {
        name: 'Existing Service',
        description: 'Test description',
        default_qty: 1,
        default_unit: 'flat_rate',
        default_unit_price_cents: 5000,
      };

      await expect(addService(serviceData)).rejects.toThrow(
        'A service with this name already exists. Please choose a different name.'
      );
    });

    it('should throw the original error for other database errors', async () => {
      const otherError = {
        code: '42P01',
        message: 'relation "services" does not exist',
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: otherError,
            }),
          }),
        }),
      });

      const serviceData = {
        name: 'New Service',
        description: 'Test description',
        default_qty: 1,
        default_unit: 'flat_rate',
        default_unit_price_cents: 5000,
      };

      await expect(addService(serviceData)).rejects.toThrow(
        'relation "services" does not exist'
      );
    });

    it('should successfully create a service when name is unique', async () => {
      const newService = {
        id: 'service-456',
        shop_id: 'shop-123',
        name: 'Unique Service',
        description: 'Test description',
        default_qty: 1,
        default_unit: 'flat_rate',
        default_unit_price_cents: 5000,
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: newService,
              error: null,
            }),
          }),
        }),
      });

      const serviceData = {
        name: 'Unique Service',
        description: 'Test description',
        default_qty: 1,
        default_unit: 'flat_rate',
        default_unit_price_cents: 5000,
      };

      const result = await addService(serviceData);
      expect(result).toEqual(newService);
    });
  });

  describe('addService from orders.ts', () => {
    it('should return user-friendly error for duplicate service names', async () => {
      const duplicateError = {
        code: '23505',
        message:
          'duplicate key value violates unique constraint "services_shop_id_name_key"',
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: duplicateError,
            }),
          }),
        }),
      });

      const serviceInput = {
        name: 'Existing Service',
        description: 'Test description',
        defaultQty: 1,
        defaultUnit: 'item',
        defaultUnitPriceCents: 5000,
      };

      const result = await addServiceFromOrders(serviceInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.name).toContain(
          'A service with this name already exists. Please choose a different name.'
        );
      }
    });

    it('should return generic error for other database errors', async () => {
      const otherError = {
        code: '42P01',
        message: 'relation "services" does not exist',
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: otherError,
            }),
          }),
        }),
      });

      const serviceInput = {
        name: 'New Service',
        description: 'Test description',
        defaultQty: 1,
        defaultUnit: 'item',
        defaultUnitPriceCents: 5000,
      };

      const result = await addServiceFromOrders(serviceInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.name).toContain(
          'relation "services" does not exist'
        );
      }
    });

    it('should successfully create a service when name is unique', async () => {
      const newService = {
        id: 'service-789',
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: newService,
              error: null,
            }),
          }),
        }),
      });

      const serviceInput = {
        name: 'Unique Service',
        description: 'Test description',
        defaultQty: 1,
        defaultUnit: 'item',
        defaultUnitPriceCents: 5000,
      };

      const result = await addServiceFromOrders(serviceInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.serviceId).toBe('service-789');
      }
    });
  });

  describe('Error message consistency', () => {
    it('should use the same error message across both implementations', async () => {
      const duplicateError = {
        code: '23505',
        message:
          'duplicate key value violates unique constraint "services_shop_id_name_key"',
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: duplicateError,
            }),
          }),
        }),
      });

      // Test services.ts implementation
      const serviceData1 = {
        name: 'Duplicate',
        description: null,
        default_qty: 1,
        default_unit: 'flat_rate',
        default_unit_price_cents: 5000,
      };

      let error1Message = '';
      try {
        await addService(serviceData1);
      } catch (error) {
        error1Message = (error as Error).message;
      }

      // Test orders.ts implementation
      const serviceData2 = {
        name: 'Duplicate',
        defaultQty: 1,
        defaultUnit: 'item',
        defaultUnitPriceCents: 5000,
      };

      const result2 = await addServiceFromOrders(serviceData2);
      const error2Message = !result2.success ? result2.errors.name?.[0] : '';

      // Both should have the same user-friendly message
      expect(error1Message).toBe(
        'A service with this name already exists. Please choose a different name.'
      );
      expect(error2Message).toBe(
        'A service with this name already exists. Please choose a different name.'
      );
    });
  });
});
