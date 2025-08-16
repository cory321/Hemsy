import {
  updateGarmentStage,
  recalculateAndUpdateGarmentStage,
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
      });

      // First call for services
      let callCount = 0;
      selectMock.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // Services query
          return { eq: () => servicesMock() };
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
});
