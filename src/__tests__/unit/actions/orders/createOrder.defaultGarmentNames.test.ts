import { createOrder } from '@/lib/actions/orders';
import { assignDefaultGarmentNames } from '@/lib/utils/order-normalization';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/actions/users', () => ({
  ensureUserAndShop: jest.fn().mockResolvedValue({
    user: { id: 'test-user-id' },
    shop: { id: 'test-shop-id' },
  }),
}));

describe('assignDefaultGarmentNames', () => {
  it('assigns sequential default names when names are missing or blank', () => {
    const input = [
      { name: '', notes: 'n1' },
      { name: '  ' },
      { name: 'Custom Jacket' },
      { name: undefined as unknown as string },
    ];

    const result = assignDefaultGarmentNames(input);

    expect(result.map((g: { name: string }) => g.name)).toEqual([
      'Garment 1',
      'Garment 2',
      'Custom Jacket',
      'Garment 4',
    ]);
  });
});

describe('createOrder with default garment names', () => {
  const supabaseMock = {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn(),
    eq: jest.fn().mockReturnThis(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (createSupabaseClient as jest.Mock).mockResolvedValue(supabaseMock);
  });

  it('fills in blank garment names as Garment 1, Garment 2, ...', async () => {
    // Order insert returns id
    supabaseMock.single
      // orders insert -> id
      .mockResolvedValueOnce({ data: { id: 'order-1' }, error: null })
      // garments[0] insert -> id
      .mockResolvedValueOnce({ data: { id: 'garment-1' }, error: null })
      // garments[1] insert -> id
      .mockResolvedValueOnce({ data: { id: 'garment-2' }, error: null });

    supabaseMock.insert.mockReturnThis();

    const input = {
      clientId: '11111111-1111-1111-1111-111111111111',
      discountCents: 0,
      garments: [
        {
          name: '',
          services: [
            {
              quantity: 1,
              unit: 'item',
              unitPriceCents: 1000,
              inline: { name: 'Hemming', unit: 'item', unitPriceCents: 1000 },
            },
          ],
        },
        {
          name: '  ',
          services: [
            {
              quantity: 2,
              unit: 'hour',
              unitPriceCents: 2000,
              inline: { name: 'Fitting', unit: 'hour', unitPriceCents: 2000 },
            },
          ],
        },
      ],
    };

    const result = await createOrder(input);

    expect(result.success).toBe(true);

    // Verify garments insert received default names
    const garmentInsertCalls = supabaseMock.insert.mock.calls.filter(
      (args: any[]) =>
        args[0] && typeof args[0] === 'object' && 'order_id' in args[0]
    );
    expect(garmentInsertCalls[0][0].name).toBe('Garment 1');
    expect(garmentInsertCalls[1][0].name).toBe('Garment 2');
  });
});
