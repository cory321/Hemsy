import { confirmAppointment } from './confirmation-tokens';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');

// Minimal mocks for repository methods via query stubs
const chainable = () => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  single: jest.fn(),
});

describe('confirmAppointment (server action)', () => {
  const mockCreateSupabase = createSupabaseClient as jest.MockedFunction<
    typeof createSupabaseClient
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateSupabase.mockResolvedValue({
      from: jest.fn(() => chainable()),
    } as any);
  });

  it('returns error for invalid token format', async () => {
    const result = await confirmAppointment('not-a-64-char-hex');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid/i);
  });
});
