import React from 'react';
import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/nextjs';
import GarmentsPage from '@/app/(app)/garments/page';
import { useGarmentsSearch } from '@/lib/queries/garment-queries';
import { getCurrentUserShop } from '@/lib/actions/shops';

// Mock dependencies
jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useAuth: () => ({ userId: 'test-user-id' }),
  useUser: () => ({ user: { id: 'test-user-id' } }),
}));

jest.mock('@/lib/queries/garment-queries');
jest.mock('@/lib/actions/shops');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

const mockGarments = [
  {
    id: '1',
    name: 'Wedding Dress',
    order_id: 'order-1',
    stage: 'New',
    stage_name: 'New',
    client_name: 'Alice Johnson',
    client_first_name: 'Alice',
    client_last_name: 'Johnson',
    created_at: '2024-01-01T00:00:00Z',
    is_done: false,
    services: [],
    hasCloudinaryImage: false,
    imageType: 'svg-preset' as const,
  },
  {
    id: '2',
    name: 'Suit Alteration',
    order_id: 'order-2',
    stage: 'In Progress',
    stage_name: 'In Progress',
    client_name: 'Bob Smith',
    client_first_name: 'Bob',
    client_last_name: 'Smith',
    created_at: '2024-01-02T00:00:00Z',
    is_done: false,
    services: [],
    hasCloudinaryImage: false,
    imageType: 'svg-preset' as const,
  },
  {
    id: '3',
    name: 'Dress Hemming',
    order_id: 'order-3',
    stage: 'New',
    stage_name: 'New',
    client_name: 'Alice Johnson',
    client_first_name: 'Alice',
    client_last_name: 'Johnson',
    created_at: '2024-01-03T00:00:00Z',
    is_done: false,
    services: [],
    hasCloudinaryImage: false,
    imageType: 'svg-preset' as const,
  },
  {
    id: '4',
    name: 'Jacket Repair',
    order_id: 'order-4',
    stage: 'Done',
    stage_name: 'Done',
    client_name: 'Charlie Brown',
    client_first_name: 'Charlie',
    client_last_name: 'Brown',
    created_at: '2024-01-04T00:00:00Z',
    is_done: true,
    services: [],
    hasCloudinaryImage: false,
    imageType: 'svg-preset' as const,
  },
];

