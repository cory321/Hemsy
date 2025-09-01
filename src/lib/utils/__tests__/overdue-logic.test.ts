import {
  isGarmentOverdue,
  areAllServicesCompleted,
  getDaysUntilDue,
  getEnhancedDueDateInfo,
  isOrderOverdue,
  getOrderEffectiveDueDate,
  type GarmentOverdueInfo,
  type OrderOverdueInfo,
} from '../overdue-logic';

describe('Overdue Logic', () => {
  // Helper to create dates relative to "today"
  // Adding T00:00:00 ensures the date is interpreted in local timezone
  const getRelativeDate = (daysOffset: number): string => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + daysOffset);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    // Add time component to ensure local timezone parsing
    return `${year}-${month}-${day}T00:00:00`;
  };

  const today = getRelativeDate(0);
  const yesterday = getRelativeDate(-1);
  const tomorrow = getRelativeDate(1);
  const lastWeek = getRelativeDate(-7);
  const threeDaysFromNow = getRelativeDate(3);

  describe('areAllServicesCompleted', () => {
    it('should return true when all active services are completed', () => {
      const garment: GarmentOverdueInfo = {
        garment_services: [
          { id: '1', is_done: true, is_removed: false },
          { id: '2', is_done: true, is_removed: false },
        ],
      };
      expect(areAllServicesCompleted(garment)).toBe(true);
    });

    it('should return false when some services are incomplete', () => {
      const garment: GarmentOverdueInfo = {
        garment_services: [
          { id: '1', is_done: true, is_removed: false },
          { id: '2', is_done: false, is_removed: false },
        ],
      };
      expect(areAllServicesCompleted(garment)).toBe(false);
    });

    it('should ignore soft-deleted services', () => {
      const garment: GarmentOverdueInfo = {
        garment_services: [
          { id: '1', is_done: true, is_removed: false },
          { id: '2', is_done: false, is_removed: true }, // Soft-deleted, should be ignored
        ],
      };
      expect(areAllServicesCompleted(garment)).toBe(true);
    });

    it('should return true when all services are soft-deleted', () => {
      const garment: GarmentOverdueInfo = {
        garment_services: [
          { id: '1', is_done: false, is_removed: true },
          { id: '2', is_done: false, is_removed: true },
        ],
      };
      expect(areAllServicesCompleted(garment)).toBe(true);
    });

    it('should return true when stage is Ready For Pickup', () => {
      const garment: GarmentOverdueInfo = {
        stage: 'Ready For Pickup',
      };
      expect(areAllServicesCompleted(garment)).toBe(true);
    });

    it('should return true when stage is Done', () => {
      const garment: GarmentOverdueInfo = {
        stage: 'Done',
      };
      expect(areAllServicesCompleted(garment)).toBe(true);
    });

    it('should return false when no services and stage is not complete', () => {
      const garment: GarmentOverdueInfo = {
        stage: 'In Progress',
      };
      expect(areAllServicesCompleted(garment)).toBe(false);
    });
  });

  describe('isGarmentOverdue', () => {
    it('should return false when no due date', () => {
      const garment: GarmentOverdueInfo = {
        due_date: null,
      };
      expect(isGarmentOverdue(garment)).toBe(false);
    });

    it('should return true when past due and services incomplete', () => {
      const garment: GarmentOverdueInfo = {
        due_date: yesterday,
        garment_services: [{ id: '1', is_done: false, is_removed: false }],
      };
      expect(isGarmentOverdue(garment)).toBe(true);
    });

    it('should return false when past due but all services completed', () => {
      const garment: GarmentOverdueInfo = {
        due_date: yesterday,
        garment_services: [
          { id: '1', is_done: true, is_removed: false },
          { id: '2', is_done: true, is_removed: false },
        ],
      };
      expect(isGarmentOverdue(garment)).toBe(false);
    });

    it('should return false when due today', () => {
      const garment: GarmentOverdueInfo = {
        due_date: today,
        garment_services: [{ id: '1', is_done: false, is_removed: false }],
      };
      expect(isGarmentOverdue(garment)).toBe(false);
    });

    it('should return false when due in future', () => {
      const garment: GarmentOverdueInfo = {
        due_date: tomorrow,
        garment_services: [{ id: '1', is_done: false, is_removed: false }],
      };
      expect(isGarmentOverdue(garment)).toBe(false);
    });

    it('should consider restored services when calculating overdue', () => {
      const garment: GarmentOverdueInfo = {
        due_date: yesterday,
        garment_services: [
          { id: '1', is_done: true, is_removed: false },
          { id: '2', is_done: false, is_removed: false }, // Restored and incomplete
        ],
      };
      expect(isGarmentOverdue(garment)).toBe(true);
    });
  });

  describe('getDaysUntilDue', () => {
    it('should return null for no due date', () => {
      expect(getDaysUntilDue(null)).toBe(null);
      expect(getDaysUntilDue(undefined)).toBe(null);
    });

    it('should return 0 for today', () => {
      const days = getDaysUntilDue(today);
      expect(days).toBe(0);
    });

    it('should return negative days for past dates', () => {
      const days = getDaysUntilDue(yesterday);
      expect(days).toBeLessThan(0);
    });

    it('should return positive days for future dates', () => {
      const days = getDaysUntilDue(tomorrow);
      expect(days).toBeGreaterThan(0);
    });
  });

  describe('getEnhancedDueDateInfo', () => {
    it('should return null when no due date', () => {
      const garment: GarmentOverdueInfo = { due_date: null };
      expect(getEnhancedDueDateInfo(garment)).toBe(null);
    });

    it('should correctly identify overdue garments with incomplete services', () => {
      const garment: GarmentOverdueInfo = {
        due_date: yesterday,
        garment_services: [{ id: '1', is_done: false, is_removed: false }],
      };
      const info = getEnhancedDueDateInfo(garment);
      expect(info).toMatchObject({
        isPast: true,
        isOverdue: true,
        isToday: false,
        allServicesCompleted: false,
      });
      expect(info?.daysUntilDue).toBeLessThan(0);
    });

    it('should not mark as overdue when past due but all services completed', () => {
      const garment: GarmentOverdueInfo = {
        due_date: yesterday,
        garment_services: [{ id: '1', is_done: true, is_removed: false }],
      };
      const info = getEnhancedDueDateInfo(garment);
      expect(info).toMatchObject({
        isPast: true,
        isOverdue: false, // Not overdue because services are complete
        allServicesCompleted: true,
      });
    });

    it('should correctly identify today as urgent but not overdue', () => {
      const garment: GarmentOverdueInfo = {
        due_date: today,
      };
      const info = getEnhancedDueDateInfo(garment);
      expect(info).toMatchObject({
        isUrgent: true,
        isToday: true,
        isOverdue: false,
      });
    });

    it('should correctly identify tomorrow as urgent', () => {
      const garment: GarmentOverdueInfo = {
        due_date: tomorrow,
      };
      const info = getEnhancedDueDateInfo(garment);
      expect(info).toMatchObject({
        isUrgent: true,
        isTomorrow: true,
      });
    });

    it('should correctly identify dates within 3 days as urgent', () => {
      const garment: GarmentOverdueInfo = {
        due_date: threeDaysFromNow,
      };
      const info = getEnhancedDueDateInfo(garment);
      expect(info?.isUrgent).toBe(true);
      expect(info?.daysUntilDue).toBeGreaterThanOrEqual(1);
      expect(info?.daysUntilDue).toBeLessThanOrEqual(3);
    });
  });

  describe('isOrderOverdue', () => {
    it('should return false when order has no due date and no garments', () => {
      const order: OrderOverdueInfo = {
        order_due_date: null,
        garments: [],
      };
      expect(isOrderOverdue(order)).toBe(false);
    });

    it('should return true when order due date is past and has incomplete garments', () => {
      const order: OrderOverdueInfo = {
        order_due_date: yesterday,
        garments: [
          {
            due_date: tomorrow,
            garment_services: [{ id: '1', is_done: false, is_removed: false }],
          },
        ],
      };
      expect(isOrderOverdue(order)).toBe(true);
    });

    it('should return false when order due date is past but all garments have completed services', () => {
      const order: OrderOverdueInfo = {
        order_due_date: yesterday,
        garments: [
          {
            garment_services: [{ id: '1', is_done: true, is_removed: false }],
          },
          {
            garment_services: [{ id: '2', is_done: true, is_removed: false }],
          },
        ],
      };
      expect(isOrderOverdue(order)).toBe(false);
    });

    it('should check individual garment overdue status when no order due date', () => {
      const order: OrderOverdueInfo = {
        order_due_date: null,
        garments: [
          {
            due_date: tomorrow,
            garment_services: [{ id: '1', is_done: false, is_removed: false }],
          },
          {
            due_date: yesterday,
            garment_services: [{ id: '2', is_done: false, is_removed: false }],
          },
        ],
      };
      expect(isOrderOverdue(order)).toBe(true); // One garment is overdue
    });

    it('should return false when all overdue garments have completed services', () => {
      const order: OrderOverdueInfo = {
        order_due_date: null,
        garments: [
          {
            due_date: yesterday,
            garment_services: [{ id: '1', is_done: true, is_removed: false }],
          },
          {
            due_date: lastWeek,
            stage: 'Ready For Pickup',
          },
        ],
      };
      expect(isOrderOverdue(order)).toBe(false);
    });
  });

  describe('getOrderEffectiveDueDate', () => {
    it('should return order due date when available', () => {
      const order: OrderOverdueInfo = {
        order_due_date: tomorrow,
        garments: [{ due_date: yesterday }, { due_date: today }],
      };
      expect(getOrderEffectiveDueDate(order)).toBe(tomorrow);
    });

    it('should return earliest garment due date when no order due date', () => {
      const order: OrderOverdueInfo = {
        order_due_date: null,
        garments: [
          { due_date: tomorrow },
          { due_date: yesterday },
          { due_date: today },
        ],
      };
      expect(getOrderEffectiveDueDate(order)).toBe(yesterday);
    });

    it('should handle null garment due dates', () => {
      const order: OrderOverdueInfo = {
        order_due_date: null,
        garments: [{ due_date: null }, { due_date: today }, { due_date: null }],
      };
      expect(getOrderEffectiveDueDate(order)).toBe(today);
    });

    it('should return null when no dates available', () => {
      const order: OrderOverdueInfo = {
        order_due_date: null,
        garments: [{ due_date: null }, { due_date: null }],
      };
      expect(getOrderEffectiveDueDate(order)).toBe(null);
    });
  });
});
