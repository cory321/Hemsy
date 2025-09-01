import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for safe interval management with automatic cleanup
 * @param callback - Function to execute on each interval
 * @param delay - Delay in milliseconds, or null to pause
 * @param immediate - Whether to execute callback immediately on mount
 */
export function useInterval(
  callback: () => void,
  delay: number | null,
  immediate = false
) {
  const savedCallback = useRef<() => void>(callback);
  const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }

    // Execute immediately if requested
    if (immediate && delay !== null) {
      tick();
    }

    if (delay !== null) {
      intervalId.current = setInterval(tick, delay);
      return () => {
        if (intervalId.current) {
          clearInterval(intervalId.current);
          intervalId.current = null;
        }
      };
    }

    return undefined;
  }, [delay, immediate]);

  // Return cleanup function for manual cleanup if needed
  const cleanup = useCallback(() => {
    if (intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
  }, []);

  return cleanup;
}

/**
 * Custom hook for safe timeout management with automatic cleanup
 * @param callback - Function to execute after timeout
 * @param delay - Delay in milliseconds, or null to cancel
 */
export function useTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>(callback);
  const timeoutId = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the timeout
  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }

    if (delay !== null) {
      timeoutId.current = setTimeout(tick, delay);
      return () => {
        if (timeoutId.current) {
          clearTimeout(timeoutId.current);
          timeoutId.current = null;
        }
      };
    }

    return undefined;
  }, [delay]);

  // Return cleanup function for manual cleanup if needed
  const cleanup = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
  }, []);

  return cleanup;
}

/**
 * Hook for visibility-aware intervals that pause when tab is hidden
 * Saves CPU and battery when user switches tabs
 */
export function useVisibilityInterval(
  callback: () => void,
  delay: number | null,
  pauseWhenHidden = true
) {
  const savedCallback = useRef<() => void>(callback);
  const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!pauseWhenHidden || delay === null) {
      return;
    }

    function tick() {
      if (savedCallback.current && !document.hidden) {
        savedCallback.current();
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        // Clear interval when tab becomes hidden
        if (intervalId.current) {
          clearInterval(intervalId.current);
          intervalId.current = null;
        }
      } else {
        // Restart interval when tab becomes visible
        if (delay !== null && !intervalId.current) {
          tick(); // Execute immediately on visibility
          intervalId.current = setInterval(tick, delay);
        }
      }
    }

    // Start interval if document is visible
    if (!document.hidden && delay !== null) {
      intervalId.current = setInterval(tick, delay);
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalId.current) {
        clearInterval(intervalId.current);
        intervalId.current = null;
      }
    };
  }, [delay, pauseWhenHidden]);
}
