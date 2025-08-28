import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge class names
 * This is maintained for backwards compatibility with existing code
 * that may still use cn() for className merging.
 * With MUI, prefer using sx prop for styling instead of className.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
