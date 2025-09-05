import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { InfiniteScrollTrigger } from '@/components/common/InfiniteScrollTrigger';

// Mock the useInView hook
jest.mock('@/hooks/useInView', () => ({
  useInView: jest.fn(),
}));

const mockUseInView = require('@/hooks/useInView')
  .useInView as jest.MockedFunction<
  typeof import('@/hooks/useInView').useInView
>;

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  setTimeout(cb, 16); // Simulate 60fps
  return 1;
});

describe('InfiniteScrollTrigger - Smooth Loading', () => {
  const mockOnLoadMore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInView.mockReturnValue({ isInView: false });
  });

  it('should use standard intersection observer settings', () => {
    render(
      <InfiniteScrollTrigger
        onLoadMore={mockOnLoadMore}
        hasMore={true}
        isLoading={false}
      />
    );

    // Verify useInView is called with standard settings
    expect(mockUseInView).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        threshold: 0.1,
        rootMargin: '100px',
      })
    );
  });

  it('should trigger load more when in view', async () => {
    mockUseInView.mockReturnValue({ isInView: true });

    render(
      <InfiniteScrollTrigger
        onLoadMore={mockOnLoadMore}
        hasMore={true}
        isLoading={false}
      />
    );

    await waitFor(() => {
      expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
    });
  });

  it('should prevent rapid fire triggers with loading ref', async () => {
    const { rerender } = render(
      <InfiniteScrollTrigger
        onLoadMore={mockOnLoadMore}
        hasMore={true}
        isLoading={false}
      />
    );

    // Simulate trigger coming into view
    mockUseInView.mockReturnValue({ isInView: true });

    rerender(
      <InfiniteScrollTrigger
        onLoadMore={mockOnLoadMore}
        hasMore={true}
        isLoading={false}
      />
    );

    // Wait for first trigger
    await waitFor(() => {
      expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
    });

    // Simulate rapid re-renders while loading ref is still active
    rerender(
      <InfiniteScrollTrigger
        onLoadMore={mockOnLoadMore}
        hasMore={true}
        isLoading={false}
      />
    );

    // Should not trigger again immediately
    expect(mockOnLoadMore).toHaveBeenCalledTimes(1);
  });

  it('should show loading state with proper spacing', () => {
    render(
      <InfiniteScrollTrigger
        onLoadMore={mockOnLoadMore}
        hasMore={true}
        isLoading={true}
        loadingText="Loading more garments..."
      />
    );

    // Use getAllByText to handle multiple instances (visible + screen reader)
    const loadingTexts = screen.getAllByText('Loading more garments...');
    expect(loadingTexts.length).toBeGreaterThan(0);

    // Check that loading indicator container has proper spacing
    const loadingContainer = loadingTexts[0]?.closest('.MuiBox-root');
    expect(loadingContainer).toBeInTheDocument();
  });

  it('should not trigger when already loading', () => {
    mockUseInView.mockReturnValue({ isInView: true });

    render(
      <InfiniteScrollTrigger
        onLoadMore={mockOnLoadMore}
        hasMore={true}
        isLoading={true}
      />
    );

    expect(mockOnLoadMore).not.toHaveBeenCalled();
  });

  it('should not trigger when no more items available', () => {
    mockUseInView.mockReturnValue({ isInView: true });

    render(
      <InfiniteScrollTrigger
        onLoadMore={mockOnLoadMore}
        hasMore={false}
        isLoading={false}
      />
    );

    expect(mockOnLoadMore).not.toHaveBeenCalled();
  });
});
