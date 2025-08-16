import { toggleServiceCompletion } from '../garment-services';
import { createClient } from '@/lib/supabase/server';
import { ensureUserAndShop } from '@/lib/auth/user-shop';
import { revalidatePath } from 'next/cache';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth/user-shop');
jest.mock('next/cache');

const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

describe('toggleServiceCompletion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    (ensureUserAndShop as jest.Mock).mockResolvedValue(undefined);
  });

  it('should successfully mark a service as complete and update garment stage to "In Progress"', async () => {
    const mockGarmentServiceId = 'service-123';
    const mockGarmentId = 'garment-456';

    // Mock successful update
    mockSupabase.eq.mockReturnValueOnce({
      error: null,
    });

    // Mock fetching service details
    mockSupabase.single.mockResolvedValueOnce({
      data: { garment_id: mockGarmentId },
      error: null,
    });

    // Mock fetching all services for the garment
    mockSupabase.select.mockReturnValueOnce({
      data: [
        { id: 'service-123', is_done: true },
        { id: 'service-456', is_done: false },
        { id: 'service-789', is_done: false },
      ],
      error: null,
    });

    // Mock updating garment stage
    mockSupabase.eq.mockReturnValueOnce({
      error: null,
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
    expect(mockSupabase.from).toHaveBeenCalledWith('garments');
    expect(mockSupabase.update).toHaveBeenCalledWith({ stage: 'In Progress' });
    expect(revalidatePath).toHaveBeenCalledWith(`/garments/${mockGarmentId}`);
  });

  it('should update garment stage to "Ready For Pickup" when all services are complete', async () => {
    const mockGarmentServiceId = 'service-123';
    const mockGarmentId = 'garment-456';

    // Mock successful update
    mockSupabase.eq.mockReturnValueOnce({
      error: null,
    });

    // Mock fetching service details
    mockSupabase.single.mockResolvedValueOnce({
      data: { garment_id: mockGarmentId },
      error: null,
    });

    // Mock fetching all services (all marked as done)
    mockSupabase.select.mockReturnValueOnce({
      data: [
        { id: 'service-123', is_done: true },
        { id: 'service-456', is_done: true },
        { id: 'service-789', is_done: true },
      ],
      error: null,
    });

    // Mock updating garment stage
    mockSupabase.eq.mockReturnValueOnce({
      error: null,
    });

    const result = await toggleServiceCompletion({
      garmentServiceId: mockGarmentServiceId,
      isDone: true,
    });

    expect(result).toEqual({
      success: true,
      updatedStage: 'Ready For Pickup',
    });

    expect(mockSupabase.update).toHaveBeenCalledWith({
      stage: 'Ready For Pickup',
    });
  });

  it('should update garment stage to "New" when no services are complete', async () => {
    const mockGarmentServiceId = 'service-123';
    const mockGarmentId = 'garment-456';

    // Mock successful update
    mockSupabase.eq.mockReturnValueOnce({
      error: null,
    });

    // Mock fetching service details
    mockSupabase.single.mockResolvedValueOnce({
      data: { garment_id: mockGarmentId },
      error: null,
    });

    // Mock fetching all services (none marked as done)
    mockSupabase.select.mockReturnValueOnce({
      data: [
        { id: 'service-123', is_done: false },
        { id: 'service-456', is_done: false },
        { id: 'service-789', is_done: false },
      ],
      error: null,
    });

    // Mock updating garment stage
    mockSupabase.eq.mockReturnValueOnce({
      error: null,
    });

    const result = await toggleServiceCompletion({
      garmentServiceId: mockGarmentServiceId,
      isDone: false,
    });

    expect(result).toEqual({
      success: true,
      updatedStage: 'New',
    });

    expect(mockSupabase.update).toHaveBeenCalledWith({ stage: 'New' });
  });

  it('should handle service update failure', async () => {
    const mockGarmentServiceId = 'service-123';

    // Mock failed update
    mockSupabase.eq.mockReturnValueOnce({
      error: { message: 'Update failed' },
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

    // Mock successful service update
    mockSupabase.eq.mockReturnValueOnce({
      error: null,
    });

    // Mock fetching service details
    mockSupabase.single.mockResolvedValueOnce({
      data: { garment_id: mockGarmentId },
      error: null,
    });

    // Mock fetching all services
    mockSupabase.select.mockReturnValueOnce({
      data: [{ id: 'service-123', is_done: true }],
      error: null,
    });

    // Mock failed garment update
    mockSupabase.eq.mockReturnValueOnce({
      error: { message: 'Garment update failed' },
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
    (createClient as jest.Mock).mockRejectedValue(
      new Error('Unexpected error')
    );

    const result = await toggleServiceCompletion({
      garmentServiceId: mockGarmentServiceId,
      isDone: true,
    });

    expect(result).toEqual({
      success: false,
      error: 'An unexpected error occurred',
    });
  });
});
