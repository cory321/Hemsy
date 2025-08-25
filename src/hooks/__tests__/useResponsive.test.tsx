import { renderHook } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { useResponsive } from '../useResponsive';

// Mock the useMediaQuery hook
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn(),
}));

import { useMediaQuery } from '@mui/material';

const theme = createTheme();

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe('useResponsive', () => {
  const mockedUseMediaQuery = useMediaQuery as jest.MockedFunction<
    typeof useMediaQuery
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should detect mobile breakpoint', () => {
    // Mock in order: down('md'), between('md', 'lg'), up('lg')
    mockedUseMediaQuery
      .mockReturnValueOnce(true) // isMobile: down('md') = true
      .mockReturnValueOnce(false) // isTablet: between('md', 'lg') = false
      .mockReturnValueOnce(false); // isDesktop: up('lg') = false

    const { result } = renderHook(() => useResponsive(), { wrapper });

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.currentBreakpoint).toBe('mobile');
  });

  it('should detect tablet breakpoint', () => {
    // Mock in order: down('md'), between('md', 'lg'), up('lg')
    mockedUseMediaQuery
      .mockReturnValueOnce(false) // isMobile: down('md') = false
      .mockReturnValueOnce(true) // isTablet: between('md', 'lg') = true
      .mockReturnValueOnce(false); // isDesktop: up('lg') = false

    const { result } = renderHook(() => useResponsive(), { wrapper });

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
    expect(result.current.currentBreakpoint).toBe('tablet');
  });

  it('should detect desktop breakpoint', () => {
    // Mock in order: down('md'), between('md', 'lg'), up('lg')
    mockedUseMediaQuery
      .mockReturnValueOnce(false) // isMobile: down('md') = false
      .mockReturnValueOnce(false) // isTablet: between('md', 'lg') = false
      .mockReturnValueOnce(true); // isDesktop: up('lg') = true

    const { result } = renderHook(() => useResponsive(), { wrapper });

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.currentBreakpoint).toBe('desktop');
  });

  describe('touch device detection', () => {
    it('should detect touch device when ontouchstart is available', () => {
      // Mock window with ontouchstart
      const originalWindow = global.window;
      Object.defineProperty(global, 'window', {
        value: { ...originalWindow, ontouchstart: jest.fn() },
        writable: true,
        configurable: true,
      });

      // Mock in order: down('md'), between('md', 'lg'), up('lg')
      mockedUseMediaQuery
        .mockReturnValueOnce(false) // isMobile
        .mockReturnValueOnce(false) // isTablet
        .mockReturnValueOnce(false); // isDesktop

      const { result } = renderHook(() => useResponsive(), { wrapper });

      expect(result.current.isTouchDevice).toBe(true);

      // Restore original window
      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    });

    it('should return false for touch device when ontouchstart is not available', () => {
      // Mock window without ontouchstart
      const originalWindow = global.window;
      const windowWithoutTouch = { ...originalWindow };
      delete (windowWithoutTouch as any).ontouchstart;

      Object.defineProperty(global, 'window', {
        value: windowWithoutTouch,
        writable: true,
        configurable: true,
      });

      // Mock in order: down('md'), between('md', 'lg'), up('lg')
      mockedUseMediaQuery
        .mockReturnValueOnce(false) // isMobile
        .mockReturnValueOnce(false) // isTablet
        .mockReturnValueOnce(false); // isDesktop

      const { result } = renderHook(() => useResponsive(), { wrapper });

      expect(result.current.isTouchDevice).toBe(false);

      // Restore original window
      Object.defineProperty(global, 'window', {
        value: originalWindow,
        writable: true,
        configurable: true,
      });
    });
  });
});
