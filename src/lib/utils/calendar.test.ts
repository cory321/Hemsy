import {
  generateMonthDays,
  generateWeekDays,
  formatTime,
  to12HourFormat,
  to24HourFormat,
  generateTimeSlots,
  timeRangesOverlap,
  addMinutesToTime,
  getDurationMinutes,
  formatDuration,
  getAppointmentColor,
  getDayName,
  isShopOpen,
  getAvailableTimeSlots,
} from './calendar';

describe('Calendar Utilities', () => {
  describe('generateMonthDays', () => {
    it('should generate all days for a month including padding', () => {
      const date = new Date('2024-02-15'); // February 2024
      const days = generateMonthDays(date);

      // February 2024 starts on Thursday and ends on Thursday
      // So we need Sun-Wed from January and Fri-Sat from March
      expect(days.length).toBeGreaterThan(28); // February has 29 days in 2024 (leap year)
      expect(days[0]?.getDate()).toBe(28); // Jan 28 (Sunday)
      expect(days[days.length - 1]?.getDate()).toBe(2); // March 2 (Saturday)
    });
  });

  describe('generateWeekDays', () => {
    it('should generate 7 days starting from Sunday', () => {
      const date = new Date('2024-02-15'); // Thursday
      const days = generateWeekDays(date);

      expect(days).toHaveLength(7);
      expect(days[0]?.getDay()).toBe(0); // Sunday
      expect(days[6]?.getDay()).toBe(6); // Saturday
    });
  });

  describe('formatTime', () => {
    it('should format 24-hour time to 12-hour format', () => {
      expect(formatTime('09:00')).toBe('9:00 AM');
      expect(formatTime('13:30')).toBe('1:30 PM');
      expect(formatTime('00:00')).toBe('12:00 AM');
      expect(formatTime('12:00')).toBe('12:00 PM');
    });
  });

  describe('to12HourFormat', () => {
    it('should convert 24-hour to 12-hour format', () => {
      expect(to12HourFormat('09:00')).toBe('9:00 AM');
      expect(to12HourFormat('13:30')).toBe('1:30 PM');
      expect(to12HourFormat('00:00')).toBe('12:00 AM');
      expect(to12HourFormat('12:00')).toBe('12:00 PM');
      expect(to12HourFormat('23:59')).toBe('11:59 PM');
    });
  });

  describe('to24HourFormat', () => {
    it('should convert 12-hour to 24-hour format', () => {
      expect(to24HourFormat('9:00 AM')).toBe('09:00');
      expect(to24HourFormat('1:30 PM')).toBe('13:30');
      expect(to24HourFormat('12:00 AM')).toBe('00:00');
      expect(to24HourFormat('12:00 PM')).toBe('12:00');
      expect(to24HourFormat('11:59 PM')).toBe('23:59');
    });
  });

  describe('generateTimeSlots', () => {
    it('should generate time slots with specified interval', () => {
      const slots = generateTimeSlots(30, 9, 11);
      expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30']);
    });

    it('should generate 15-minute intervals by default', () => {
      const slots = generateTimeSlots(15, 9, 10);
      expect(slots).toEqual(['09:00', '09:15', '09:30', '09:45']);
    });
  });

  describe('timeRangesOverlap', () => {
    it('should detect overlapping time ranges', () => {
      expect(timeRangesOverlap('09:00', '10:00', '09:30', '10:30')).toBe(true);
      expect(timeRangesOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false);
      expect(timeRangesOverlap('10:00', '11:00', '09:00', '10:00')).toBe(false);
      expect(timeRangesOverlap('09:00', '11:00', '10:00', '10:30')).toBe(true);
    });
  });

  describe('addMinutesToTime', () => {
    it('should add minutes to time correctly', () => {
      expect(addMinutesToTime('09:00', 30)).toBe('09:30');
      expect(addMinutesToTime('09:45', 30)).toBe('10:15');
      expect(addMinutesToTime('23:30', 45)).toBe('00:15');
      expect(addMinutesToTime('10:00', -30)).toBe('09:30');
    });
  });

  describe('getDurationMinutes', () => {
    it('should calculate duration between two times', () => {
      expect(getDurationMinutes('09:00', '10:00')).toBe(60);
      expect(getDurationMinutes('09:00', '09:30')).toBe(30);
      expect(getDurationMinutes('09:00', '11:30')).toBe(150);
    });
  });

  describe('formatDuration', () => {
    it('should format duration in human-readable format', () => {
      expect(formatDuration(30)).toBe('30 min');
      expect(formatDuration(60)).toBe('1 hour');
      expect(formatDuration(90)).toBe('1h 30min');
      expect(formatDuration(120)).toBe('2 hours');
      expect(formatDuration(135)).toBe('2h 15min');
    });
  });

  describe('getAppointmentColor', () => {
    it('should return correct color for appointment type', () => {
      expect(getAppointmentColor('consultation')).toBe('#A08DA9');
      expect(getAppointmentColor('fitting')).toBe('#8da88e');
      expect(getAppointmentColor('pickup')).toBe('#994D65');
      expect(getAppointmentColor('delivery')).toBe('#E1A98F');
      expect(getAppointmentColor('other')).toBe('#7c99ad');
      expect(getAppointmentColor('unknown')).toBe('#7c99ad');
    });
  });

  describe('getDayName', () => {
    it('should return correct day name', () => {
      expect(getDayName(0)).toBe('Sunday');
      expect(getDayName(1)).toBe('Monday');
      expect(getDayName(6)).toBe('Saturday');
      expect(getDayName(7)).toBe('');
    });
  });

  describe('isShopOpen', () => {
    const shopHours = [
      { day_of_week: 0, open_time: null, close_time: null, is_closed: true },
      {
        day_of_week: 1,
        open_time: '09:00',
        close_time: '17:00',
        is_closed: false,
      },
    ];

    it('should check if shop is open on a specific date', () => {
      const sunday = new Date(2024, 1, 11); // Sunday
      const monday = new Date(2024, 1, 12); // Monday

      expect(isShopOpen(sunday, shopHours)).toBe(false);
      expect(isShopOpen(monday, shopHours)).toBe(true);
    });

    it('should return true if no hours defined for day', () => {
      const tuesday = new Date(2024, 1, 13);
      expect(isShopOpen(tuesday, shopHours)).toBe(true);
    });
  });

  describe('getAvailableTimeSlots', () => {
    const shopHours = [
      {
        day_of_week: 1,
        open_time: '09:00',
        close_time: '17:00',
        is_closed: false,
      },
    ];

    const existingAppointments = [
      { start_time: '10:00', end_time: '11:00' },
      { start_time: '14:00', end_time: '15:00' },
    ];

    it('should return available time slots', () => {
      const monday = new Date(2024, 1, 12);
      const slots = getAvailableTimeSlots(
        monday,
        shopHours,
        existingAppointments,
        30,
        0
      );

      expect(slots).toContain('09:00');
      expect(slots).toContain('09:30');
      expect(slots).not.toContain('10:00'); // Blocked by appointment
      expect(slots).not.toContain('10:30'); // Would overlap
      expect(slots).toContain('11:00'); // Available after appointment
    });

    it('should respect buffer time', () => {
      const monday = new Date(2024, 1, 12);
      const slots = getAvailableTimeSlots(
        monday,
        shopHours,
        existingAppointments,
        30,
        15
      );

      expect(slots).not.toContain('09:45'); // Too close to 10:00 appointment with 15min buffer
      expect(slots).not.toContain('11:00'); // Too close to end of 11:00 appointment with buffer
      expect(slots).toContain('11:15'); // Available with buffer
    });

    it('should not include slots that exceed closing time', () => {
      const monday = new Date(2024, 1, 12);
      const slots = getAvailableTimeSlots(monday, shopHours, [], 60, 0);

      expect(slots).not.toContain('16:30'); // Would end at 17:30, after closing
      expect(slots).toContain('16:00'); // Ends exactly at closing time
    });

    it('should return empty array for closed days', () => {
      const sunday = new Date(2024, 1, 11);
      const sundayHours = [
        { day_of_week: 0, open_time: null, close_time: null, is_closed: true },
      ];

      const slots = getAvailableTimeSlots(sunday, sundayHours, [], 30, 0);
      expect(slots).toEqual([]);
    });
  });
});
