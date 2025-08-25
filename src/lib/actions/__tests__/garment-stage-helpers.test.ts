import {
  updateGarmentStage,
  recalculateAndUpdateGarmentStage,
  calculateGarmentStage,
} from '../garment-stage-helpers';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/auth/user-shop', () => ({
  ensureUserAndShop: jest.fn().mockResolvedValue({
    user: { id: 'user-123' },
    shop: { id: 'shop-123' },
  }),
}));

describe('Garment Stage Helpers', () => {
  const mockSupabase = {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('updateGarmentStage', () => {
    it('should update stage and track history when stage changes', async () => {
      const garmentId = 'garment-123';
      const newStage = 'In Progress';
      const oldStage = 'New';

      // Mock garment query
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const singleMock = jest.fn().mockResolvedValue({
        data: { stage: oldStage },
        error: null,
      });

      // Mock update query
      const updateMock = jest.fn().mockReturnThis();
      const updateEqMock = jest.fn().mockResolvedValue({ error: null });

      // Mock history insert
      const insertMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'garments') {
          return {
            select: selectMock,
            eq: eqMock,
            single: singleMock,
            update: updateMock,
          };
        } else if (table === 'garment_history') {
          return {
            insert: insertMock,
          };
        }
        return {} as any;
      });

      selectMock.mockReturnValue({ eq: eqMock });
      eqMock.mockReturnValue({ single: singleMock });
      updateMock.mockReturnValue({ eq: updateEqMock });

      const result = await updateGarmentStage(garmentId, newStage);

      expect(result).toBe(true);

      // Verify garment was fetched
      expect(mockSupabase.from).toHaveBeenCalledWith('garments');
      expect(selectMock).toHaveBeenCalledWith('stage');
      expect(eqMock).toHaveBeenCalledWith('id', garmentId);

      // Verify update was called
      expect(updateMock).toHaveBeenCalledWith({ stage: newStage });

      // Verify history was tracked
      expect(mockSupabase.from).toHaveBeenCalledWith('garment_history');
      expect(insertMock).toHaveBeenCalledWith({
        garment_id: garmentId,
        changed_by: 'user-123',
        field_name: 'stage',
        old_value: oldStage,
        new_value: newStage,
        change_type: 'field_update',
      });
    });

    it('should not update or track history when stage is the same', async () => {
      const garmentId = 'garment-123';
      const currentStage = 'In Progress';

      // Mock garment query
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const singleMock = jest.fn().mockResolvedValue({
        data: { stage: currentStage },
        error: null,
      });

      mockSupabase.from.mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }));

      selectMock.mockReturnValue({ eq: eqMock });
      eqMock.mockReturnValue({ single: singleMock });

      const result = await updateGarmentStage(garmentId, currentStage);

      expect(result).toBe(true);

      // Verify no update was called
      expect(mockSupabase.from).toHaveBeenCalledTimes(1); // Only for select
      expect(mockSupabase.from).toHaveBeenCalledWith('garments');
    });

    it('should not update from Done stage', async () => {
      const garmentId = 'garment-123';
      const newStage = 'In Progress';

      // Mock garment query
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const singleMock = jest.fn().mockResolvedValue({
        data: { stage: 'Done' },
        error: null,
      });

      mockSupabase.from.mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }));

      selectMock.mockReturnValue({ eq: eqMock });
      eqMock.mockReturnValue({ single: singleMock });

      const result = await updateGarmentStage(garmentId, newStage);

      expect(result).toBe(true);

      // Verify no update was called
      expect(mockSupabase.from).toHaveBeenCalledTimes(1); // Only for select
    });

    it('should handle fetch errors gracefully', async () => {
      const garmentId = 'garment-123';
      const newStage = 'In Progress';

      // Mock garment query with error
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Not found' },
      });

      mockSupabase.from.mockImplementation(() => ({
        select: selectMock,
        eq: eqMock,
        single: singleMock,
      }));

      selectMock.mockReturnValue({ eq: eqMock });
      eqMock.mockReturnValue({ single: singleMock });

      const result = await updateGarmentStage(garmentId, newStage);

      expect(result).toBe(false);
    });

    it('should continue even if history tracking fails', async () => {
      const garmentId = 'garment-123';
      const newStage = 'In Progress';
      const oldStage = 'New';

      // Mock garment query
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const singleMock = jest.fn().mockResolvedValue({
        data: { stage: oldStage },
        error: null,
      });

      // Mock update query
      const updateMock = jest.fn().mockReturnThis();
      const updateEqMock = jest.fn().mockResolvedValue({ error: null });

      // Mock history insert with error
      const insertMock = jest.fn().mockResolvedValue({
        error: { message: 'History insert failed' },
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'garments') {
          return {
            select: selectMock,
            eq: eqMock,
            single: singleMock,
            update: updateMock,
          };
        } else if (table === 'garment_history') {
          return {
            insert: insertMock,
          };
        }
        return {} as any;
      });

      selectMock.mockReturnValue({ eq: eqMock });
      eqMock.mockReturnValue({ single: singleMock });
      updateMock.mockReturnValue({ eq: updateEqMock });

      // Spy on console.error
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await updateGarmentStage(garmentId, newStage);

      expect(result).toBe(true); // Should still return true
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error tracking stage change in history:',
        { message: 'History insert failed' }
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('recalculateAndUpdateGarmentStage', () => {
    it('should recalculate stage and update with history tracking', async () => {
      const garmentId = 'garment-123';
      const mockServices = [
        { id: 'service-1', is_done: true },
        { id: 'service-2', is_done: false },
      ];

      // Mock services query
      const selectMock = jest.fn().mockReturnThis();
      const eqMock = jest.fn().mockReturnThis();
      const servicesMock = jest.fn().mockResolvedValue({
        data: mockServices,
        error: null,
      });

      // Mock garment query for current stage
      const singleMock = jest.fn().mockResolvedValue({
        data: { stage: 'New' },
        error: null,
      });

      // Mock update query
      const updateMock = jest.fn().mockReturnThis();
      const updateEqMock = jest.fn().mockResolvedValue({ error: null });

      // Mock history insert
      const insertMock = jest.fn().mockResolvedValue({ error: null });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'garment_services') {
          return {
            select: selectMock,
            eq: eqMock,
          };
        } else if (table === 'garments') {
          return {
            select: selectMock,
            eq: eqMock,
            single: singleMock,
            update: updateMock,
          };
        } else if (table === 'garment_history') {
          return {
            insert: insertMock,
          };
        }
        return {} as any;
      });

      // First call for services - needs to handle double .eq() chain
      let callCount = 0;
      selectMock.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Services query: .eq('garment_id', garmentId).eq('is_removed', false)
          return {
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue(servicesMock()),
            }),
          };
        } else {
          // Garment query
          return { eq: eqMock };
        }
      });

      eqMock.mockReturnValue({ single: singleMock });
      updateMock.mockReturnValue({ eq: updateEqMock });

      const result = await recalculateAndUpdateGarmentStage(garmentId);

      expect(result.success).toBe(true);
      expect(result.stage).toBe('In Progress');

      // Verify history was tracked
      expect(insertMock).toHaveBeenCalledWith({
        garment_id: garmentId,
        changed_by: 'user-123',
        field_name: 'stage',
        old_value: 'New',
        new_value: 'In Progress',
        change_type: 'field_update',
      });
    });
  });

  describe('calculateGarmentStage', () => {
    it('should exclude soft-deleted services from stage calculation', async () => {
      const garmentId = 'garment-123';

      // Mock services query - should only return active services due to is_removed filter
      const activeServices = [
        { id: 'service-1', is_done: true },
        { id: 'service-2', is_done: false },
      ];

      const selectMock = jest.fn().mockReturnThis();
      const eqMock1 = jest.fn().mockReturnThis();
      const eqMock2 = jest.fn().mockResolvedValue({
        data: activeServices,
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'garment_services') {
          return {
            select: selectMock,
          };
        }
        return {} as any;
      });

      selectMock.mockReturnValue({ eq: eqMock1 });
      eqMock1.mockReturnValue({ eq: eqMock2 });

      const result = await calculateGarmentStage(garmentId);

      expect(result).not.toBeNull();
      expect(result!.stage).toBe('In Progress'); // 1 completed out of 2 active services
      expect(result!.completedCount).toBe(1);
      expect(result!.totalCount).toBe(2); // Only active services counted

      // Verify the query filters out soft-deleted services
      expect(mockSupabase.from).toHaveBeenCalledWith('garment_services');
      expect(selectMock).toHaveBeenCalledWith('id, is_done');
      expect(eqMock1).toHaveBeenCalledWith('garment_id', garmentId);
      expect(eqMock2).toHaveBeenCalledWith('is_removed', false);
    });

    it('should return "Ready For Pickup" when all active services are completed', async () => {
      const garmentId = 'garment-123';
      const mockServices = [
        { id: 'service-1', is_done: true },
        { id: 'service-2', is_done: true },
      ];

      const selectMock = jest.fn().mockReturnThis();
      const eqMock1 = jest.fn().mockReturnThis();
      const eqMock2 = jest.fn().mockResolvedValue({
        data: mockServices,
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'garment_services') {
          return {
            select: selectMock,
          };
        }
        return {} as any;
      });

      selectMock.mockReturnValue({ eq: eqMock1 });
      eqMock1.mockReturnValue({ eq: eqMock2 });

      const result = await calculateGarmentStage(garmentId);

      expect(result).not.toBeNull();
      expect(result!.stage).toBe('Ready For Pickup');
      expect(result!.completedCount).toBe(2);
      expect(result!.totalCount).toBe(2);
    });

    it('should return "New" when no active services exist', async () => {
      const garmentId = 'garment-123';

      const selectMock = jest.fn().mockReturnThis();
      const eqMock1 = jest.fn().mockReturnThis();
      const eqMock2 = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'garment_services') {
          return {
            select: selectMock,
          };
        }
        return {} as any;
      });

      selectMock.mockReturnValue({ eq: eqMock1 });
      eqMock1.mockReturnValue({ eq: eqMock2 });

      const result = await calculateGarmentStage(garmentId);

      expect(result).not.toBeNull();
      expect(result!.stage).toBe('New');
      expect(result!.completedCount).toBe(0);
      expect(result!.totalCount).toBe(0);
    });
  });
});