describe('Garments Client Name Grouping', () => {
  let queryClient: QueryClient;
  const user = userEvent.setup();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Mock shop data
    (getCurrentUserShop as jest.Mock).mockResolvedValue({
      id: 'test-shop-id',
      name: 'Test Shop',
    });

    // Mock the garments search hook
    (useGarmentsSearch as jest.Mock).mockReturnValue({
      garments: mockGarments,
      totalCount: mockGarments.length,
      stageCounts: {
        New: 2,
        'In Progress': 1,
        'Ready For Pickup': 0,
        Done: 1,
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      search: '',
      setSearch: jest.fn(),
      filters: {},
      setFilters: jest.fn(),
      prefetchNextPage: jest.fn(),
    });
  });

  const renderPage = async () => {
    let result;
    await act(async () => {
      result = render(
        <QueryClientProvider client={queryClient}>
          <ClerkProvider>
            <GarmentsPage />
          </ClerkProvider>
        </QueryClientProvider>
      );
    });

    // Wait for initial loading to complete
    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    return result!;
  };

  test('should display client name headers when sorting by client name', async () => {
    const { container } = await renderPage();

    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByText('All Garments')).toBeInTheDocument();
    });

    // Find the Sort By dropdown by its role and content
    const sortDropdownButton = screen.getByRole('combobox');
    await user.click(sortDropdownButton);

    const clientNameOption = await screen.findByRole('option', {
      name: 'Client Name',
    });
    await user.click(clientNameOption);

    // Wait for re-render with grouping
    await waitFor(() => {
      // Check for client name headers - look specifically for h2 elements
      const headers = screen.getAllByRole('heading', { level: 2 });
      const headerTexts = headers.map((h) => h.textContent);
      expect(headerTexts).toContain('Alice Johnson');
      expect(headerTexts).toContain('Bob Smith');
      expect(headerTexts).toContain('Charlie Brown');
    });

    // Check that Alice Johnson has 2 garments
    const aliceHeaders = screen.getAllByText('Alice Johnson');
    const aliceHeader = aliceHeaders.find((el) => el.tagName === 'H2');
    expect(aliceHeader).toBeTruthy();
    const aliceHeaderParent = aliceHeader!.parentElement;
    expect(
      within(aliceHeaderParent!).getByText('(2 garments)')
    ).toBeInTheDocument();

    // Check that Bob Smith has 1 garment
    const bobHeaders = screen.getAllByText('Bob Smith');
    const bobHeader = bobHeaders.find((el) => el.tagName === 'H2');
    expect(bobHeader).toBeTruthy();
    const bobHeaderParent = bobHeader!.parentElement;
    expect(
      within(bobHeaderParent!).getByText('(1 garment)')
    ).toBeInTheDocument();

    // Verify garments are displayed under correct headers
    const garmentCards = screen.getAllByTestId('garment-card');
    expect(garmentCards).toHaveLength(4);
  });

  test('should not display client headers when sorting by other fields', async () => {
    await renderPage();

    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByText('All Garments')).toBeInTheDocument();
    });

    // By default, it should be sorted by due date (no client headers)
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Alice Johnson' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Bob Smith' })
    ).not.toBeInTheDocument();

    // Verify garments are still displayed
    const garmentCards = screen.getAllByTestId('garment-card');
    expect(garmentCards).toHaveLength(4);
  });

  test('should update grouping order when toggling sort order', async () => {
    await renderPage();

    // Wait for the page to load
    await waitFor(() => {
      expect(screen.getByText('All Garments')).toBeInTheDocument();
    });

    // Sort by client name
    const sortDropdownButton = screen.getByRole('combobox');
    await user.click(sortDropdownButton);

    const clientNameOption = await screen.findByRole('option', {
      name: 'Client Name',
    });
    await user.click(clientNameOption);

    // Wait for grouping to appear
    await waitFor(() => {
      const headers = screen.getAllByRole('heading', { level: 2 });
      const headerTexts = headers.map((h) => h.textContent);
      expect(headerTexts.length).toBeGreaterThan(0);
      expect(headerTexts).toContain('Alice Johnson');
    });

    // Get all client name headers
    const clientHeaders = screen.getAllByRole('heading', { level: 2 });
    const initialOrder = clientHeaders.map((h) => h.textContent);

    // Toggle sort order
    const sortToggle = screen.getByLabelText(/Ascending|Descending/);
    await user.click(sortToggle);

    // Verify order has changed
    await waitFor(() => {
      const newHeaders = screen.getAllByRole('heading', { level: 2 });
      const newOrder = newHeaders.map((h) => h.textContent);

      expect(newOrder).not.toEqual(initialOrder);
      expect(newOrder).toEqual(initialOrder.reverse());
    });
  });

  test('should handle empty client names as "Unknown Client"', async () => {
    // Update mock data to include garment without client name
    const garmentsWithUnknown = [
      ...mockGarments,
      {
        id: '5',
        name: 'Anonymous Garment',
        order_id: 'order-5',
        stage: 'New',
        stage_name: 'New',
        client_name: undefined,
        created_at: '2024-01-05T00:00:00Z',
        is_done: false,
        services: [],
        hasCloudinaryImage: false,
        imageType: 'svg-preset' as const,
      },
    ];

    (useGarmentsSearch as jest.Mock).mockReturnValue({
      garments: garmentsWithUnknown,
      totalCount: garmentsWithUnknown.length,
      stageCounts: {
        New: 3,
        'In Progress': 1,
        'Ready For Pickup': 0,
        Done: 1,
      },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
      search: '',
      setSearch: jest.fn(),
      filters: {},
      setFilters: jest.fn(),
      prefetchNextPage: jest.fn(),
    });

    await renderPage();

    // Sort by client name
    const sortDropdownButton = screen.getByRole('combobox');
    await user.click(sortDropdownButton);

    const clientNameOption = await screen.findByRole('option', {
      name: 'Client Name',
    });
    await user.click(clientNameOption);

    // Wait for grouping
    await waitFor(() => {
      expect(screen.getByText('Unknown Client')).toBeInTheDocument();
    });

    // Verify the Unknown Client has 1 garment
    const unknownHeader = screen.getByText('Unknown Client').parentElement;
    expect(within(unknownHeader!).getByText('(1 garment)')).toBeInTheDocument();
  });
});
