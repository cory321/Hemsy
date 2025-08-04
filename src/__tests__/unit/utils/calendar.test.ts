import {
  isPastDate,
  canCreateAppointment,
  isShopOpen,
} from '@/lib/utils/calendar';

describe('Calendar Utilities', () => {
  describe('isPastDate', () => {
    it('should return true for dates before today', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isPastDate(yesterday)).toBe(true);
    });

    it('should return false for today', () => {
      const today = new Date();
      expect(isPastDate(today)).toBe(false);
    });

    it('should return false for future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isPastDate(tomorrow)).toBe(false);
    });

    it('should handle different times on the same day correctly', () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      expect(isPastDate(today)).toBe(false);

      const todayMorning = new Date();
      todayMorning.setHours(0, 0, 0, 0);
      expect(isPastDate(todayMorning)).toBe(false);
    });
  });

  describe('canCreateAppointment', () => {
    const mockShopHours = [
      {
        day_of_week: 0, // Sunday
        open_time: null,
        close_time: null,
        is_closed: true,
      },
      {
        day_of_week: 1, // Monday
        open_time: '09:00',
        close_time: '17:00',
        is_closed: false,
      },
      {
        day_of_week: 2, // Tuesday
        open_time: '09:00',
        close_time: '17:00',
        is_closed: false,
      },
      {
        day_of_week: 3, // Wednesday
        open_time: '09:00',
        close_time: '17:00',
        is_closed: false,
      },
      {
        day_of_week: 4, // Thursday
        open_time: '09:00',
        close_time: '17:00',
        is_closed: false,
      },
      {
        day_of_week: 5, // Friday
        open_time: '09:00',
        close_time: '17:00',
        is_closed: false,
      },
      {
        day_of_week: 6, // Saturday
        open_time: '10:00',
        close_time: '14:00',
        is_closed: false,
      },
    ];

    it('should return false for past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(canCreateAppointment(yesterday, mockShopHours)).toBe(false);
    });

    it('should return false for closed days', () => {
      // Find next Sunday
      const nextSunday = new Date();
      while (nextSunday.getDay() !== 0) {
        nextSunday.setDate(nextSunday.getDate() + 1);
      }
      expect(canCreateAppointment(nextSunday, mockShopHours)).toBe(false);
    });

    it('should return true for open days in the future', () => {
      // Find next Monday
      const nextMonday = new Date();
      while (nextMonday.getDay() !== 1) {
        nextMonday.setDate(nextMonday.getDate() + 1);
      }
      expect(canCreateAppointment(nextMonday, mockShopHours)).toBe(true);
    });

    it('should return true for today if shop is open', () => {
      const today = new Date();
      const todayDayOfWeek = today.getDay();

      // Only test if today is not Sunday (closed day)
      if (todayDayOfWeek !== 0) {
        expect(canCreateAppointment(today, mockShopHours)).toBe(true);
      } else {
        expect(canCreateAppointment(today, mockShopHours)).toBe(false);
      }
    });
  });
});
