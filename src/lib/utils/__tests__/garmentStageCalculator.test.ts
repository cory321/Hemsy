import {
  calculateGarmentStageClient,
  shouldUpdateStageOptimistically,
} from '../garmentStageCalculator';

describe('garmentStageCalculator', () => {
  describe('calculateGarmentStageClient', () => {
    it('should return "New" for no services', () => {
      const result = calculateGarmentStageClient([]);
      expect(result.stage).toBe('New');
      expect(result.completedCount).toBe(0);
      expect(result.totalCount).toBe(0);
    });

    it('should return "New" for services with none completed', () => {
      const services = [
        { id: '1', is_done: false, is_removed: false },
        { id: '2', is_done: false, is_removed: false },
      ];
      const result = calculateGarmentStageClient(services);
      expect(result.stage).toBe('New');
      expect(result.completedCount).toBe(0);
      expect(result.totalCount).toBe(2);
    });

    it('should return "In Progress" for partially completed services', () => {
      const services = [
        { id: '1', is_done: true, is_removed: false },
        { id: '2', is_done: false, is_removed: false },
        { id: '3', is_done: false, is_removed: false },
      ];
      const result = calculateGarmentStageClient(services);
      expect(result.stage).toBe('In Progress');
      expect(result.completedCount).toBe(1);
      expect(result.totalCount).toBe(3);
    });

    it('should return "Ready For Pickup" for all services completed', () => {
      const services = [
        { id: '1', is_done: true, is_removed: false },
        { id: '2', is_done: true, is_removed: false },
      ];
      const result = calculateGarmentStageClient(services);
      expect(result.stage).toBe('Ready For Pickup');
      expect(result.completedCount).toBe(2);
      expect(result.totalCount).toBe(2);
    });

    it('should ignore removed services', () => {
      const services = [
        { id: '1', is_done: true, is_removed: false },
        { id: '2', is_done: false, is_removed: true }, // removed
        { id: '3', is_done: true, is_removed: false },
      ];
      const result = calculateGarmentStageClient(services);
      expect(result.stage).toBe('Ready For Pickup');
      expect(result.completedCount).toBe(2);
      expect(result.totalCount).toBe(2);
    });

    it('should handle undefined is_done as false', () => {
      const services = [
        { id: '1', is_done: true, is_removed: false },
        { id: '2', is_removed: false }, // is_done is undefined
      ];
      const result = calculateGarmentStageClient(services);
      expect(result.stage).toBe('In Progress');
      expect(result.completedCount).toBe(1);
      expect(result.totalCount).toBe(2);
    });
  });

  describe('shouldUpdateStageOptimistically', () => {
    it('should not update from Done stage', () => {
      expect(shouldUpdateStageOptimistically('Done', 'Ready For Pickup')).toBe(
        false
      );
      expect(shouldUpdateStageOptimistically('Done', 'In Progress')).toBe(
        false
      );
      expect(shouldUpdateStageOptimistically('Done', 'New')).toBe(false);
    });

    it('should not update if stage is the same', () => {
      expect(shouldUpdateStageOptimistically('New', 'New')).toBe(false);
      expect(
        shouldUpdateStageOptimistically('In Progress', 'In Progress')
      ).toBe(false);
      expect(
        shouldUpdateStageOptimistically('Ready For Pickup', 'Ready For Pickup')
      ).toBe(false);
    });

    it('should update if stage is different and not Done', () => {
      expect(shouldUpdateStageOptimistically('New', 'In Progress')).toBe(true);
      expect(
        shouldUpdateStageOptimistically('In Progress', 'Ready For Pickup')
      ).toBe(true);
      expect(
        shouldUpdateStageOptimistically('Ready For Pickup', 'In Progress')
      ).toBe(true);
    });
  });
});
