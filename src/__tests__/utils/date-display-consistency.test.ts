import {
  getDetailedDueDateDisplay,
  getDueDateInfo,
} from '@/lib/utils/date-time-utils';

describe('Date Display Consistency', () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  describe('getDetailedDueDateDisplay', () => {
    it('should show specific days overdue for past dates', () => {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      expect(getDetailedDueDateDisplay(formatDate(yesterday))).toBe(
        '1 day overdue'
      );

      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      expect(getDetailedDueDateDisplay(formatDate(threeDaysAgo))).toBe(
        '3 days overdue'
      );

      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      expect(getDetailedDueDateDisplay(formatDate(weekAgo))).toBe(
        '7 days overdue'
      );
    });

    it('should show "Due today" for today', () => {
      expect(getDetailedDueDateDisplay(formatDate(today))).toBe('Due today');
    });

    it('should show "Due tomorrow" for tomorrow', () => {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(getDetailedDueDateDisplay(formatDate(tomorrow))).toBe(
        'Due tomorrow'
      );
    });

    it('should show specific days for future dates', () => {
      const inThreeDays = new Date(today);
      inThreeDays.setDate(inThreeDays.getDate() + 3);
      expect(getDetailedDueDateDisplay(formatDate(inThreeDays))).toBe(
        'Due in 3 days'
      );

      const inWeek = new Date(today);
      inWeek.setDate(inWeek.getDate() + 7);
      expect(getDetailedDueDateDisplay(formatDate(inWeek))).toBe(
        'Due in 7 days'
      );
    });

    it('should handle null/undefined dates', () => {
      expect(getDetailedDueDateDisplay(null)).toBe('No due date');
      expect(getDetailedDueDateDisplay(undefined)).toBe('No due date');
      expect(getDetailedDueDateDisplay('')).toBe('No due date');
    });
  });

  describe('Consistency between dashboard and garments page', () => {
    it('should produce the same display for overdue items', () => {
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const dateStr = formatDate(threeDaysAgo);

      // This is what the dashboard now shows
      const dashboardDisplay = getDetailedDueDateDisplay(dateStr);

      // This is what the garments page shows
      const dueDateInfo = getDueDateInfo(dateStr);
      const garmentsPageDisplay = dueDateInfo
        ? `${Math.abs(dueDateInfo.daysUntilDue)} day${Math.abs(dueDateInfo.daysUntilDue) !== 1 ? 's' : ''} overdue`
        : 'No due date';

      expect(dashboardDisplay).toBe(garmentsPageDisplay);
      expect(dashboardDisplay).toBe('3 days overdue');
    });

    it('should produce the same display for today', () => {
      const dateStr = formatDate(today);

      const dashboardDisplay = getDetailedDueDateDisplay(dateStr);
      const dueDateInfo = getDueDateInfo(dateStr);
      const garmentsPageDisplay = dueDateInfo?.isToday ? 'Due today' : 'Other';

      expect(dashboardDisplay).toBe('Due today');
      expect(garmentsPageDisplay).toBe('Due today');
    });

    it('should produce consistent display for future dates', () => {
      const inFiveDays = new Date(today);
      inFiveDays.setDate(inFiveDays.getDate() + 5);
      const dateStr = formatDate(inFiveDays);

      const dashboardDisplay = getDetailedDueDateDisplay(dateStr);
      const dueDateInfo = getDueDateInfo(dateStr);
      const garmentsPageDisplay = dueDateInfo
        ? `Due in ${dueDateInfo.daysUntilDue} days`
        : 'No due date';

      expect(dashboardDisplay).toBe(garmentsPageDisplay);
      expect(dashboardDisplay).toBe('Due in 5 days');
    });
  });
});
