import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  generateTimeSlots,
  getAvailableTimeSlots,
  isPastDateTime,
} from '../calendar';

describe('Calendar Utilities', () => {
  describe('generateTimeSlots', () => {
    it('should generate slots up to and including the end hour with minutes', () => {
      // Test generating slots until 10:30pm (22:30)
      const slots = generateTimeSlots(15, 22, 22, 30);

      expect(slots).toContain('22:00');
      expect(slots).toContain('22:15');
      expect(slots).not.toContain('22:30'); // Should not include the exact closing time
      expect(slots).not.toContain('22:45');
    });

    it('should generate slots until 10:30pm when shop hours end at that time', () => {
      // Test a typical evening scenario
      const slots = generateTimeSlots(15, 20, 22, 30);

      expect(slots).toContain('20:00');
      expect(slots).toContain('21:00');
      expect(slots).toContain('21:45');
      expect(slots).toContain('22:00');
      expect(slots).toContain('22:15');
      expect(slots).not.toContain('22:30');
      expect(slots).not.toContain('22:45');
    });

    it('should handle whole hour end times correctly', () => {
      const slots = generateTimeSlots(15, 9, 17, 0);

      expect(slots).toContain('16:45');
      expect(slots).not.toContain('17:00');
    });
  });

  describe('getAvailableTimeSlots', () => {
    it('should allow appointments that end exactly at closing time', () => {
      // Use next Saturday to avoid past date filtering
      const mockDate = new Date();
      const daysUntilSaturday = (6 - mockDate.getDay() + 7) % 7;
      const daysToAdd = daysUntilSaturday === 0 ? 7 : daysUntilSaturday; // Always use next Saturday
      mockDate.setDate(mockDate.getDate() + daysToAdd);
      mockDate.setHours(0, 0, 0, 0);

      const shopHours = [
        {
          day_of_week: 6,
          open_time: '09:00',
          close_time: '22:30',
          is_closed: false,
        },
      ];

      const slots = getAvailableTimeSlots(
        mockDate,
        shopHours,
        [], // No existing appointments
        30, // 30 minute duration
        0 // No buffer
      );

      // Should include 10:00pm slot (ends at 10:30pm, exactly at closing)
      expect(slots).toContain('22:00');

      // Should NOT include 10:15pm slot (would end at 10:45pm, after closing)
      expect(slots).not.toContain('22:15');

      // Should NOT include 10:30pm slot (would end at 11:00pm, after closing)
      expect(slots).not.toContain('22:30');
    });

    it('should respect appointment duration when filtering slots', () => {
      // Use next Saturday to avoid past date filtering
      const mockDate = new Date();
      const daysUntilSaturday = (6 - mockDate.getDay() + 7) % 7;
      const daysToAdd = daysUntilSaturday === 0 ? 7 : daysUntilSaturday; // Always use next Saturday
      mockDate.setDate(mockDate.getDate() + daysToAdd);
      mockDate.setHours(0, 0, 0, 0);

      const shopHours = [
        {
          day_of_week: 6,
          open_time: '09:00',
          close_time: '22:30',
          is_closed: false,
        },
      ];

      // With 60 minute duration
      const slotsLong = getAvailableTimeSlots(
        mockDate,
        shopHours,
        [],
        60, // 60 minute duration
        0
      );

      // 9:30pm slot would end at 10:30pm, exactly at closing - should be allowed
      expect(slotsLong).toContain('21:30');

      // 9:45pm slot would end at 10:45pm, after closing - should NOT be allowed
      expect(slotsLong).not.toContain('21:45');

      // 10:00pm slot would end at 11:00pm, after closing - should NOT be allowed
      expect(slotsLong).not.toContain('22:00');
    });

    it('should filter out past time slots for the current day', () => {
      // Use jest's built-in date mocking
      const mockDate = new Date();
      mockDate.setHours(21, 46, 0, 0);
      jest.useFakeTimers();
      jest.setSystemTime(mockDate);

      const shopHours = [
        {
          day_of_week: mockDate.getDay(),
          open_time: '09:00',
          close_time: '22:30',
          is_closed: false,
        },
      ];

      const slots = getAvailableTimeSlots(mockDate, shopHours, [], 30, 0);

      // Should not include slots before 9:46pm
      expect(slots).not.toContain('21:00');
      expect(slots).not.toContain('21:30');
      expect(slots).not.toContain('21:45');

      // Should include future slots
      expect(slots).toContain('22:00');

      // Restore real timers
      jest.useRealTimers();
    });
  });

  describe('isPastDateTime', () => {
    beforeAll(() => {
      const fixed = new Date();
      fixed.setHours(12, 0, 0, 0); // Stabilize at noon local time
      jest.useFakeTimers();
      jest.setSystemTime(fixed);
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should correctly identify past times', () => {
      const now = new Date();
      const pastDate = new Date(now);
      pastDate.setHours(now.getHours() - 1);

      const pastTimeStr = `${pastDate.getHours().toString().padStart(2, '0')}:00`;
      const futureTimeStr = `${(now.getHours() + 1).toString().padStart(2, '0')}:00`;

      expect(isPastDateTime(now, pastTimeStr)).toBe(true);
      expect(isPastDateTime(now, futureTimeStr)).toBe(false);
    });
  });
});
