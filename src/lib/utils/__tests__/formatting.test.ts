import { formatPaymentAge, formatRelativeTime } from '../formatting';

describe('formatPaymentAge', () => {
  const now = new Date('2024-01-15T12:00:00Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.setSystemTime(now);
  });

  it('should format minutes for times under 1 hour', () => {
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    expect(formatPaymentAge(thirtyMinutesAgo)).toBe('30m ago');

    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    expect(formatPaymentAge(fiveMinutesAgo)).toBe('5m ago');
  });

  it('should format hours and minutes for times under 24 hours', () => {
    const twoHoursThirtyMinutesAgo = new Date(
      now.getTime() - (2 * 60 + 30) * 60 * 1000
    );
    expect(formatPaymentAge(twoHoursThirtyMinutesAgo)).toBe('2h 30m ago');

    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    expect(formatPaymentAge(oneHourAgo)).toBe('1h 0m ago');

    const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000);
    expect(formatPaymentAge(twentyThreeHoursAgo)).toBe('23h 0m ago');
  });

  it('should use relative format for times between 1-7 days', () => {
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    expect(formatPaymentAge(twoDaysAgo)).toBe('2 days ago');

    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    expect(formatPaymentAge(oneDayAgo)).toBe('1 day ago');

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    expect(formatPaymentAge(sevenDaysAgo)).toBe('7 days ago');
  });

  it('should show absolute date for times older than 7 days', () => {
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
    expect(formatPaymentAge(eightDaysAgo)).toBe('January 7, 2024');

    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    expect(formatPaymentAge(oneMonthAgo)).toBe('December 16, 2023');
  });

  it('should handle string dates', () => {
    const thirtyMinutesAgo = new Date(
      now.getTime() - 30 * 60 * 1000
    ).toISOString();
    expect(formatPaymentAge(thirtyMinutesAgo)).toBe('30m ago');
  });

  it('should handle invalid dates gracefully', () => {
    expect(formatPaymentAge('invalid-date')).toBe('Invalid date');
    expect(formatPaymentAge('')).toBe('Invalid date');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2024-01-15T12:00:00Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.setSystemTime(now);
  });

  it('should show relative time for recent dates', () => {
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoDaysAgo)).toBe('2 days ago');

    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    expect(formatRelativeTime(oneHourAgo)).toBe('about 1 hour ago');
  });

  it('should show absolute date for old dates', () => {
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(eightDaysAgo)).toBe('January 7, 2024');
  });

  it('should respect custom maxRelativeDays option', () => {
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // With default (7 days), should show relative
    expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago');

    // With custom 2 days, should show absolute
    expect(formatRelativeTime(threeDaysAgo, { maxRelativeDays: 2 })).toBe(
      'January 12, 2024'
    );
  });

  it('should include time when requested', () => {
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(eightDaysAgo, { includeTime: true });
    // The exact time format may vary based on timezone, but should include date and time
    expect(result).toMatch(/Jan 7, 2024, \d{1,2}:\d{2} [AP]M/);
  });

  it('should handle invalid dates gracefully', () => {
    expect(formatRelativeTime('invalid-date')).toBe('Invalid date');
  });
});
