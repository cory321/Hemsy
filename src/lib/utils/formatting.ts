import { formatDistanceToNow } from 'date-fns';

/**
 * Format relative time with smart fallback to absolute date for older entries
 * Shows relative time (e.g., "2h 30m ago") for recent entries,
 * but switches to absolute date (e.g., "Jan 15, 2024") for entries older than 7 days
 */
export function formatRelativeTime(
  date: string | Date,
  options?: {
    maxRelativeDays?: number;
    includeTime?: boolean;
  }
): string {
  const { maxRelativeDays = 7, includeTime = false } = options || {};

  try {
    const targetDate = new Date(date);

    // Check if the date is valid
    if (isNaN(targetDate.getTime())) {
      throw new Error('Invalid date');
    }

    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // For entries older than maxRelativeDays, show absolute date
    if (diffInDays > maxRelativeDays) {
      if (includeTime) {
        return formatDateTime(targetDate);
      } else {
        return formatDate(targetDate);
      }
    }

    // For recent entries, show relative time
    return formatDistanceToNow(targetDate, { addSuffix: true });
  } catch (error) {
    console.error('Invalid date in formatRelativeTime:', date);
    return 'Invalid date';
  }
}

/**
 * Format payment age with better UX for different time ranges
 * - Under 1 hour: "45m ago"
 * - Under 24 hours: "3h 15m ago"
 * - Under 7 days: "2 days ago"
 * - Older: absolute date
 */
export function formatPaymentAge(date: string | Date): string {
  try {
    const targetDate = new Date(date);

    // Check if the date is valid
    if (isNaN(targetDate.getTime())) {
      throw new Error('Invalid date');
    }

    const now = new Date();
    const diffInMs = now.getTime() - targetDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    // Less than 1 hour: show minutes
    if (diffInHours < 1) {
      return `${diffInMinutes}m ago`;
    }

    // Less than 24 hours: show hours and minutes
    if (diffInDays < 1) {
      const remainingMinutes = diffInMinutes % 60;
      return `${diffInHours}h ${remainingMinutes}m ago`;
    }

    // 7 days or less: use relative format like "2 days ago"
    if (diffInDays <= 7) {
      return formatDistanceToNow(targetDate, { addSuffix: true });
    }

    // Older than 7 days: show absolute date
    return formatDate(targetDate);
  } catch (error) {
    console.error('Invalid date in formatPaymentAge:', date);
    return 'Invalid date';
  }
}

/**
 * Format a number as currency
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/**
 * Format a date
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Format a date and time
 */
export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Format a phone number using libphonenumber-js for proper international formatting
 * @deprecated Use formatPhoneNumber from './phone' instead for better functionality
 */
export function formatPhoneNumber(
  phone: string,
  defaultCountry: string = 'US'
): string {
  // Import the dedicated phone utility
  const { formatPhoneNumber: formatPhone } = require('./phone');
  return formatPhone(phone, defaultCountry);
}

/**
 * Format a percentage
 */
export function formatPercent(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
