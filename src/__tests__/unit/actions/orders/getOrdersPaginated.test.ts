import { getOrdersPaginated } from '@/lib/actions/orders';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/actions/users';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/actions/users');

const mockSupabase: any = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  or: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  range: jest.fn(),
};

const mockCreateSupabaseClient = createSupabaseClient as jest.MockedFunction<
  typeof createSupabaseClient
>;
const mockEnsureUserAndShop = ensureUserAndShop as jest.MockedFunction<
  typeof ensureUserAndShop
>;

describe('getOrdersPaginated', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateSupabaseClient.mockResolvedValue(mockSupabase as any);
    mockEnsureUserAndShop.mockResolvedValue({
      user: {
        id: 'user_123',
        clerk_user_id: 'clerk_123',
        email: 'test@example.com',
        role: 'user',
        created_at: null,
        updated_at: null,
        first_name: null,
        last_name: null,
      },
      shop: {
        id: 'shop_123',
        owner_user_id: 'user_123',
        name: 'Test Shop',
        trial_countdown_enabled: null,
        created_at: null,
        updated_at: null,
        buffer_time_minutes: null,
        business_name: null,
        email: null,
        location_type: null,
        mailing_address: null,
        payment_preference: null,
        phone_number: null,
        tax_percent: 0,
        trial_end_date: null,
        working_hours: null,
        onboarding_completed: true,
      },
    });
  });

  it('should return paginated orders for authenticated user', async () => {
    // Mock orders query
    mockSupabase.range.mockResolvedValue({
      data: [
        {
          id: 'order_1',
          shop_id: 'shop_123',
          client_id: 'client_1',
          status: 'pending',
          order_number: 'ORD-001',
          total_cents: 5000,
          created_at: '2024-01-01T00:00:00Z',
          client: {
            id: 'client_1',
            first_name: 'John',
            last_name: 'Doe',
          },
          garments: [{ id: 'garment_1' }, { id: 'garment_2' }],
        },
        {
          id: 'order_2',
          shop_id: 'shop_123',
          client_id: 'client_2',
          status: 'completed',
          order_number: 'ORD-002',
          total_cents: 7500,
          created_at: '2024-01-02T00:00:00Z',
          client: {
            id: 'client_2',
            first_name: 'Jane',
            last_name: 'Smith',
          },
          garments: [{ id: 'garment_3' }],
        },
      ],
      count: 2,
      error: null,
    });

    const result = await getOrdersPaginated(1, 10);

    expect(result).toEqual({
      data: expect.arrayContaining([
        expect.objectContaining({
          id: 'order_1',
          order_number: 'ORD-001',
          client: expect.objectContaining({
            first_name: 'John',
            last_name: 'Doe',
          }),
          garments: expect.arrayContaining([
            expect.objectContaining({ id: 'garment_1' }),
            expect.objectContaining({ id: 'garment_2' }),
          ]),
        }),
        expect.objectContaining({
          id: 'order_2',
          order_number: 'ORD-002',
          client: expect.objectContaining({
            first_name: 'Jane',
            last_name: 'Smith',
          }),
          garments: expect.arrayContaining([
            expect.objectContaining({ id: 'garment_3' }),
          ]),
        }),
      ]),
      count: 2,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });

    // Verify correct query construction
    expect(mockSupabase.from).toHaveBeenCalledWith('orders');
    expect(mockSupabase.select).toHaveBeenCalledWith(
      expect.stringContaining('client:clients(id, first_name, last_name)'),
      { count: 'exact' }
    );
    expect(mockSupabase.eq).toHaveBeenCalledWith('shop_id', 'shop_123');
    expect(mockSupabase.order).toHaveBeenCalledWith('created_at', {
      ascending: false,
    });
    expect(mockSupabase.range).toHaveBeenCalledWith(0, 9);
  });

  it('should apply search filters correctly', async () => {
    mockSupabase.range.mockResolvedValue({
      data: [],
      count: 0,
      error: null,
    });

    await getOrdersPaginated(1, 10, { search: 'ORD-001' });

    expect(mockSupabase.or).toHaveBeenCalledWith(
      'order_number.ilike.%ORD-001%,notes.ilike.%ORD-001%'
    );
  });

  it('should apply status filter correctly', async () => {
    mockSupabase.range.mockResolvedValue({
      data: [],
      count: 0,
      error: null,
    });

    await getOrdersPaginated(1, 10, { status: 'completed' });

    expect(mockSupabase.eq).toHaveBeenCalledWith('status', 'completed');
  });

  it('should not apply status filter when status is "all"', async () => {
    mockSupabase.range.mockResolvedValue({
      data: [],
      count: 0,
      error: null,
    });

    await getOrdersPaginated(1, 10, { status: 'all' });

    // Should only have one eq call for shop_id
    expect(mockSupabase.eq).toHaveBeenCalledTimes(1);
    expect(mockSupabase.eq).toHaveBeenCalledWith('shop_id', 'shop_123');
  });

  it('should apply custom sorting correctly', async () => {
    mockSupabase.range.mockResolvedValue({
      data: [],
      count: 0,
      error: null,
    });

    await getOrdersPaginated(1, 10, {
      sortBy: 'total_cents',
      sortOrder: 'asc',
    });

    expect(mockSupabase.order).toHaveBeenCalledWith('total_cents', {
      ascending: true,
    });
  });

  it('should handle pagination correctly', async () => {
    mockSupabase.range.mockResolvedValue({
      data: [],
      count: 150,
      error: null,
    });

    const result = await getOrdersPaginated(3, 20);

    expect(mockSupabase.range).toHaveBeenCalledWith(40, 59); // Page 3, 20 items per page
    expect(result.totalPages).toBe(8); // 150 items / 20 per page = 8 pages
  });

  it('should throw error if user is not authenticated', async () => {
    mockEnsureUserAndShop.mockRejectedValue(new Error('Unauthorized'));

    await expect(getOrdersPaginated()).rejects.toThrow('Unauthorized');
  });

  it('should throw error if Supabase query fails', async () => {
    mockSupabase.range.mockResolvedValue({
      data: null,
      count: null,
      error: { message: 'Database error' },
    });

    await expect(getOrdersPaginated()).rejects.toThrow(
      'Failed to fetch orders: Database error'
    );
  });

  it('should handle empty results', async () => {
    mockSupabase.range.mockResolvedValue({
      data: [],
      count: 0,
      error: null,
    });

    const result = await getOrdersPaginated(1, 10);

    expect(result).toEqual({
      data: [],
      count: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    });
  });

  it('should trim search term whitespace', async () => {
    mockSupabase.range.mockResolvedValue({
      data: [],
      count: 0,
      error: null,
    });

    await getOrdersPaginated(1, 10, { search: '  ORD-001  ' });

    expect(mockSupabase.or).toHaveBeenCalledWith(
      'order_number.ilike.%ORD-001%,notes.ilike.%ORD-001%'
    );
  });
});
