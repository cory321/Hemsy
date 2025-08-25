import { renderHook, act } from '@testing-library/react';
import { usePhoneInput } from '../usePhoneInput';

describe('usePhoneInput', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePhoneInput());

    expect(result.current.value).toBe('');
    expect(result.current.formattedValue).toBe('');
    expect(result.current.isValid).toBe(false);
    expect(result.current.isPossible).toBe(false);
  });

  it('should initialize with provided initial value', () => {
    const { result } = renderHook(() =>
      usePhoneInput({
        initialValue: '2133734253',
      })
    );

    expect(result.current.value).toBe('2133734253');
    expect(result.current.formattedValue).toBe('(213) 373-4253');
    expect(result.current.isValid).toBe(true);
  });

  it('should format phone number as user types', () => {
    const { result } = renderHook(() => usePhoneInput());

    act(() => {
      result.current.handleInput('213');
    });

    expect(result.current.value).toBe('213');

    act(() => {
      result.current.handleInput('2133734253');
    });

    expect(result.current.value).toBe('2133734253');
    expect(result.current.formattedValue).toBe('(213) 373-4253');
  });

  it('should validate phone numbers correctly', () => {
    const { result } = renderHook(() => usePhoneInput());

    // Invalid number
    act(() => {
      result.current.handleInput('123');
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.isPossible).toBe(false);

    // Valid number
    act(() => {
      result.current.handleInput('2133734253');
    });

    expect(result.current.isValid).toBe(true);
    expect(result.current.isPossible).toBe(true);
  });

  it('should call onChange callback when provided', () => {
    const mockOnChange = jest.fn();
    const { result } = renderHook(() =>
      usePhoneInput({
        onChange: mockOnChange,
      })
    );

    act(() => {
      result.current.handleInput('2133734253');
    });

    expect(mockOnChange).toHaveBeenCalledWith('2133734253', true);
  });

  it('should handle setValue correctly', () => {
    const mockOnChange = jest.fn();
    const { result } = renderHook(() =>
      usePhoneInput({
        onChange: mockOnChange,
      })
    );

    act(() => {
      result.current.setValue('2133734253');
    });

    expect(result.current.value).toBe('2133734253');
    expect(mockOnChange).toHaveBeenCalledWith('2133734253', true);
  });

  it('should reset correctly', () => {
    const mockOnChange = jest.fn();
    const { result } = renderHook(() =>
      usePhoneInput({
        initialValue: '2133734253',
        onChange: mockOnChange,
      })
    );

    expect(result.current.value).toBe('2133734253');

    act(() => {
      result.current.reset();
    });

    expect(result.current.value).toBe('');
    expect(result.current.formattedValue).toBe('');
    expect(mockOnChange).toHaveBeenCalledWith('', false);
  });

  it('should handle different country codes', () => {
    const { result } = renderHook(() =>
      usePhoneInput({
        defaultCountry: 'GB',
      })
    );

    act(() => {
      result.current.handleInput('07911123456');
    });

    expect(result.current.value).toBe('07911123456');
    expect(result.current.isValid).toBe(true);
  });

  it('should handle change events from input elements', () => {
    const { result } = renderHook(() => usePhoneInput());

    const mockEvent = {
      target: { value: '2133734253' },
    } as React.ChangeEvent<HTMLInputElement>;

    act(() => {
      result.current.handleChange(mockEvent);
    });

    expect(result.current.value).toBe('2133734253');
    expect(result.current.formattedValue).toBe('(213) 373-4253');
  });

  it('should maintain isPossible state for partial numbers', () => {
    const { result } = renderHook(() => usePhoneInput());

    // Partial number that's long enough to be considered possible
    act(() => {
      result.current.handleInput('2133734');
    });

    expect(result.current.isPossible).toBe(false); // Not 10 digits yet
    expect(result.current.isValid).toBe(false);

    // Complete number
    act(() => {
      result.current.handleInput('2133734253');
    });

    expect(result.current.isPossible).toBe(true);
    expect(result.current.isValid).toBe(true);
  });

  it('should handle external value changes', () => {
    const { result, rerender } = renderHook(
      ({ initialValue }) => usePhoneInput({ initialValue }),
      { initialProps: { initialValue: '2133734253' } }
    );

    expect(result.current.value).toBe('2133734253');

    // This test simulates external value changes, but since our hook
    // doesn't automatically sync with external changes, we focus on
    // the setValue method which should be used for external updates
    act(() => {
      result.current.setValue('5551234567');
    });

    expect(result.current.value).toBe('5551234567');
    expect(result.current.formattedValue).toBe('(555) 123-4567');
  });
});
