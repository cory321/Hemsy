import { format } from 'date-fns';
import {
  parseLocalDateFromYYYYMMDD,
  formatLocalYYYYMMDD,
} from '@/lib/utils/date';

describe('parseLocalDateFromYYYYMMDD', () => {
  it('parses YYYY-MM-DD into a local Date at midnight without UTC shift', () => {
    const date = parseLocalDateFromYYYYMMDD('2025-11-05');
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(10); // November is 10 (0-based)
    expect(date.getDate()).toBe(5);

    // Should format to the expected day regardless of timezone
    expect(format(date, 'EEEE, MMMM d, yyyy')).toBe(
      'Wednesday, November 5, 2025'
    );
  });

  it('formats YYYY-MM-DD using local semantics', () => {
    expect(formatLocalYYYYMMDD('2025-01-20', 'MMM d, yyyy')).toBe(
      'Jan 20, 2025'
    );
  });
});
