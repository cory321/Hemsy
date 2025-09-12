import {
  checkGarmentBalanceStatus,
  logDeferredPaymentPickup,
} from '@/lib/actions/garment-balance-check';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { calculateOrderBalance } from '@/lib/utils/order-balance-calculations';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth/user-shop');
jest.mock('@/lib/utils/order-balance-calculations');

const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn(),
};

const mockEnsureUserAndShop = ensureUserAndShop as jest.MockedFunction<
  typeof ensureUserAndShop
>;
const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockCalculateOrderBalance = calculateOrderBalance as jest.MockedFunction<
  typeof calculateOrderBalance
>;

// Valid UUIDs for testing
const GARMENT_ID = '12345678-1234-4123-a123-123456789abc';
const ORDER_ID = '12345678-1234-4123-a123-123456789def';
const SHOP_ID = '12345678-1234-4123-a123-123456789ghi';
const USER_ID = '12345678-1234-4123-a123-123456789jkl';

describe('checkGarmentBalanceStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue(mockSupabase as any);
    mockEnsureUserAndShop.mockResolvedValue({
      user: { id: USER_ID },
      shop: { id: SHOP_ID },
    } as any);
  });

  it('should identify last garment with outstanding balance', async () => {
    const mockGarment = {
      id: GARMENT_ID,
      stage: 'Ready For Pickup',
      order_id: ORDER_ID,
      orders: {
        shop_id: SHOP_ID,
      },
    };

    // Mock the garment query
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'garments') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest
            .fn()
            .mockResolvedValue({ data: mockGarment, error: null }),
        };
      }
      return {};
    });

    // Mock the RPC call to return that this is the last garment
    mockSupabase.rpc.mockResolvedValue({
      data: { isLastGarment: true },
      error: null,
    });

    // Mock the order balance calculation
    mockCalculateOrderBalance.mockResolvedValue({
      success: true,
      balanceDue: 5000,
      orderTotal: 10000,
      paidAmount: 5000,
      paymentStatus: 'partial',
      percentage: 50,
      orderNumber: 'ORD-001',
      clientName: 'John Doe',
    });

    const result = await checkGarmentBalanceStatus({ garmentId: GARMENT_ID });

    expect(result).toEqual({
      success: true,
      isLastGarment: true,
      hasOutstandingBalance: true,
      balanceDue: 5000,
      orderTotal: 10000,
      paidAmount: 5000,
      orderNumber: 'ORD-001',
      clientName: 'John Doe',
    });
  });

  it('should return false for hasOutstandingBalance when balance is zero', async () => {
    const mockGarment = {
      id: GARMENT_ID,
      stage: 'Ready For Pickup',
      order_id: ORDER_ID,
      orders: {
        shop_id: SHOP_ID,
      },
    };

    // Mock the garment query
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'garments') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest
            .fn()
            .mockResolvedValue({ data: mockGarment, error: null }),
        };
      }
      return {};
    });

    // Mock the RPC call to return that this is the last garment
    mockSupabase.rpc.mockResolvedValue({
      data: { isLastGarment: true },
      error: null,
    });

    // Mock the order balance calculation with no balance due
    mockCalculateOrderBalance.mockResolvedValue({
      success: true,
      balanceDue: 0,
      orderTotal: 10000,
      paidAmount: 10000,
      paymentStatus: 'paid',
      percentage: 100,
      orderNumber: 'ORD-001',
      clientName: 'John Doe',
    });

    const result = await checkGarmentBalanceStatus({ garmentId: GARMENT_ID });

    expect(result).toEqual({
      success: true,
      isLastGarment: true,
      hasOutstandingBalance: false,
      balanceDue: 0,
      orderTotal: 10000,
      paidAmount: 10000,
      orderNumber: 'ORD-001',
      clientName: 'John Doe',
    });
  });

  it('should handle validation errors', async () => {
    const result = await checkGarmentBalanceStatus({
      garmentId: 'invalid-uuid',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid uuid');
  });
});

describe('logDeferredPaymentPickup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateClient.mockResolvedValue(mockSupabase as any);
    mockEnsureUserAndShop.mockResolvedValue({
      user: { id: USER_ID },
      shop: { id: SHOP_ID },
    } as any);
  });

  it('should log deferred payment successfully', async () => {
    const mockOrder = { notes: 'Existing notes' };

    // Mock the from method to return different objects for different tables
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'garment_history') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      if (table === 'orders') {
        // Create separate mock objects for select and update chains
        const selectChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: mockOrder, error: null }),
        };
        const updateChain = {
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null }),
        };

        // Return the appropriate chain based on call order
        const callCount = 0;
        return {
          select: jest.fn().mockReturnValue(selectChain),
          update: jest.fn().mockReturnValue(updateChain),
        };
      }
      return {};
    });

    const result = await logDeferredPaymentPickup({
      garmentId: GARMENT_ID,
      orderId: ORDER_ID,
      balanceDue: 5000,
      reason: 'Customer will pay later',
    });

    expect(result).toEqual({ success: true });
  });

  it('should handle validation errors', async () => {
    const result = await logDeferredPaymentPickup({
      garmentId: 'invalid-uuid',
      orderId: 'invalid-uuid',
      balanceDue: 5000,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid uuid');
  });
});
