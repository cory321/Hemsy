import { createOrder } from '@/lib/actions/orders';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/actions/users', () => ({
  ensureUserAndShop: jest.fn().mockResolvedValue({
    user: { id: 'test-user-id' },
    shop: { id: 'test-shop-id' },
  }),
}));

describe('createOrder persists garment preset icon and colors', () => {
  const supabaseMock = {
    rpc: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn(),
    eq: jest.fn().mockReturnThis(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (createSupabaseClient as jest.Mock).mockResolvedValue(supabaseMock);

    // generate_order_number
    supabaseMock.rpc.mockResolvedValue({ data: 'ORD-001', error: null });

    // orders insert -> id
    supabaseMock.single
      .mockResolvedValueOnce({ data: { id: 'order-1' }, error: null })
      // garments[0] insert -> id
      .mockResolvedValueOnce({ data: { id: 'garment-1' }, error: null });
  });

  it('passes preset_icon_key and preset colors to garments insert', async () => {
    supabaseMock.insert.mockReturnThis();

    const input = {
      clientId: '11111111-1111-1111-1111-111111111111',
      discountCents: 0,
      notes: 'n',
      garments: [
        {
          name: 'Dress',
          presetIconKey: 'tops.sweater_knit_top',
          presetOutlineColor: '#111111',
          presetFillColor: '#ffccaa',
          services: [
            {
              quantity: 1,
              unit: 'flat_rate',
              unitPriceCents: 1000,
              inline: {
                name: 'Hemming',
                unit: 'flat_rate',
                unitPriceCents: 1000,
              },
            },
          ],
        },
      ],
    };

    const result = await createOrder(input);
    expect(result.success).toBe(true);

    // Find the garments insert payload
    const garmentInsertCall = supabaseMock.insert.mock.calls.find(
      (args: any[]) =>
        args[0] && typeof args[0] === 'object' && 'order_id' in args[0]
    );
    expect(garmentInsertCall).toBeTruthy();
    const payload = garmentInsertCall![0];
    expect(payload.preset_icon_key).toBe('tops.sweater_knit_top');
    expect(payload.preset_fill_color).toBe('#ffccaa');
  });
});
