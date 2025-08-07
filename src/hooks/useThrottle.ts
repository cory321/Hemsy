import { useRef, useCallback } from 'react';

/**
 * useThrottle - React hook to throttle a callback function.
 *
 * @param callback - The function to throttle
 * @param delay - Minimum delay (ms) between calls
 * @returns Throttled callback
 */
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef(0);
  const savedCallback = useRef(callback);

  // Update ref if callback changes
  savedCallback.current = callback;

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall.current >= delay) {
        lastCall.current = now;
        savedCallback.current(...args);
      }
    },
    [delay]
  ) as T;
}
