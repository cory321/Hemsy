import {
  updateGarment,
  addServiceToGarment,
  removeServiceFromGarment,
  updateGarmentService,
  getGarmentHistory,
} from '@/lib/actions/garments';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth/user-shop');
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

describe('Garment Actions', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create a chainable mock object
    const createChainableMock = () => {
      const mock: any = {
        from: jest.fn(),
        select: jest.fn(),
        eq: jest.fn(),
        single: jest.fn(),
        update: jest.fn(),
        insert: jest.fn(),
        delete: jest.fn(),
        order: jest.fn(),
        rpc: jest.fn(),
      };

      // Make all methods return the mock itself for chaining
      Object.keys(mock).forEach((key) => {
        if (key !== 'single' && key !== 'rpc') {
          mock[key].mockReturnValue(mock);
        }
      });

      return mock;
    };

    mockSupabase = createChainableMock();

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (ensureUserAndShop as jest.Mock).mockResolvedValue({
      user: {
        id: '550e8400-e29b-41d4-a716-446655440003',
        email: 'test@example.com',
      },
      shop: { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Test Shop' },
    });

    // Default RPC mock
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
  });

  describe('updateGarment', () => {
    it.skip('should update garment successfully', async () => {
      const mockGarment = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Garment',
        due_date: null,
        event_date: null,
        orders: { shop_id: '550e8400-e29b-41d4-a716-446655440001' },
      };

      // Mock the garment fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: mockGarment,
        error: null,
      });

      // Mock the update operation - eq() resolves the chain
      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      const result = await updateGarment({
        garmentId: '550e8400-e29b-41d4-a716-446655440000',
        updates: {
          name: 'Updated Garment',
          dueDate: '2024-12-31',
        },
      });

      expect(result.success).toBe(true);
      expect(mockSupabase.update).toHaveBeenCalled();
    });

    it.skip('should handle garment not found error', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Not found' },
      });

      const result = await updateGarment({
        garmentId: '550e8400-e29b-41d4-a716-446655440002',
        updates: { name: 'Test' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Garment not found');
    });

    it.skip('should create history entry when due date is changed', async () => {
      const mockGarment = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Garment',
        due_date: '2024-01-15',
        event_date: null,
        preset_icon_key: null,
        preset_fill_color: null,
        notes: null,
        orders: { shop_id: '550e8400-e29b-41d4-a716-446655440001' },
      };

      // Mock fetching existing garment
      mockSupabase.single.mockResolvedValueOnce({
        data: mockGarment,
        error: null,
      });

      // Mock update
      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      // Mock history insert
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await updateGarment({
        garmentId: '550e8400-e29b-41d4-a716-446655440000',
        updates: {
          dueDate: '2024-01-20',
        },
      });

      expect(result.success).toBe(true);

      // Verify history was created
      expect(mockSupabase.from).toHaveBeenCalledWith('garment_history');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            garment_id: '550e8400-e29b-41d4-a716-446655440000',
            changed_by: '550e8400-e29b-41d4-a716-446655440003',
            field_name: 'due_date',
            old_value: '2024-01-15',
            new_value: '2024-01-20',
            change_type: 'field_update',
          }),
        ])
      );
    });

    it.skip('should create multiple history entries for multiple field changes', async () => {
      const mockGarment = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Old Name',
        due_date: '2024-01-15',
        event_date: null,
        preset_icon_key: 'icon1',
        preset_fill_color: '#FF0000',
        notes: 'Old notes',
        orders: { shop_id: '550e8400-e29b-41d4-a716-446655440001' },
      };

      // Mock fetching existing garment
      mockSupabase.single.mockResolvedValueOnce({
        data: mockGarment,
        error: null,
      });

      // Mock update
      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      // Mock history insert
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await updateGarment({
        garmentId: '550e8400-e29b-41d4-a716-446655440000',
        updates: {
          name: 'New Name',
          dueDate: '2024-01-20',
          notes: 'New notes',
        },
      });

      expect(result.success).toBe(true);

      // Verify history was created for all changed fields
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            field_name: 'name',
            old_value: 'Old Name',
            new_value: 'New Name',
            change_type: 'field_update',
          }),
          expect.objectContaining({
            field_name: 'due_date',
            old_value: '2024-01-15',
            new_value: '2024-01-20',
            change_type: 'field_update',
          }),
          expect.objectContaining({
            field_name: 'notes',
            old_value: 'Old notes',
            new_value: 'New notes',
            change_type: 'field_update',
          }),
        ])
      );
    });

    it.skip('should not create history if values are unchanged', async () => {
      const mockGarment = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Garment',
        due_date: '2024-01-15',
        event_date: null,
        preset_icon_key: null,
        preset_fill_color: null,
        notes: null,
        orders: { shop_id: '550e8400-e29b-41d4-a716-446655440001' },
      };

      // Mock fetching existing garment
      mockSupabase.single.mockResolvedValueOnce({
        data: mockGarment,
        error: null,
      });

      // Mock update
      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      // Reset mock to track calls from this test only
      mockSupabase.from.mockClear();

      const result = await updateGarment({
        garmentId: '550e8400-e29b-41d4-a716-446655440000',
        updates: {
          name: 'Test Garment', // Same name
          dueDate: '2024-01-15', // Same date
        },
      });

      expect(result.success).toBe(true);

      // Verify no garment_history table was accessed
      const fromCalls = mockSupabase.from.mock.calls;
      const historyTableAccessed = fromCalls.some(
        (call: any[]) => call[0] === 'garment_history'
      );
      expect(historyTableAccessed).toBe(false);
    });

    it.skip('should preserve date strings without timezone conversion', async () => {
      const mockGarment = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Test Garment',
        due_date: '2025-08-28',
        event_date: '2025-08-30',
        orders: { shop_id: '550e8400-e29b-41d4-a716-446655440001' },
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockGarment,
        error: null,
      });

      // For the update chain
      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      // For the history insert
      mockSupabase.insert.mockResolvedValueOnce({ error: null });

      const result = await updateGarment({
        garmentId: '550e8400-e29b-41d4-a716-446655440000',
        updates: {
          dueDate: '2025-08-29',
          eventDate: '2025-08-31',
        },
      });

      expect(result.success).toBe(true);

      // Verify the dates were passed as strings to the update call
      const updateCall = mockSupabase.update.mock.calls[0][0];
      expect(updateCall.due_date).toBe('2025-08-29');
      expect(updateCall.event_date).toBe('2025-08-31');

      // Verify history entries stored the correct date strings
      const insertCall = mockSupabase.insert.mock.calls[0][0];
      const dueDateEntry = insertCall.find(
        (e: any) => e.field_name === 'due_date'
      );
      const eventDateEntry = insertCall.find(
        (e: any) => e.field_name === 'event_date'
      );

      expect(dueDateEntry.old_value).toBe('2025-08-28');
      expect(dueDateEntry.new_value).toBe('2025-08-29');
      expect(eventDateEntry.old_value).toBe('2025-08-30');
      expect(eventDateEntry.new_value).toBe('2025-08-31');
    });
  });

  describe('addServiceToGarment', () => {
    it.skip('should add service from catalog successfully', async () => {
      const mockGarment = {
        id: 'garment-123',
        orders: { shop_id: '550e8400-e29b-41d4-a716-446655440001' },
      };
      const mockService = {
        id: 'service-123',
        name: 'Hemming',
        default_unit: 'flat_rate',
        default_unit_price_cents: 1500,
        default_qty: 1,
      };

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockGarment, error: null })
        .mockResolvedValueOnce({ data: mockService, error: null })
        .mockResolvedValueOnce({
          data: { id: 'garment-service-123' },
          error: null,
        });

      const result = await addServiceToGarment({
        garmentId: 'garment-123',
        serviceId: 'service-123',
      });

      expect(result.success).toBe(true);
      expect(result.serviceId).toBe('garment-service-123');
    });

    it.skip('should add custom service successfully', async () => {
      const mockGarment = {
        id: 'garment-123',
        orders: { shop_id: '550e8400-e29b-41d4-a716-446655440001' },
      };

      mockSupabase.single
        .mockResolvedValueOnce({ data: mockGarment, error: null })
        .mockResolvedValueOnce({
          data: { id: 'garment-service-123' },
          error: null,
        });

      const result = await addServiceToGarment({
        garmentId: 'garment-123',
        customService: {
          name: 'Custom Alteration',
          description: 'Special work',
          unit: 'hour',
          unitPriceCents: 5000,
          quantity: 2,
        },
      });

      expect(result.success).toBe(true);
      expect(result.serviceId).toBe('garment-service-123');
    });
  });

  describe('removeServiceFromGarment', () => {
    it.skip('should remove service successfully', async () => {
      const mockService = {
        id: 'garment-service-123',
        garment_id: 'garment-123',
        name: 'Hemming',
        quantity: 1,
        unit_price_cents: 1500,
        garments: {
          orders: { shop_id: '550e8400-e29b-41d4-a716-446655440001' },
        },
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockService,
        error: null,
      });
      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      const result = await removeServiceFromGarment({
        garmentId: 'garment-123',
        garmentServiceId: 'garment-service-123',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('updateGarmentService', () => {
    it.skip('should update service successfully', async () => {
      const mockService = {
        id: 'garment-service-123',
        garment_id: 'garment-123',
        name: 'Hemming',
        quantity: 1,
        unit_price_cents: 1500,
        garments: {
          orders: { shop_id: '550e8400-e29b-41d4-a716-446655440001' },
        },
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockService,
        error: null,
      });
      mockSupabase.eq.mockResolvedValueOnce({ error: null });

      const result = await updateGarmentService({
        garmentServiceId: 'garment-service-123',
        updates: {
          quantity: 2,
          unitPriceCents: 2000,
        },
      });

      expect(result.success).toBe(true);
    });
  });

  describe('getGarmentHistory', () => {
    it('should fetch history successfully', async () => {
      const mockHistory = [
        {
          id: 'history-1',
          garment_id: 'garment-123',
          changed_by: 'user-123',
          field_name: 'name',
          old_value: 'Old Name',
          new_value: 'New Name',
          change_type: 'field_update',
          changed_at: '2024-01-15T10:00:00Z',
        },
      ];

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          orders: { shop_id: '550e8400-e29b-41d4-a716-446655440001' },
        },
        error: null,
      });

      mockSupabase.order.mockResolvedValueOnce({
        data: mockHistory,
        error: null,
      });

      const result = await getGarmentHistory('garment-123');

      expect(result.success).toBe(true);
      expect(result.history).toEqual(mockHistory);
    });
  });
});
