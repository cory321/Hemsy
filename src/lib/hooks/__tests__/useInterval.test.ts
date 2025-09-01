import { renderHook, act } from '@testing-library/react';
import { useInterval, useTimeout, useVisibilityInterval } from '../useInterval';

// Mock timers
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('useInterval', () => {
  it('should call the callback at the specified interval', () => {
    const callback = jest.fn();

    renderHook(() => useInterval(callback, 1000));

    expect(callback).not.toHaveBeenCalled();

    // Fast-forward 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(1);

    // Fast-forward another 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('should call the callback immediately if immediate flag is true', () => {
    const callback = jest.fn();

    renderHook(() => useInterval(callback, 1000, true));

    // Should be called immediately
    expect(callback).toHaveBeenCalledTimes(1);

    // And then after each interval
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('should not call the callback when delay is null', () => {
    const callback = jest.fn();

    renderHook(() => useInterval(callback, null));

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should cleanup interval on unmount', () => {
    const callback = jest.fn();
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount } = renderHook(() => useInterval(callback, 1000));

    // Verify interval is set
    expect(jest.getTimerCount()).toBe(1);

    // Unmount the hook
    unmount();

    // Verify clearInterval was called
    expect(clearIntervalSpy).toHaveBeenCalled();

    // Verify no more timers
    expect(jest.getTimerCount()).toBe(0);

    // Callback should not be called after unmount
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should update callback without resetting interval', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    const { rerender } = renderHook(({ cb }) => useInterval(cb, 1000), {
      initialProps: { cb: callback1 },
    });

    // Advance halfway through interval
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Change callback
    rerender({ cb: callback2 });

    // Complete the interval
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Should call the new callback, not the old one
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it('should restart interval when delay changes', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(
      ({ delay }) => useInterval(callback, delay),
      { initialProps: { delay: 1000 } }
    );

    // Advance halfway
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Change delay
    rerender({ delay: 2000 });

    // Old interval should be cleared, callback not called yet
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(callback).not.toHaveBeenCalled();

    // New interval should fire after 2000ms total
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should return cleanup function', () => {
    const callback = jest.fn();

    const { result } = renderHook(() => useInterval(callback, 1000));

    expect(typeof result.current).toBe('function');

    // Manually call cleanup
    act(() => {
      result.current();
    });

    // Callback should not be called after manual cleanup
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(callback).not.toHaveBeenCalled();
  });
});

describe('useTimeout', () => {
  it('should call the callback after the specified delay', () => {
    const callback = jest.fn();

    renderHook(() => useTimeout(callback, 1000));

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(999);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should not call the callback when delay is null', () => {
    const callback = jest.fn();

    renderHook(() => useTimeout(callback, null));

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should cleanup timeout on unmount', () => {
    const callback = jest.fn();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const { unmount } = renderHook(() => useTimeout(callback, 1000));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should restart timeout when delay changes', () => {
    const callback = jest.fn();

    const { rerender } = renderHook(
      ({ delay }) => useTimeout(callback, delay),
      { initialProps: { delay: 1000 } }
    );

    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Change delay
    rerender({ delay: 2000 });

    // Old timeout should be cleared
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(callback).not.toHaveBeenCalled();

    // New timeout should fire after 2000ms from change
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });
});

describe('useVisibilityInterval', () => {
  let originalHidden: PropertyDescriptor | undefined;

  beforeEach(() => {
    // Mock document.hidden
    originalHidden = Object.getOwnPropertyDescriptor(document, 'hidden');
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      writable: true,
      value: false,
    });
  });

  afterEach(() => {
    // Restore document.hidden
    if (originalHidden) {
      Object.defineProperty(document, 'hidden', originalHidden);
    }
  });

  it('should pause interval when document is hidden', () => {
    const callback = jest.fn();

    renderHook(() => useVisibilityInterval(callback, 1000, true));

    // Should work normally when visible
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    // Hide the document
    Object.defineProperty(document, 'hidden', { value: true });
    document.dispatchEvent(new Event('visibilitychange'));

    // Callback should not be called while hidden
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(callback).toHaveBeenCalledTimes(1); // Still 1

    // Show the document again
    Object.defineProperty(document, 'hidden', { value: false });
    document.dispatchEvent(new Event('visibilitychange'));

    // Should immediately call callback on visibility
    expect(callback).toHaveBeenCalledTimes(2);

    // And continue with interval
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('should not pause when pauseWhenHidden is false', () => {
    const callback = jest.fn();

    renderHook(() => useVisibilityInterval(callback, 1000, false));

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(1);

    // Hide the document
    Object.defineProperty(document, 'hidden', { value: true });
    document.dispatchEvent(new Event('visibilitychange'));

    // Should continue calling callback
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('should cleanup visibility listener on unmount', () => {
    const callback = jest.fn();
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = renderHook(() =>
      useVisibilityInterval(callback, 1000, true)
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );
  });

  it('should handle rapid visibility changes', () => {
    const callback = jest.fn();

    renderHook(() => useVisibilityInterval(callback, 1000, true));

    // Rapidly toggle visibility
    for (let i = 0; i < 5; i++) {
      Object.defineProperty(document, 'hidden', { value: true });
      document.dispatchEvent(new Event('visibilitychange'));

      Object.defineProperty(document, 'hidden', { value: false });
      document.dispatchEvent(new Event('visibilitychange'));
    }

    // Should handle rapid changes without errors
    // Each visibility restoration should trigger callback
    expect(callback).toHaveBeenCalledTimes(5);

    // Should continue working normally
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(callback).toHaveBeenCalledTimes(6);
  });
});
