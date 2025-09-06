import { toggleServiceCompletion } from '../garment-services';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { revalidatePath } from 'next/cache';
import * as garmentStageHelpers from '../garment-stage-helpers';
import { canModifyGarmentServices } from '../orders-cancellation';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth/user-shop');
jest.mock('next/cache');
jest.mock('../garment-stage-helpers');
jest.mock('../orders-cancellation');

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
};

describe('toggleServiceCompletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (ensureUserAndShop as jest.Mock).mockResolvedValue({
      user: { id: 'test-user-id' },
      shop: { id: 'test-shop-id' },
    });
    (canModifyGarmentServices as jest.Mock).mockResolvedValue(true);
  });

  it('should successfully mark a service as complete and update garment stage to "In Progress"', async () => {
    const mockGarmentServiceId = 'service-123';
    const mockGarmentId = 'garment-456';

    // Mock successful update
    mockSupabase.update.mockReturnValueOnce({
      eq: jest.fn().mockResolvedValueOnce({
        error: null,
      }),
    });

    // Mock fetching service details
    mockSupabase.select.mockReturnValueOnce({
      eq: jest.fn().mockReturnValueOnce({
        single: jest.fn().mockResolvedValueOnce({
          data: { garment_id: mockGarmentId },
          error: null,
        }),
      }),
    });

    // Mock recalculateAndUpdateGarmentStage
    (
      garmentStageHelpers.recalculateAndUpdateGarmentStage as jest.Mock
    ).mockResolvedValueOnce({
      success: true,
      stage: 'In Progress',
    });

    const result = await toggleServiceCompletion({
      garmentServiceId: mockGarmentServiceId,
      isDone: true,
    });

    expect(result).toEqual({
      success: true,
      updatedStage: 'In Progress',
    });

    expect(mockSupabase.from).toHaveBeenCalledWith('garment_services');
    expect(mockSupabase.update).toHaveBeenCalledWith({ is_done: true });
    expect(
      garmentStageHelpers.recalculateAndUpdateGarmentStage
    ).toHaveBeenCalledWith(mockGarmentId);
    expect(revalidatePath).toHaveBeenCalledWith(`/garments/${mockGarmentId}`);
  });

  it('should update garment stage to "Ready For Pickup" when all services are complete', async () => {
    const mockGarmentServiceId = 'service-123';
    const mockGarmentId = 'garment-456';

    // Mock successful update
    mockSupabase.update.mockReturnValueOnce({
      eq: jest.fn().mockResolvedValueOnce({
        error: null,
      }),
    });

    // Mock fetching service details
    mockSupabase.select.mockReturnValueOnce({
      eq: jest.fn().mockReturnValueOnce({
        single: jest.fn().mockResolvedValueOnce({
          data: { garment_id: mockGarmentId },
          error: null,
        }),
      }),
    });

    // Mock recalculateAndUpdateGarmentStage
    (
      garmentStageHelpers.recalculateAndUpdateGarmentStage as jest.Mock
    ).mockResolvedValueOnce({
      success: true,
      stage: 'Ready For Pickup',
    });

    const result = await toggleServiceCompletion({
      garmentServiceId: mockGarmentServiceId,
      isDone: true,
    });

    expect(result).toEqual({
      success: true,
      updatedStage: 'Ready For Pickup',
    });
  });

  it('should update garment stage to "New" when no services are complete', async () => {
    const mockGarmentServiceId = 'service-123';
    const mockGarmentId = 'garment-456';

    // Mock successful update
    mockSupabase.update.mockReturnValueOnce({
      eq: jest.fn().mockResolvedValueOnce({
        error: null,
      }),
    });

    // Mock fetching service details
    mockSupabase.select.mockReturnValueOnce({
      eq: jest.fn().mockReturnValueOnce({
        single: jest.fn().mockResolvedValueOnce({
          data: { garment_id: mockGarmentId },
          error: null,
        }),
      }),
    });

    // Mock recalculateAndUpdateGarmentStage
    (
      garmentStageHelpers.recalculateAndUpdateGarmentStage as jest.Mock
    ).mockResolvedValueOnce({
      success: true,
      stage: 'New',
    });

    const result = await toggleServiceCompletion({
      garmentServiceId: mockGarmentServiceId,
      isDone: false,
    });

    expect(result).toEqual({
      success: true,
      updatedStage: 'New',
    });
  });

  it('should handle service update failure', async () => {
    const mockGarmentServiceId = 'service-123';
    const mockGarmentId = 'garment-456';

    // Mock successful service fetch first
    mockSupabase.select.mockReturnValueOnce({
      eq: jest.fn().mockReturnValueOnce({
        single: jest.fn().mockResolvedValueOnce({
          data: { garment_id: mockGarmentId },
          error: null,
        }),
      }),
    });

    // Mock update failure
    mockSupabase.update.mockReturnValueOnce({
      eq: jest.fn().mockResolvedValueOnce({
        error: { message: 'Update failed' },
      }),
    });

    const result = await toggleServiceCompletion({
      garmentServiceId: mockGarmentServiceId,
      isDone: true,
    });

    expect(result).toEqual({
      success: false,
      error: 'Failed to update service',
    });
  });

  it('should handle garment stage update failure', async () => {
    const mockGarmentServiceId = 'service-123';
    const mockGarmentId = 'garment-456';

    // Mock fetching service details (must come first)
    mockSupabase.select.mockReturnValueOnce({
      eq: jest.fn().mockReturnValueOnce({
        single: jest.fn().mockResolvedValueOnce({
          data: { garment_id: mockGarmentId },
          error: null,
        }),
      }),
    });

    // Mock successful service update
    mockSupabase.update.mockReturnValueOnce({
      eq: jest.fn().mockResolvedValueOnce({
        error: null,
      }),
    });

    // Mock recalculateAndUpdateGarmentStage failure
    (
      garmentStageHelpers.recalculateAndUpdateGarmentStage as jest.Mock
    ).mockResolvedValueOnce({
      success: false,
    });

    const result = await toggleServiceCompletion({
      garmentServiceId: mockGarmentServiceId,
      isDone: true,
    });

    expect(result).toEqual({
      success: false,
      error: 'Failed to update garment stage',
    });
  });

  it('should handle unexpected errors', async () => {
    const mockGarmentServiceId = 'service-123';

    // Mock an unexpected error
    mockSupabase.from.mockImplementationOnce(() => {
      throw new Error('Unexpected error');
    });

    const result = await toggleServiceCompletion({
      garmentServiceId: mockGarmentServiceId,
      isDone: true,
    });

    expect(result).toEqual({
      success: false,
      error: 'An unexpected error occurred',
    });
  });

  it('should prevent service modification for cancelled orders', async () => {
    const mockGarmentServiceId = 'service-123';
    const mockGarmentId = 'garment-456';

    // Mock successful service fetch
    mockSupabase.select.mockReturnValueOnce({
      eq: jest.fn().mockReturnValueOnce({
        single: jest.fn().mockResolvedValueOnce({
          data: { garment_id: mockGarmentId },
          error: null,
        }),
      }),
    });

    // Mock canModifyGarmentServices to return false (cancelled order)
    (canModifyGarmentServices as jest.Mock).mockResolvedValueOnce(false);

    const result = await toggleServiceCompletion({
      garmentServiceId: mockGarmentServiceId,
      isDone: true,
    });

    expect(result).toEqual({
      success: false,
      error: 'Cannot modify services for cancelled orders',
    });

    // Verify that the update was not attempted
    expect(mockSupabase.update).not.toHaveBeenCalled();
  });
});
