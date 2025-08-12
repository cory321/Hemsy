import { getGarmentById } from '@/lib/actions/orders';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/actions/users', () => ({
  ensureUserAndShop: jest.fn().mockResolvedValue({
    user: { id: 'test-user-id' },
    shop: { id: 'test-shop-id' },
  }),
}));

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

(createClient as jest.Mock).mockResolvedValue(mockSupabase);

describe('getGarmentById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully fetch a garment with all related data', async () => {
    const mockGarment = {
      id: 'garment-123',
      order_id: 'order-123',
      name: 'Blue Wedding Dress',
      notes: 'Handle with care',
      due_date: '2024-01-25',
      event_date: '2024-02-01',
      stage: 'Sewing',
      photo_url: 'https://example.com/image.jpg',
      created_at: '2024-01-10',
      order: {
        id: 'order-123',
        order_number: '001',
        status: 'in_progress',
        client: {
          id: 'client-123',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
          phone_number: '555-1234',
        },
      },
      garment_services: [
        {
          id: 'service-1',
          name: 'Hemming',
          quantity: 1,
          unit: 'item',
          unit_price_cents: 3500,
          description: 'Standard hemming',
        },
        {
          id: 'service-2',
          name: 'Take in sides',
          quantity: 2,
          unit: 'hour',
          unit_price_cents: 3000,
          description: null,
        },
      ],
    };

    const mockOrderCheck = {
      shop_id: 'test-shop-id',
    };

    // Setup mock responses
    mockSupabase.single
      .mockResolvedValueOnce({ data: mockGarment, error: null })
      .mockResolvedValueOnce({ data: mockOrderCheck, error: null });

    const result = await getGarmentById('garment-123');

    expect(result).toEqual({
      success: true,
      garment: {
        ...mockGarment,
        totalPriceCents: 9500, // 3500 + (2 * 3000)
      },
    });

    // Verify the correct queries were made
    expect(mockSupabase.from).toHaveBeenCalledWith('garments');
    expect(mockSupabase.select).toHaveBeenCalledWith(
      expect.stringContaining('garment_services')
    );
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'garment-123');
  });

  it('should return error when garment is not found', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Garment not found' },
    });

    const result = await getGarmentById('non-existent-id');

    expect(result).toEqual({
      success: false,
      error: 'Garment not found',
    });
  });

  it('should return error when garment belongs to different shop', async () => {
    const mockGarment = {
      id: 'garment-123',
      order_id: 'order-123',
      name: 'Test Garment',
    };

    const mockOrderCheck = {
      shop_id: 'different-shop-id',
    };

    mockSupabase.single
      .mockResolvedValueOnce({ data: mockGarment, error: null })
      .mockResolvedValueOnce({ data: mockOrderCheck, error: null });

    const result = await getGarmentById('garment-123');

    expect(result).toEqual({
      success: false,
      error: 'Garment not found or access denied',
    });
  });

  it('should calculate total price correctly with no services', async () => {
    const mockGarment = {
      id: 'garment-123',
      order_id: 'order-123',
      name: 'Test Garment',
      garment_services: [],
    };

    const mockOrderCheck = {
      shop_id: 'test-shop-id',
    };

    mockSupabase.single
      .mockResolvedValueOnce({ data: mockGarment, error: null })
      .mockResolvedValueOnce({ data: mockOrderCheck, error: null });

    const result = await getGarmentById('garment-123');

    expect(result.success).toBe(true);
    expect(result.garment?.totalPriceCents).toBe(0);
  });
});
