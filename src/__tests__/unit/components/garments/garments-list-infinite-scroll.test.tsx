import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GarmentsList from '@/app/(app)/garments/components/garments-list';
import type { GarmentListItem } from '@/lib/actions/garments-paginated';

// Mock the dependencies
jest.mock('@/components/garments/GarmentCard', () => ({
  __esModule: true,
  default: ({ garment }: { garment: any }) => (
    <div data-testid={`garment-${garment.id}`}>{garment.name}</div>
  ),
}));

// Mock IntersectionObserver (loosely typed to avoid TS complexity in tests)
const mockIntersectionObserver: any = jest.fn();
mockIntersectionObserver.mockImplementation(
  (_cb: IntersectionObserverCallback) =>
    ({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null,
      root: null,
      rootMargin: '',
      thresholds: [],
      takeRecords: () => [],
    }) as unknown as IntersectionObserver
);
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: mockIntersectionObserver,
});

describe('GarmentsList with Infinite Scroll', () => {
  const mockGarments: GarmentListItem[] = [
    {
      id: '1',
      name: 'Garment 1',
      order_id: 'order-1',
      stage: 'New',
      client_name: 'John Doe',
      created_at: '2024-01-01',
      is_done: false,
      hasCloudinaryImage: false,
      imageType: 'svg-preset',
    },
    {
      id: '2',
      name: 'Garment 2',
      order_id: 'order-2',
      stage: 'In Progress',
      client_name: 'Jane Smith',
      created_at: '2024-01-02',
      is_done: false,
      hasCloudinaryImage: false,
      imageType: 'svg-preset',
    },
  ];

  beforeEach(() => {
    mockIntersectionObserver.mockClear();
  });

  it('renders garments correctly', () => {
    render(
      <GarmentsList garments={mockGarments} isLoading={false} hasMore={false} />
    );

    expect(screen.getByTestId('garment-1')).toHaveTextContent('Garment 1');
    expect(screen.getByTestId('garment-2')).toHaveTextContent('Garment 2');
  });

  it('shows infinite scroll trigger when hasMore is true', () => {
    const onLoadMore = jest.fn();
    render(
      <GarmentsList
        garments={mockGarments}
        isLoading={false}
        hasMore={true}
        onLoadMore={onLoadMore}
      />
    );

    // IntersectionObserver should be created for the trigger
    expect(mockIntersectionObserver).toHaveBeenCalled();
  });

  it('does not show infinite scroll trigger when hasMore is false', () => {
    render(
      <GarmentsList garments={mockGarments} isLoading={false} hasMore={false} />
    );

    expect(screen.queryByText('All garments loaded')).not.toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    const onLoadMore = jest.fn();
    render(
      <GarmentsList
        garments={mockGarments}
        isLoading={true}
        hasMore={true}
        onLoadMore={onLoadMore}
      />
    );

    // There may be both a visible message and an aria-live region with the same text
    const loadingMessages = screen.getAllByText('Loading more garments...');
    expect(loadingMessages.length).toBeGreaterThan(0);
  });

  it('calls onLoadMore when intersection observer triggers', async () => {
    const onLoadMore = jest.fn();
    let observerCallback: IntersectionObserverCallback | null = null;

    mockIntersectionObserver.mockImplementation((cb: any) => {
      observerCallback = cb;
      return {
        observe: () => null,
        unobserve: () => null,
        disconnect: () => null,
      };
    });

    render(
      <GarmentsList
        garments={mockGarments}
        isLoading={false}
        hasMore={true}
        onLoadMore={onLoadMore}
      />
    );

    // Simulate intersection
    if (observerCallback) {
      (observerCallback as any)(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    }

    await waitFor(() => {
      expect(onLoadMore).toHaveBeenCalled();
    });
  });

  it('shows "No garments found" message when garments array is empty', () => {
    render(<GarmentsList garments={[]} isLoading={false} hasMore={false} />);

    expect(screen.getByText('No garments found')).toBeInTheDocument();
  });

  it('shows total count when provided and no garments', () => {
    render(
      <GarmentsList
        garments={[]}
        isLoading={false}
        hasMore={false}
        totalCount={10}
      />
    );

    expect(screen.getByText('No garments found (0/10)')).toBeInTheDocument();
  });

  it('does not call onLoadMore when isLoading is true', async () => {
    const onLoadMore = jest.fn();
    let observerCallback: IntersectionObserverCallback | null = null;

    mockIntersectionObserver.mockImplementation((cb: any) => {
      observerCallback = cb;
      return {
        observe: () => null,
        unobserve: () => null,
        disconnect: () => null,
      };
    });

    render(
      <GarmentsList
        garments={mockGarments}
        isLoading={true}
        hasMore={true}
        onLoadMore={onLoadMore}
      />
    );

    // Simulate intersection while loading
    if (observerCallback) {
      (observerCallback as any)(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    }

    await waitFor(() => {
      // Should not be called because isLoading is true
      expect(onLoadMore).not.toHaveBeenCalled();
    });
  });
});
