/**
 * Test to verify the timezone fix is working correctly
 */

import {
  safeParseDateTime,
  safeParseDate,
  isDateTimeInPast,
  formatDateForDatabase,
  formatTimeForDatabase,
} from '@/lib/utils/date-time-utils';

describe('Timezone Fix Verification', () => {
  describe('safeParseDate', () => {
    it('creates consistent dates regardless of input format', () => {
      const dateStr = '2024-01-15';
      const parsed = safeParseDate(dateStr);

      // Should always create January 15, 2024 at midnight
      expect(parsed.getFullYear()).toBe(2024);
      expect(parsed.getMonth()).toBe(0); // January is 0
      expect(parsed.getDate()).toBe(15);
      expect(parsed.getHours()).toBe(0);
      expect(parsed.getMinutes()).toBe(0);
    });

    it('handles edge cases correctly', () => {
      // Leap year
      const leapDate = safeParseDate('2024-02-29');
      expect(leapDate.getDate()).toBe(29);

      // End of year
      const endYear = safeParseDate('2024-12-31');
      expect(endYear.getMonth()).toBe(11); // December
      expect(endYear.getDate()).toBe(31);
    });
  });

  describe('safeParseDateTime', () => {
    it('creates consistent date/times with explicit components', () => {
      const dateStr = '2024-01-15';
      const timeStr = '14:30';
      const parsed = safeParseDateTime(dateStr, timeStr);

      // Should create 2:30 PM on January 15, 2024
      expect(parsed.getFullYear()).toBe(2024);
      expect(parsed.getMonth()).toBe(0);
      expect(parsed.getDate()).toBe(15);
      expect(parsed.getHours()).toBe(14);
      expect(parsed.getMinutes()).toBe(30);
    });

    it('handles midnight correctly', () => {
      const midnight = safeParseDateTime('2024-01-15', '00:00');
      expect(midnight.getHours()).toBe(0);
      expect(midnight.getMinutes()).toBe(0);
    });

    it('handles end of day correctly', () => {
      const endOfDay = safeParseDateTime('2024-01-15', '23:59');
      expect(endOfDay.getHours()).toBe(23);
      expect(endOfDay.getMinutes()).toBe(59);
    });
  });

  describe('isDateTimeInPast', () => {
    it('correctly identifies past times', () => {
      // Create a time definitely in the past
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const pastDate = formatDateForDatabase(yesterday);
      const pastTime = '12:00';

      expect(isDateTimeInPast(pastDate, pastTime)).toBe(true);
    });

    it('correctly identifies future times', () => {
      // Create a time definitely in the future
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = formatDateForDatabase(tomorrow);
      const futureTime = '12:00';

      expect(isDateTimeInPast(futureDate, futureTime)).toBe(false);
    });

    it('handles edge case of current minute', () => {
      // Get current time
      const now = new Date();
      const currentDate = formatDateForDatabase(now);
      const currentTime = formatTimeForDatabase(now);

      // Current time should not be in the past
      const isPast = isDateTimeInPast(currentDate, currentTime);
      expect(isPast).toBe(false);
    });
  });

  describe('Timezone Consistency', () => {
    it('produces same wall-clock time for date components', () => {
      const date1 = safeParseDateTime('2024-01-15', '14:00');
      const date2 = new Date(2024, 0, 15, 14, 0, 0, 0);

      // Should be exactly the same
      expect(date1.getTime()).toBe(date2.getTime());
    });

    it('round-trip formatting preserves date/time', () => {
      const originalDate = '2024-01-15';
      const originalTime = '14:30';

      // Parse
      const parsed = safeParseDateTime(originalDate, originalTime);

      // Format back
      const formattedDate = formatDateForDatabase(parsed);
      const formattedTime = formatTimeForDatabase(parsed);

      // Should match original
      expect(formattedDate).toBe(originalDate);
      expect(formattedTime).toBe(originalTime);
    });
  });

  describe('Real-world Scenarios', () => {
    it('appointment booking scenario', () => {
      // User wants to book appointment for tomorrow at 2 PM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointmentDate = formatDateForDatabase(tomorrow);
      const appointmentTime = '14:00';

      // Should not be in the past
      expect(isDateTimeInPast(appointmentDate, appointmentTime)).toBe(false);
    });

    it('handles appointment at current hour in future', () => {
      // Get current hour
      const now = new Date();
      const currentHour = now.getHours();

      // Create appointment for same hour tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowDate = formatDateForDatabase(tomorrow);
      const timeStr = `${String(currentHour).padStart(2, '0')}:00`;

      // Should not be in the past
      expect(isDateTimeInPast(tomorrowDate, timeStr)).toBe(false);
    });
  });
});
