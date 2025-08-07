import { renderHook, act } from '@testing-library/react';
import { useThrottle } from './useThrottle';

jest.useFakeTimers();

describe('useThrottle', () => {
  it('should only call the callback once per interval', () => {
    const fn = jest.fn();
    const { result } = renderHook(() => useThrottle(fn, 500));

    act(() => {
      result.current();
      result.current();
      result.current();
    });
    expect(fn).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(500);
      result.current();
    });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should pass arguments to the callback', () => {
    const fn = jest.fn();
    const { result } = renderHook(() => useThrottle(fn, 300));
    act(() => {
      result.current('foo', 42);
    });
    expect(fn).toHaveBeenCalledWith('foo', 42);
  });

  it('should work with changing callback', () => {
    let value = 0;
    const { result, rerender } = renderHook(({ cb }) => useThrottle(cb, 400), {
      initialProps: { cb: () => value++ },
    });
    act(() => {
      result.current();
    });
    expect(value).toBe(1);
    rerender({ cb: () => (value += 10) });
    act(() => {
      jest.advanceTimersByTime(400);
      result.current();
    });
    expect(value).toBe(11);
  });

  it('should throttle independently for different delays', () => {
    const fn1 = jest.fn();
    const fn2 = jest.fn();
    const { result: r1 } = renderHook(() => useThrottle(fn1, 200));
    const { result: r2 } = renderHook(() => useThrottle(fn2, 400));
    act(() => {
      r1.current();
      r2.current();
    });
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
    act(() => {
      jest.advanceTimersByTime(200);
      r1.current();
      r2.current();
    });
    expect(fn1).toHaveBeenCalledTimes(2);
    expect(fn2).toHaveBeenCalledTimes(1);
    act(() => {
      jest.advanceTimersByTime(200);
      r2.current();
    });
    expect(fn2).toHaveBeenCalledTimes(2);
  });
});
