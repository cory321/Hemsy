import {
  getStagePriorityScore,
  compareGarmentsByStageAndProgress,
  sortGarmentsByPriority,
} from '@/lib/utils/garment-priority';
import type { GarmentStage } from '@/types';

type TestGarment = {
  id: number;
  due_date?: string | null;
  stage: GarmentStage;
  progress?: number;
  garment_services?: Array<{
    id: string;
    is_done?: boolean | null;
    is_removed?: boolean | null;
  }> | null;
};

describe('Garment Priority Utils', () => {
  describe('getStagePriorityScore', () => {
    it('should return correct priority scores for each stage', () => {
      expect(getStagePriorityScore('Ready For Pickup')).toBe(3);
      expect(getStagePriorityScore('In Progress')).toBe(2);
      expect(getStagePriorityScore('New')).toBe(1);
      expect(getStagePriorityScore('Done')).toBe(-1); // Done should be filtered out
    });
  });

  describe('compareGarmentsByStageAndProgress', () => {
    it('should prioritize Ready For Pickup over other stages', () => {
      const garmentA = { stage: 'Ready For Pickup' as GarmentStage };
      const garmentB = { stage: 'In Progress' as GarmentStage };

      expect(
        compareGarmentsByStageAndProgress(garmentA, garmentB)
      ).toBeLessThan(0);
      expect(
        compareGarmentsByStageAndProgress(garmentB, garmentA)
      ).toBeGreaterThan(0);
    });

    it('should prioritize In Progress over New', () => {
      const garmentA = { stage: 'In Progress' as GarmentStage };
      const garmentB = { stage: 'New' as GarmentStage };

      expect(
        compareGarmentsByStageAndProgress(garmentA, garmentB)
      ).toBeLessThan(0);
      expect(
        compareGarmentsByStageAndProgress(garmentB, garmentA)
      ).toBeGreaterThan(0);
    });

    it('should prioritize by progress when both are In Progress', () => {
      const garmentA = { stage: 'In Progress' as GarmentStage, progress: 75 };
      const garmentB = { stage: 'In Progress' as GarmentStage, progress: 25 };

      expect(
        compareGarmentsByStageAndProgress(garmentA, garmentB)
      ).toBeLessThan(0);
      expect(
        compareGarmentsByStageAndProgress(garmentB, garmentA)
      ).toBeGreaterThan(0);
    });

    it('should return 0 for same stage and progress', () => {
      const garmentA = { stage: 'In Progress' as GarmentStage, progress: 50 };
      const garmentB = { stage: 'In Progress' as GarmentStage, progress: 50 };

      expect(compareGarmentsByStageAndProgress(garmentA, garmentB)).toBe(0);
    });
  });

  describe('sortGarmentsByPriority', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const formatDate = (date: Date): string =>
      date.toISOString().split('T')[0]!;

    it('should prioritize overdue garments', () => {
      const garments: TestGarment[] = [
        { id: 1, due_date: formatDate(tomorrow), stage: 'New' as GarmentStage },
        {
          id: 2,
          due_date: formatDate(yesterday),
          stage: 'New' as GarmentStage,
        },
        { id: 3, due_date: formatDate(today), stage: 'New' as GarmentStage },
      ];

      const sorted = sortGarmentsByPriority(garments);

      expect(sorted[0]!.id).toBe(2); // Yesterday (overdue)
      expect(sorted[1]!.id).toBe(3); // Today
      expect(sorted[2]!.id).toBe(1); // Tomorrow
    });

    it('should prioritize by stage when due dates are the same', () => {
      const garments: TestGarment[] = [
        { id: 1, due_date: formatDate(today), stage: 'New' as GarmentStage },
        {
          id: 2,
          due_date: formatDate(today),
          stage: 'Ready For Pickup' as GarmentStage,
        },
        {
          id: 3,
          due_date: formatDate(today),
          stage: 'In Progress' as GarmentStage,
        },
      ];

      const sorted = sortGarmentsByPriority(garments);

      expect(sorted[0]!.id).toBe(2); // Ready For Pickup
      expect(sorted[1]!.id).toBe(3); // In Progress
      expect(sorted[2]!.id).toBe(1); // New
    });

    it('should prioritize by progress when stage and due date are the same', () => {
      const garments: TestGarment[] = [
        {
          id: 1,
          due_date: formatDate(today),
          stage: 'In Progress' as GarmentStage,
          progress: 25,
        },
        {
          id: 2,
          due_date: formatDate(today),
          stage: 'In Progress' as GarmentStage,
          progress: 75,
        },
        {
          id: 3,
          due_date: formatDate(today),
          stage: 'In Progress' as GarmentStage,
          progress: 50,
        },
      ];

      const sorted = sortGarmentsByPriority(garments);

      expect(sorted[0]!.id).toBe(2); // 75% progress
      expect(sorted[1]!.id).toBe(3); // 50% progress
      expect(sorted[2]!.id).toBe(1); // 25% progress
    });

    it('should handle garments without due dates', () => {
      const garments: TestGarment[] = [
        { id: 1, due_date: null, stage: 'New' as GarmentStage },
        { id: 2, due_date: formatDate(today), stage: 'New' as GarmentStage },
        { id: 3, due_date: null, stage: 'Ready For Pickup' as GarmentStage },
      ];

      const sorted = sortGarmentsByPriority(garments);

      expect(sorted[0]!.id).toBe(2); // Has due date
      expect(sorted[1]!.id).toBe(3); // No due date but Ready For Pickup
      expect(sorted[2]!.id).toBe(1); // No due date and New
    });

    it('should handle complex priority scenarios', () => {
      const garments: TestGarment[] = [
        { id: 1, due_date: formatDate(tomorrow), stage: 'New' as GarmentStage },
        {
          id: 2,
          due_date: formatDate(yesterday),
          stage: 'In Progress' as GarmentStage,
          progress: 50,
        },
        {
          id: 3,
          due_date: formatDate(today),
          stage: 'Ready For Pickup' as GarmentStage,
        },
        {
          id: 4,
          due_date: formatDate(today),
          stage: 'In Progress' as GarmentStage,
          progress: 75,
        },
        {
          id: 5,
          due_date: formatDate(yesterday),
          stage: 'Ready For Pickup' as GarmentStage,
        },
        {
          id: 6,
          due_date: null,
          stage: 'In Progress' as GarmentStage,
          progress: 90,
        },
      ];

      const sorted = sortGarmentsByPriority(garments);

      // Expected order:
      // 1. Overdue + Ready For Pickup (id: 5)
      // 2. Overdue + In Progress (id: 2)
      // 3. Today + Ready For Pickup (id: 3)
      // 4. Today + In Progress 75% (id: 4)
      // 5. Tomorrow + New (id: 1)
      // 6. No date + In Progress 90% (id: 6)

      expect(sorted[0]!.id).toBe(5);
      expect(sorted[1]!.id).toBe(2);
      expect(sorted[2]!.id).toBe(3);
      expect(sorted[3]!.id).toBe(4);
      expect(sorted[4]!.id).toBe(1);
      expect(sorted[5]!.id).toBe(6);
    });

    it('should sort multiple overdue items by how overdue they are', () => {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      const garments: TestGarment[] = [
        {
          id: 1,
          due_date: formatDate(yesterday),
          stage: 'New' as GarmentStage,
        },
        { id: 2, due_date: formatDate(weekAgo), stage: 'New' as GarmentStage },
        { id: 3, due_date: formatDate(today), stage: 'New' as GarmentStage },
      ];

      const sorted = sortGarmentsByPriority(garments);

      expect(sorted[0]!.id).toBe(2); // Week ago (most overdue)
      expect(sorted[1]!.id).toBe(1); // Yesterday
      expect(sorted[2]!.id).toBe(3); // Today (not overdue)
    });

    it('should handle the same overdue date with different stages', () => {
      const garments: TestGarment[] = [
        {
          id: 1,
          due_date: formatDate(yesterday),
          stage: 'New' as GarmentStage,
        },
        {
          id: 2,
          due_date: formatDate(yesterday),
          stage: 'Ready For Pickup' as GarmentStage,
        },
        {
          id: 3,
          due_date: formatDate(yesterday),
          stage: 'In Progress' as GarmentStage,
          progress: 80,
        },
        {
          id: 4,
          due_date: formatDate(yesterday),
          stage: 'In Progress' as GarmentStage,
          progress: 20,
        },
      ];

      const sorted = sortGarmentsByPriority(garments);

      expect(sorted[0]!.id).toBe(2); // Ready For Pickup
      expect(sorted[1]!.id).toBe(3); // In Progress 80%
      expect(sorted[2]!.id).toBe(4); // In Progress 20%
      expect(sorted[3]!.id).toBe(1); // New
    });
  });
});
