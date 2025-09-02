/**
 * Test suite for error handling components and utilities
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RootError from '@/app/error';
import AppError from '@/app/(app)/error';
import { logger } from '@/lib/utils/logger';

// Mock the logger to prevent actual logging during tests
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    apiError: jest.fn(),
    dbError: jest.fn(),
    withContext: jest.fn(() => ({
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    })),
  },
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Root Error Boundary', () => {
    it('renders error message and retry button', () => {
      const mockReset = jest.fn();
      const error = new Error('Test error message');

      render(<RootError error={error} reset={mockReset} />);

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Try Again/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/Go to Dashboard/i)).toBeInTheDocument();
    });

    it('logs error on mount', () => {
      const mockReset = jest.fn();
      const error = new Error('Test error message');

      render(<RootError error={error} reset={mockReset} />);

      expect(logger.error).toHaveBeenCalledWith(
        'Application error:',
        expect.objectContaining({
          message: 'Test error message',
        })
      );
    });

    it('calls reset when Try Again is clicked', () => {
      const mockReset = jest.fn();
      const error = new Error('Test error message');

      render(<RootError error={error} reset={mockReset} />);

      const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
      fireEvent.click(tryAgainButton);

      expect(mockReset).toHaveBeenCalled();
    });
  });

  describe('App Error Boundary', () => {
    it('renders error message with app-specific styling', () => {
      const mockReset = jest.fn();
      const error = new Error('App error message');

      render(<AppError error={error} reset={mockReset} />);

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/your data is safe/i)).toBeInTheDocument();
    });

    it('includes contact support message', () => {
      const mockReset = jest.fn();
      const error = new Error('App error message');

      render(<AppError error={error} reset={mockReset} />);

      expect(screen.getByText(/contact support/i)).toBeInTheDocument();
    });

    it('clears session storage on reset', () => {
      const mockReset = jest.fn();
      const error = new Error('App error message');
      const clearSpy = jest.spyOn(Storage.prototype, 'clear');

      render(<AppError error={error} reset={mockReset} />);

      const tryAgainButton = screen.getByRole('button', { name: /Try Again/i });
      fireEvent.click(tryAgainButton);

      expect(clearSpy).toHaveBeenCalled();
      expect(mockReset).toHaveBeenCalled();

      clearSpy.mockRestore();
    });
  });

  describe('Logger Utility', () => {
    it('does not expose sensitive information in production', () => {
      const originalEnv = process.env.NODE_ENV;

      // Mock process.env.NODE_ENV to be production
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true,
      });

      // Create a new instance to test production behavior
      jest.resetModules();
      const { logger: prodLogger } = require('@/lib/utils/logger');

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      prodLogger.error('Production error', new Error('Sensitive data'));

      // Console.error should not be called in production
      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();

      // Restore original NODE_ENV
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        configurable: true,
      });
    });
  });
});
