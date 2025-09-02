import { parseDateTimeString } from '@/lib/utils/date-time-utils';

describe('Date/Time Validation Edge Cases', () => {
  describe('parseDateTimeString', () => {
    it('should create dates consistently regardless of timezone', () => {
      const date = '2024-01-15';
      const time = '14:30';

      // Parse the date/time
      const result = parseDateTimeString(date, time);

      // Verify the components are correct
      expect(result.getFullYear()).toBe(2024);
      expect(result.getMonth()).toBe(0); // January (0-indexed)
      expect(result.getDate()).toBe(15);
      expect(result.getHours()).toBe(14);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should handle edge cases like midnight and end of day', () => {
      // Midnight
      const midnight = parseDateTimeString('2024-01-15', '00:00');
      expect(midnight.getHours()).toBe(0);
      expect(midnight.getMinutes()).toBe(0);

      // End of day
      const endOfDay = parseDateTimeString('2024-01-15', '23:59');
      expect(endOfDay.getHours()).toBe(23);
      expect(endOfDay.getMinutes()).toBe(59);
    });

    it('should handle month boundaries correctly', () => {
      // End of January
      const endJan = parseDateTimeString('2024-01-31', '23:59');
      expect(endJan.getMonth()).toBe(0);
      expect(endJan.getDate()).toBe(31);

      // Beginning of February
      const startFeb = parseDateTimeString('2024-02-01', '00:00');
      expect(startFeb.getMonth()).toBe(1);
      expect(startFeb.getDate()).toBe(1);
    });

    it('should handle leap years correctly', () => {
      // Feb 29 in leap year
      const leapDay = parseDateTimeString('2024-02-29', '12:00');
      expect(leapDay.getMonth()).toBe(1);
      expect(leapDay.getDate()).toBe(29);
    });

    it('should maintain local timezone consistency', () => {
      const date = '2024-06-15'; // Summer date
      const time = '15:30';

      const parsed = parseDateTimeString(date, time);

      // The parsed date should be in local timezone
      // not affected by UTC conversion
      const localHours = parsed.getHours();
      expect(localHours).toBe(15);
    });
  });

  describe('Appointment validation scenarios', () => {
    it('should correctly identify past appointments', () => {
      // Set a reference time for comparison
      const referenceDate = new Date(2024, 0, 15, 14, 0, 0, 0); // Jan 15, 2024, 14:00

      // 1 hour in the past
      const pastTime = parseDateTimeString('2024-01-15', '13:00');
      expect(pastTime.getTime()).toBeLessThan(referenceDate.getTime());

      // Yesterday
      const yesterday = parseDateTimeString('2024-01-14', '14:00');
      expect(yesterday.getTime()).toBeLessThan(referenceDate.getTime());
    });

    it('should correctly identify future appointments', () => {
      // Set a reference time for comparison
      const referenceDate = new Date(2024, 0, 15, 14, 0, 0, 0); // Jan 15, 2024, 14:00

      // 1 hour in the future
      const futureTime = parseDateTimeString('2024-01-15', '15:00');
      expect(futureTime.getTime()).toBeGreaterThan(referenceDate.getTime());

      // Tomorrow
      const tomorrow = parseDateTimeString('2024-01-16', '14:00');
      expect(tomorrow.getTime()).toBeGreaterThan(referenceDate.getTime());
    });

    it('should handle "now" edge case correctly', () => {
      // Set a reference time for comparison
      const referenceDate = new Date(2024, 0, 15, 14, 0, 0, 0); // Jan 15, 2024, 14:00

      // Same time
      const sameTime = parseDateTimeString('2024-01-15', '14:00');
      expect(sameTime.getTime()).toBe(referenceDate.getTime());
    });
  });

  describe('Integration with createAppointment validation', () => {
    it('should handle timezone differences between client and server', () => {
      // Simulate a scenario where client sends a date/time
      const clientDate = '2024-01-15';
      const clientTime = '14:30';

      // Parse using our function
      const parsedDateTime = parseDateTimeString(clientDate, clientTime);

      // Even if the server is in a different timezone,
      // the parsed date should represent 14:30 in the local timezone
      expect(parsedDateTime.getHours()).toBe(14);
      expect(parsedDateTime.getMinutes()).toBe(30);

      // The string representation should be consistent
      const isoString = parsedDateTime.toISOString();

      // Re-parsing the same date/time should give the same result
      const reparsed = parseDateTimeString(clientDate, clientTime);
      expect(reparsed.getTime()).toBe(parsedDateTime.getTime());
    });
  });
});
