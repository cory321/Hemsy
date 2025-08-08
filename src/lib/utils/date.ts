'use client';

import { format } from 'date-fns';

/**
 * Parse a YYYY-MM-DD string into a local Date at midnight.
 * Avoids the Date constructor/parseISO UTC interpretation for date-only strings.
 */
export function parseLocalDateFromYYYYMMDD(dateStr: string): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr || '0', 10);
  const monthIndex = parseInt(monthStr || '1', 10) - 1; // 0-based
  const day = parseInt(dayStr || '1', 10);
  return new Date(year, monthIndex, day, 0, 0, 0, 0);
}

/**
 * Format a YYYY-MM-DD string using local timezone semantics via a Date object.
 */
export function formatLocalYYYYMMDD(dateStr: string, pattern: string): string {
  return format(parseLocalDateFromYYYYMMDD(dateStr), pattern);
}
