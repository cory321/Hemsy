import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import GarmentsClient from '@/app/(app)/garments/garments-client';
import { loadMoreGarments } from '@/lib/actions/garments-load-more';
import type { PaginatedGarmentsResponse } from '@/lib/actions/garments-paginated';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock child components
jest.mock('@/app/(app)/garments/components/search-bar', () => ({
  __esModule: true,
  default: ({ value, onChange }: any) => (
    <input
      data-testid="search-bar"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

jest.mock('@/components/garments/StageBox', () => ({
  __esModule: true,
  default: ({ stage, onClick }: any) => (
    <button data-testid={`stage-${stage.name}`} onClick={onClick}>
      {stage.name} ({stage.count})
    </button>
  ),
}));

jest.mock('@/components/garments/GarmentCard', () => ({
  __esModule: true,
  default: ({ garment }: any) => (
    <div data-testid={`garment-${garment.id}`}>
      {garment.name} - {garment.client_name}
    </div>
  ),
}));

// Mock server actions
jest.mock('@/app/(app)/garments/actions/update-garment', () => ({
  updateGarmentStage: jest.fn(),
}));

jest.mock('@/lib/actions/garments-load-more', () => ({
  __esModule: true,
  loadMoreGarments: jest.fn(async () => ({
    garments: [
      {
        id: '3',
        name: 'Coat 1',
        order_id: 'order-3',
        stage: 'New',
        client_name: 'Cathy',
        created_at: '2024-01-03',
        is_done: false,
        hasCloudinaryImage: false,
        imageType: 'svg-preset',
      },
    ],
    nextCursor: { lastId: '3', lastCreatedAt: '2024-01-03' },
    hasMore: true,
  })),
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

describe('GarmentsClient with Infinite Scroll', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockRefresh = jest.fn();

  const mockInitialData: PaginatedGarmentsResponse = {
    garments: [
      {
        id: '1',
        name: 'Dress 1',
        order_id: 'order-1',
        stage: 'New',
        client_name: 'Alice Johnson',
        created_at: '2024-01-01',
        is_done: false,
        hasCloudinaryImage: false,
        imageType: 'svg-preset',
      },
      {
        id: '2',
        name: 'Suit 1',
        order_id: 'order-2',
        stage: 'In Progress',
        client_name: 'Bob Smith',
        created_at: '2024-01-02',
        is_done: false,
        hasCloudinaryImage: false,
        imageType: 'svg-preset',
      },
    ],
    nextCursor: {
      lastId: '2',
      lastCreatedAt: '2024-01-02',
    },
    hasMore: true,
    totalCount: 10,
  };

  const mockStageCounts = {
    New: 5,
    'In Progress': 3,
    'Ready For Pickup': 1,
    Done: 1,
  };

  beforeEach(() => {
    mockIntersectionObserver.mockClear();
    mockPush.mockClear();
    mockReplace.mockClear();
    mockRefresh.mockClear();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      refresh: mockRefresh,
    });

    (usePathname as jest.Mock).mockReturnValue('/garments');

    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });

  it('sets up infinite scroll when hasMore is true', () => {
    render(
      <GarmentsClient
        initialData={mockInitialData}
        stageCounts={mockStageCounts}
        shopId="shop-123"
        initialFilters={{
          sortField: 'created_at',
          sortOrder: 'desc',
        }}
      />
    );

    // Check that garments are rendered
    expect(screen.getByTestId('garment-1')).toBeInTheDocument();
    expect(screen.getByTestId('garment-2')).toBeInTheDocument();

    // IntersectionObserver should be created for infinite scroll
    expect(mockIntersectionObserver).toHaveBeenCalled();
  });

  it('triggers load more when scrolling near bottom', async () => {
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
      <GarmentsClient
        initialData={mockInitialData}
        stageCounts={mockStageCounts}
        shopId="shop-123"
        initialFilters={{
          sortField: 'created_at',
          sortOrder: 'desc',
        }}
      />
    );

    // Simulate scrolling to trigger intersection
    if (observerCallback) {
      (observerCallback as any)(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    }

    // Should not update URL with cursor parameter anymore
    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalledWith(
        expect.stringContaining('cursor=')
      );
    });
  });

  it('maintains filters when loading more via infinite scroll', async () => {
    const searchParams = new URLSearchParams({
      stage: 'new',
      search: 'dress',
      sort: 'due_date',
      order: 'asc',
    });

    (useSearchParams as jest.Mock).mockReturnValue(searchParams);

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
      <GarmentsClient
        initialData={mockInitialData}
        stageCounts={mockStageCounts}
        shopId="shop-123"
        initialFilters={{
          stage: 'New',
          search: 'dress',
          sortField: 'due_date',
          sortOrder: 'asc',
        }}
      />
    );

    // Simulate scrolling
    if (observerCallback) {
      (observerCallback as any)(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver
      );
    }

    await waitFor(() => {
      // loadMoreGarments should be called with correct params
      expect(loadMoreGarments).toHaveBeenCalledWith(
        expect.objectContaining({
          shopId: 'shop-123',
          stage: 'New',
          search: 'dress',
          sortField: 'due_date',
          sortOrder: 'asc',
        })
      );
    });
  });

  it('works with client-grouped view', () => {
    const groupedData: PaginatedGarmentsResponse = {
      ...mockInitialData,
      garments: [
        {
          id: '1',
          name: 'Dress 1',
          order_id: 'order-1',
          stage: 'New',
          client_name: 'Alice Johnson',
          created_at: '2024-01-01',
          is_done: false,
          hasCloudinaryImage: false,
          imageType: 'svg-preset',
        },
        {
          id: '2',
          name: 'Dress 2',
          order_id: 'order-2',
          stage: 'In Progress',
          client_name: 'Alice Johnson',
          created_at: '2024-01-02',
          is_done: false,
          hasCloudinaryImage: false,
          imageType: 'svg-preset',
        },
      ],
    };

    render(
      <GarmentsClient
        initialData={groupedData}
        stageCounts={mockStageCounts}
        shopId="shop-123"
        initialFilters={{
          sortField: 'client_name',
          sortOrder: 'asc',
        }}
      />
    );

    // Check that client grouping header is shown
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('(2 garments)')).toBeInTheDocument();

    // IntersectionObserver should still be created for grouped view
    expect(mockIntersectionObserver).toHaveBeenCalled();
  });

  it('does not set up infinite scroll when hasMore is false', () => {
    const dataWithNoMore: PaginatedGarmentsResponse = {
      ...mockInitialData,
      hasMore: false,
      nextCursor: null,
    };

    render(
      <GarmentsClient
        initialData={dataWithNoMore}
        stageCounts={mockStageCounts}
        shopId="shop-123"
        initialFilters={{
          sortField: 'created_at',
          sortOrder: 'desc',
        }}
      />
    );

    // IntersectionObserver might be called for other purposes,
    // but there should be no load more functionality
    expect(screen.queryByText('Load more garments')).not.toBeInTheDocument();
  });

  it('resets cursor when changing filters', async () => {
    const user = userEvent.setup();

    // Start with a cursor in the URL so that changing filters will remove it
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams('stage=new&cursor=1')
    );

    render(
      <GarmentsClient
        initialData={mockInitialData}
        stageCounts={mockStageCounts}
        shopId="shop-123"
        initialFilters={{
          sortField: 'created_at',
          sortOrder: 'desc',
        }}
      />
    );

    // Click on a stage filter (View All)
    const newStageButton = screen.getByTestId('stage-View All');
    await user.click(newStageButton);

    await waitFor(() => {
      const replacedUrl = mockReplace.mock.calls[0][0];
      // Should not include cursor when changing filters
      expect(replacedUrl).not.toContain('cursor=');
    });
  });
});
