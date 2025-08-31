import {
  formatDateToYYYYMMDD,
  parseDateString,
  getTodayString,
  getCurrentTimeString,
  getCurrentTimeWithSeconds,
  normalizeTimeToHHMM,
  formatTimeHHMM,
  parseTimeString,
  isDateToday,
  isDateInFuture,
  isDateInPast,
  isTimeInRange,
  isTimePast,
  isTimeFuture,
  isAppointmentHappeningNow,
  isAppointmentPast,
  isAppointmentFuture,
  getAppointmentStatus,
  addMinutesToTime,
  getTimeDifferenceInMinutes,
  isDateInRange,
  getDateRange,
  formatDateDisplay,
  formatDateShort,
  formatTime12Hour,
  formatTimeRange,
  getDueDateInfo,
} from '../date-time-utils';

describe('Date Formatting Utilities', () => {
  describe('formatDateToYYYYMMDD', () => {
    it('formats date correctly', () => {
      const date = new Date(2025, 7, 31); // August 31, 2025
      expect(formatDateToYYYYMMDD(date)).toBe('2025-08-31');
    });

    it('pads single digit months and days', () => {
      const date = new Date(2025, 0, 5); // January 5, 2025
      expect(formatDateToYYYYMMDD(date)).toBe('2025-01-05');
    });
  });

  describe('parseDateString', () => {
    it('parses YYYY-MM-DD to local date', () => {
      const date = parseDateString('2025-08-31');
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(7); // August (0-indexed)
      expect(date.getDate()).toBe(31);
      expect(date.getHours()).toBe(0);
    });
  });

  describe('getTodayString', () => {
    it('returns today in YYYY-MM-DD format', () => {
      const today = getTodayString();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getCurrentTimeString', () => {
    it('returns current time in HH:MM format', () => {
      const time = getCurrentTimeString();
      expect(time).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  describe('getCurrentTimeWithSeconds', () => {
    it('returns current time in HH:MM:SS format', () => {
      const time = getCurrentTimeWithSeconds();
      expect(time).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
  });
});

describe('Time String Utilities', () => {
  describe('normalizeTimeToHHMM', () => {
    it('converts HH:MM:SS to HH:MM', () => {
      expect(normalizeTimeToHHMM('14:30:45')).toBe('14:30');
    });

    it('returns HH:MM unchanged', () => {
      expect(normalizeTimeToHHMM('14:30')).toBe('14:30');
    });

    it('handles null/undefined', () => {
      expect(normalizeTimeToHHMM(null)).toBe('00:00');
      expect(normalizeTimeToHHMM(undefined)).toBe('00:00');
      expect(normalizeTimeToHHMM('')).toBe('00:00');
    });
  });

  describe('formatTimeHHMM', () => {
    it('formats hours and minutes correctly', () => {
      expect(formatTimeHHMM(14, 30)).toBe('14:30');
      expect(formatTimeHHMM(9, 5)).toBe('09:05');
      expect(formatTimeHHMM(0, 0)).toBe('00:00');
    });
  });

  describe('parseTimeString', () => {
    it('parses time string to hours and minutes', () => {
      expect(parseTimeString('14:30')).toEqual({ hours: 14, minutes: 30 });
      expect(parseTimeString('09:05')).toEqual({ hours: 9, minutes: 5 });
      expect(parseTimeString('00:00')).toEqual({ hours: 0, minutes: 0 });
    });
  });
});

describe('Date/Time Comparison Utilities', () => {
  describe('isDateToday', () => {
    it('correctly identifies today', () => {
      const today = formatDateToYYYYMMDD(new Date());
      expect(isDateToday(today)).toBe(true);
    });

    it('correctly identifies not today', () => {
      expect(isDateToday('2020-01-01')).toBe(false);
    });
  });

  describe('isDateInFuture', () => {
    it('correctly identifies future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = formatDateToYYYYMMDD(tomorrow);
      expect(isDateInFuture(tomorrowStr)).toBe(true);
    });

    it('correctly identifies today as not future', () => {
      const today = formatDateToYYYYMMDD(new Date());
      expect(isDateInFuture(today)).toBe(false);
    });
  });

  describe('isDateInPast', () => {
    it('correctly identifies past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatDateToYYYYMMDD(yesterday);
      expect(isDateInPast(yesterdayStr)).toBe(true);
    });

    it('correctly identifies today as not past', () => {
      const today = formatDateToYYYYMMDD(new Date());
      expect(isDateInPast(today)).toBe(false);
    });
  });

  describe('isTimeInRange', () => {
    it('correctly identifies time in range', () => {
      expect(isTimeInRange('10:00', '12:00', '11:00')).toBe(true);
      expect(isTimeInRange('10:00', '12:00', '10:00')).toBe(true);
      expect(isTimeInRange('10:00', '12:00', '12:00')).toBe(true);
    });

    it('correctly identifies time out of range', () => {
      expect(isTimeInRange('10:00', '12:00', '09:59')).toBe(false);
      expect(isTimeInRange('10:00', '12:00', '12:01')).toBe(false);
    });
  });

  describe('isTimePast', () => {
    it('correctly identifies past time', () => {
      expect(isTimePast('10:00', '11:00')).toBe(true);
    });

    it('correctly identifies current time as not past', () => {
      expect(isTimePast('10:00', '10:00')).toBe(false);
    });

    it('correctly identifies future time as not past', () => {
      expect(isTimePast('12:00', '11:00')).toBe(false);
    });
  });

  describe('isTimeFuture', () => {
    it('correctly identifies future time', () => {
      expect(isTimeFuture('12:00', '11:00')).toBe(true);
    });

    it('correctly identifies current time as not future', () => {
      expect(isTimeFuture('10:00', '10:00')).toBe(false);
    });

    it('correctly identifies past time as not future', () => {
      expect(isTimeFuture('10:00', '11:00')).toBe(false);
    });
  });
});

describe('Appointment-specific Utilities', () => {
  describe('isAppointmentHappeningNow', () => {
    it('returns true for current appointment', () => {
      const today = formatDateToYYYYMMDD(new Date());
      const now = new Date();
      const startTime = formatTimeHHMM(now.getHours(), 0);
      const endTime = formatTimeHHMM(now.getHours() + 1, 0);

      expect(isAppointmentHappeningNow(today, startTime, endTime)).toBe(true);
    });

    it('returns false for past appointment today', () => {
      const today = formatDateToYYYYMMDD(new Date());
      const now = new Date();
      const startTime = formatTimeHHMM(now.getHours() - 2, 0);
      const endTime = formatTimeHHMM(now.getHours() - 1, 0);

      expect(isAppointmentHappeningNow(today, startTime, endTime)).toBe(false);
    });

    it('returns false for future appointment today', () => {
      const today = formatDateToYYYYMMDD(new Date());
      const now = new Date();
      const startTime = formatTimeHHMM(now.getHours() + 1, 0);
      const endTime = formatTimeHHMM(now.getHours() + 2, 0);

      expect(isAppointmentHappeningNow(today, startTime, endTime)).toBe(false);
    });

    it('returns false for appointment on different day', () => {
      expect(isAppointmentHappeningNow('2020-01-01', '10:00', '11:00')).toBe(
        false
      );
    });

    it('uses start time as end time when end time is null', () => {
      const today = formatDateToYYYYMMDD(new Date());
      const now = new Date();
      const currentTime = formatTimeHHMM(now.getHours(), now.getMinutes());

      expect(isAppointmentHappeningNow(today, currentTime, null)).toBe(true);
    });
  });

  describe('isAppointmentPast', () => {
    it('returns true for past date', () => {
      expect(isAppointmentPast('2020-01-01', '23:59')).toBe(true);
    });

    it('returns true for past time today', () => {
      const today = formatDateToYYYYMMDD(new Date());
      const now = new Date();
      const endTime = formatTimeHHMM(now.getHours() - 1, 0);

      expect(isAppointmentPast(today, endTime)).toBe(true);
    });

    it('returns false for future time today', () => {
      const today = formatDateToYYYYMMDD(new Date());
      const now = new Date();
      const endTime = formatTimeHHMM(now.getHours() + 1, 0);

      expect(isAppointmentPast(today, endTime)).toBe(false);
    });

    it('returns false for future date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = formatDateToYYYYMMDD(tomorrow);

      expect(isAppointmentPast(tomorrowStr, '10:00')).toBe(false);
    });
  });

  describe('isAppointmentFuture', () => {
    it('returns true for future date', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = formatDateToYYYYMMDD(tomorrow);

      expect(isAppointmentFuture(tomorrowStr, '10:00')).toBe(true);
    });

    it('returns true for future time today', () => {
      const today = formatDateToYYYYMMDD(new Date());
      const now = new Date();
      const startTime = formatTimeHHMM(now.getHours() + 1, 0);

      expect(isAppointmentFuture(today, startTime)).toBe(true);
    });

    it('returns false for past time today', () => {
      const today = formatDateToYYYYMMDD(new Date());
      const now = new Date();
      const startTime = formatTimeHHMM(now.getHours() - 1, 0);

      expect(isAppointmentFuture(today, startTime)).toBe(false);
    });

    it('returns false for past date', () => {
      expect(isAppointmentFuture('2020-01-01', '10:00')).toBe(false);
    });
  });

  describe('getAppointmentStatus', () => {
    it('returns happening-now for current appointment', () => {
      const today = formatDateToYYYYMMDD(new Date());
      const now = new Date();
      const startTime = formatTimeHHMM(now.getHours(), 0);
      const endTime = formatTimeHHMM(now.getHours() + 1, 0);

      expect(getAppointmentStatus(today, startTime, endTime)).toBe(
        'happening-now'
      );
    });

    it('returns past for past appointment', () => {
      expect(getAppointmentStatus('2020-01-01', '10:00', '11:00')).toBe('past');
    });

    it('returns future for future appointment', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = formatDateToYYYYMMDD(tomorrow);

      expect(getAppointmentStatus(tomorrowStr, '10:00', '11:00')).toBe(
        'future'
      );
    });
  });
});

describe('Time Duration Utilities', () => {
  describe('addMinutesToTime', () => {
    it('adds minutes correctly', () => {
      expect(addMinutesToTime('10:30', 30)).toBe('11:00');
      expect(addMinutesToTime('10:30', 45)).toBe('11:15');
      expect(addMinutesToTime('10:30', 90)).toBe('12:00');
    });

    it('handles day overflow', () => {
      expect(addMinutesToTime('23:30', 60)).toBe('00:30');
      expect(addMinutesToTime('23:00', 120)).toBe('01:00');
    });
  });

  describe('getTimeDifferenceInMinutes', () => {
    it('calculates difference correctly', () => {
      expect(getTimeDifferenceInMinutes('10:00', '11:30')).toBe(90);
      expect(getTimeDifferenceInMinutes('10:00', '10:30')).toBe(30);
      expect(getTimeDifferenceInMinutes('10:00', '10:00')).toBe(0);
    });

    it('handles next day times', () => {
      expect(getTimeDifferenceInMinutes('23:00', '01:00')).toBe(120);
      expect(getTimeDifferenceInMinutes('22:00', '02:00')).toBe(240);
    });
  });
});

describe('Date Range Utilities', () => {
  describe('isDateInRange', () => {
    it('correctly identifies date in range', () => {
      expect(isDateInRange('2025-08-15', '2025-08-01', '2025-08-31')).toBe(
        true
      );
      expect(isDateInRange('2025-08-01', '2025-08-01', '2025-08-31')).toBe(
        true
      );
      expect(isDateInRange('2025-08-31', '2025-08-01', '2025-08-31')).toBe(
        true
      );
    });

    it('correctly identifies date out of range', () => {
      expect(isDateInRange('2025-07-31', '2025-08-01', '2025-08-31')).toBe(
        false
      );
      expect(isDateInRange('2025-09-01', '2025-08-01', '2025-08-31')).toBe(
        false
      );
    });
  });

  describe('getDateRange', () => {
    it('generates date range correctly', () => {
      const range = getDateRange('2025-08-01', '2025-08-03');
      expect(range).toEqual(['2025-08-01', '2025-08-02', '2025-08-03']);
    });

    it('handles single day range', () => {
      const range = getDateRange('2025-08-01', '2025-08-01');
      expect(range).toEqual(['2025-08-01']);
    });

    it('handles month boundaries', () => {
      const range = getDateRange('2025-08-30', '2025-09-02');
      expect(range).toEqual([
        '2025-08-30',
        '2025-08-31',
        '2025-09-01',
        '2025-09-02',
      ]);
    });
  });
});

describe('Formatting for Display', () => {
  describe('formatDateDisplay', () => {
    it('formats date for display', () => {
      expect(formatDateDisplay('2025-08-31')).toBe('Aug 31, 2025');
      expect(formatDateDisplay('2025-01-05')).toBe('Jan 5, 2025');
      expect(formatDateDisplay('2025-12-25')).toBe('Dec 25, 2025');
    });
  });

  describe('formatDateShort', () => {
    it('formats date short', () => {
      expect(formatDateShort('2025-08-31')).toBe('Aug 31');
      expect(formatDateShort('2025-01-05')).toBe('Jan 5');
      expect(formatDateShort('2025-12-25')).toBe('Dec 25');
    });
  });

  describe('formatTime12Hour', () => {
    it('formats morning times correctly', () => {
      expect(formatTime12Hour('09:30')).toBe('9:30 AM');
      expect(formatTime12Hour('00:00')).toBe('12:00 AM');
      expect(formatTime12Hour('11:59')).toBe('11:59 AM');
    });

    it('formats afternoon/evening times correctly', () => {
      expect(formatTime12Hour('12:00')).toBe('12:00 PM');
      expect(formatTime12Hour('13:30')).toBe('1:30 PM');
      expect(formatTime12Hour('23:59')).toBe('11:59 PM');
    });
  });

  describe('formatTimeRange', () => {
    it('formats time range correctly', () => {
      expect(formatTimeRange('10:00', '11:30')).toBe('10:00 AM - 11:30 AM');
      expect(formatTimeRange('22:00', '23:30')).toBe('10:00 PM - 11:30 PM');
    });

    it('handles null/undefined end time', () => {
      expect(formatTimeRange('10:00', null)).toBe('10:00 AM');
      expect(formatTimeRange('22:00', undefined)).toBe('10:00 PM');
    });

    it('handles same start and end time', () => {
      expect(formatTimeRange('10:00', '10:00')).toBe('10:00 AM');
    });
  });
});

describe('Common Date Patterns', () => {
  describe('getDueDateInfo', () => {
    it('returns null for null date', () => {
      expect(getDueDateInfo(null)).toBeNull();
    });

    it('correctly identifies today', () => {
      const today = formatDateToYYYYMMDD(new Date());
      const info = getDueDateInfo(today);

      expect(info).not.toBeNull();
      expect(info!.isToday).toBe(true);
      expect(info!.isTomorrow).toBe(false);
      expect(info!.isPast).toBe(false);
      expect(info!.daysUntilDue).toBe(0);
    });

    it('correctly identifies tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = formatDateToYYYYMMDD(tomorrow);
      const info = getDueDateInfo(tomorrowStr);

      expect(info).not.toBeNull();
      expect(info!.isToday).toBe(false);
      expect(info!.isTomorrow).toBe(true);
      expect(info!.isPast).toBe(false);
      expect(info!.daysUntilDue).toBe(1);
    });

    it('correctly identifies urgent dates', () => {
      const threeDays = new Date();
      threeDays.setDate(threeDays.getDate() + 3);
      const threeDaysStr = formatDateToYYYYMMDD(threeDays);
      const info = getDueDateInfo(threeDaysStr);

      expect(info).not.toBeNull();
      expect(info!.isUrgent).toBe(true);
      expect(info!.daysUntilDue).toBe(3);
    });

    it('correctly identifies past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatDateToYYYYMMDD(yesterday);
      const info = getDueDateInfo(yesterdayStr);

      expect(info).not.toBeNull();
      expect(info!.isPast).toBe(true);
      expect(info!.isUrgent).toBe(false);
      expect(info!.daysUntilDue).toBe(-1);
    });

    it('formats dates correctly', () => {
      const info = getDueDateInfo('2025-08-31');

      expect(info).not.toBeNull();
      expect(info!.date).toBe('Aug 31, 2025');
      expect(info!.shortDate).toBe('Aug 31');
    });
  });
});
