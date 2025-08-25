import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import OrdersList from '@/components/orders/OrdersList';
import type { PaginatedOrders } from '@/lib/actions/orders';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock debounce hook
jest.mock('@/hooks/useDebounce', () => ({
  useDebounce: (value: string) => value,
}));

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

const mockInitialData: PaginatedOrders = {
  data: [
    {
      id: 'order_1',
      shop_id: 'shop_123',
      client_id: 'client_1',
      status: 'pending',
      order_number: 'ORD-001',
      total_cents: 5000,
      subtotal_cents: 5000,
      discount_cents: 0,
      tax_cents: 0,
      notes: 'Test order 1',
      order_due_date: null,
      is_paid: false,
      paid_at: null,
      deposit_amount_cents: null,
      paid_amount_cents: null,
      payment_status: 'pending',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      client: {
        id: 'client_1',
        first_name: 'John',
        last_name: 'Doe',
      },
      garments: [{ id: 'garment_1' }, { id: 'garment_2' }],
    },
    {
      id: 'order_2',
      shop_id: 'shop_123',
      client_id: 'client_2',
      status: 'paid',
      order_number: 'ORD-002',
      total_cents: 7500,
      subtotal_cents: 7500,
      discount_cents: 0,
      tax_cents: 0,
      notes: null,
      order_due_date: null,
      is_paid: true,
      paid_at: '2024-01-02T00:00:00Z',
      deposit_amount_cents: null,
      paid_amount_cents: 7500,
      payment_status: 'paid',
      created_at: '2024-01-02T00:00:00Z',
      updated_at: '2024-01-02T00:00:00Z',
      client: {
        id: 'client_2',
        first_name: 'Jane',
        last_name: 'Smith',
      },
      garments: [{ id: 'garment_3' }],
    },
  ],
  count: 2,
  page: 1,
  pageSize: 10,
  totalPages: 1,
};

const mockGetOrdersAction = jest.fn();

describe('OrdersList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any);
    mockGetOrdersAction.mockResolvedValue(mockInitialData);
  });

  it('should render initial orders correctly', async () => {
    render(
      <OrdersList
        initialData={mockInitialData}
        getOrdersAction={mockGetOrdersAction}
      />
    );

    // Wait for the orders to be displayed (after initial load completes)
    await waitFor(() => {
      expect(screen.getByText('Order #ORD-001')).toBeInTheDocument();
    });

    // Check if other order details are displayed
    expect(screen.getByText('Order #ORD-002')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('$75.00')).toBeInTheDocument();
  });

  it('should display correct status chips', async () => {
    render(
      <OrdersList
        initialData={mockInitialData}
        getOrdersAction={mockGetOrdersAction}
      />
    );

    // Wait for the orders to be displayed
    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
    expect(screen.getByText('Paid')).toBeInTheDocument();
  });

  it('should display garment count correctly', async () => {
    render(
      <OrdersList
        initialData={mockInitialData}
        getOrdersAction={mockGetOrdersAction}
      />
    );

    // Wait for the orders to be displayed
    await waitFor(() => {
      expect(screen.getByText('2 garments')).toBeInTheDocument();
    });
    expect(screen.getByText('1 garment')).toBeInTheDocument();
  });

  it('should navigate to order detail page on card click', async () => {
    const user = userEvent.setup();
    render(
      <OrdersList
        initialData={mockInitialData}
        getOrdersAction={mockGetOrdersAction}
      />
    );

    // Wait for the orders to be displayed
    await waitFor(() => {
      expect(screen.getByTestId('order-card-order_1')).toBeInTheDocument();
    });

    // Find and click the order card
    const orderCard = screen.getByTestId('order-card-order_1');
    await user.click(orderCard);

    expect(mockPush).toHaveBeenCalledWith('/orders/order_1');
  });

  it('should handle search input', async () => {
    const user = userEvent.setup();
    render(
      <OrdersList
        initialData={mockInitialData}
        getOrdersAction={mockGetOrdersAction}
      />
    );

    const searchInput = screen.getByPlaceholderText(
      'Search by order number or notes...'
    );
    await user.type(searchInput, 'ORD-001');

    await waitFor(() => {
      expect(mockGetOrdersAction).toHaveBeenCalledWith(1, 10, {
        search: 'ORD-001',
        status: undefined,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
    });
  });

  it('should handle status filter change', async () => {
    const user = userEvent.setup();
    render(
      <OrdersList
        initialData={mockInitialData}
        getOrdersAction={mockGetOrdersAction}
      />
    );

    // Click on the status select dropdown - it doesn't have an accessible name, so find by text
    const statusDropdown = screen.getByText('All Statuses');
    await user.click(statusDropdown);

    // Select 'Paid' from the menu
    const paidOption = await screen.findByRole('option', {
      name: 'Paid',
    });
    await user.click(paidOption);

    await waitFor(() => {
      expect(mockGetOrdersAction).toHaveBeenCalledWith(1, 10, {
        search: '',
        status: 'paid',
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
    });
  });

  it('should handle pagination page change', async () => {
    const multiPageData = { ...mockInitialData, count: 50, totalPages: 5 };
    render(
      <OrdersList
        initialData={multiPageData}
        getOrdersAction={mockGetOrdersAction}
      />
    );

    const nextPageButton = screen.getByRole('button', { name: /next page/i });
    fireEvent.click(nextPageButton);

    await waitFor(() => {
      expect(mockGetOrdersAction).toHaveBeenCalledWith(2, 10, {
        search: '',
        status: undefined,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
    });
  });

  it('should handle rows per page change', async () => {
    const user = userEvent.setup();
    render(
      <OrdersList
        initialData={mockInitialData}
        getOrdersAction={mockGetOrdersAction}
      />
    );

    // Find and click the rows per page dropdown (MUI TablePagination)
    const rowsPerPageButton = screen.getByRole('combobox', {
      name: 'Rows per page:',
    });
    await user.click(rowsPerPageButton);

    // Click on the 25 option in the menu
    const option25 = await screen.findByRole('option', { name: '25' });
    await user.click(option25);

    await waitFor(() => {
      expect(mockGetOrdersAction).toHaveBeenCalledWith(1, 25, {
        search: '',
        status: undefined,
        sortBy: 'created_at',
        sortOrder: 'desc',
      });
    });
  });

  it('should display loading state', async () => {
    // Mock slow response
    mockGetOrdersAction.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockInitialData), 100)
        )
    );

    render(
      <OrdersList
        initialData={mockInitialData}
        getOrdersAction={mockGetOrdersAction}
      />
    );

    // Trigger a search to cause loading
    const searchInput = screen.getByPlaceholderText(
      'Search by order number or notes...'
    );
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Should show loading state (skeletons are rendered)
    await waitFor(() => {
      // MUI Skeleton components may not have a progressbar role
      // Check for skeleton class instead
      const skeletons = document.querySelectorAll('.MuiSkeleton-root');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  it('should display error state', async () => {
    mockGetOrdersAction.mockRejectedValue(new Error('Failed to fetch orders'));

    render(
      <OrdersList
        initialData={mockInitialData}
        getOrdersAction={mockGetOrdersAction}
      />
    );

    // Trigger a search to cause error
    const searchInput = screen.getByPlaceholderText(
      'Search by order number or notes...'
    );
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch orders')).toBeInTheDocument();
    });
  });

  it('should display empty state with no search', async () => {
    const emptyData = { ...mockInitialData, data: [], count: 0 };
    mockGetOrdersAction.mockResolvedValue(emptyData);
    render(
      <OrdersList
        initialData={emptyData}
        getOrdersAction={mockGetOrdersAction}
      />
    );

    // Wait for the empty state message to appear
    await waitFor(() => {
      expect(screen.getByText('No orders yet')).toBeInTheDocument();
    });
  });

  it('should display empty state with search', async () => {
    const user = userEvent.setup();
    const emptyData = { ...mockInitialData, data: [], count: 0 };
    mockGetOrdersAction.mockResolvedValue(emptyData);

    render(
      <OrdersList
        initialData={mockInitialData}
        getOrdersAction={mockGetOrdersAction}
      />
    );

    const searchInput = screen.getByPlaceholderText(
      'Search by order number or notes...'
    );
    await user.type(searchInput, 'nonexistent');

    await waitFor(() => {
      expect(
        screen.getByText('No orders found matching your filters')
      ).toBeInTheDocument();
    });
  });

  it('should handle orders without client info', async () => {
    const dataWithoutClient = {
      ...mockInitialData,
      data: [
        {
          id: 'order_1',
          shop_id: 'shop_123',
          client_id: 'client_1',
          status: 'pending',
          order_number: 'ORD-001',
          total_cents: 5000,
          subtotal_cents: 5000,
          discount_cents: 0,
          tax_cents: 0,
          notes: 'Test order 1',
          order_due_date: null,
          is_paid: false,
          paid_at: null,
          deposit_amount_cents: null,
          paid_amount_cents: null,
          payment_status: 'pending',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          client: null,
          garments: [{ id: 'garment_1' }, { id: 'garment_2' }],
        },
      ],
    };

    mockGetOrdersAction.mockResolvedValue(dataWithoutClient);

    render(
      <OrdersList
        initialData={dataWithoutClient}
        getOrdersAction={mockGetOrdersAction}
      />
    );

    // Wait for the 'No Client' text to appear
    await waitFor(() => {
      expect(screen.getByText('No Client')).toBeInTheDocument();
    });
  });

  it('should format dates correctly', async () => {
    render(
      <OrdersList
        initialData={mockInitialData}
        getOrdersAction={mockGetOrdersAction}
      />
    );

    // Wait for orders to be displayed
    await waitFor(() => {
      expect(screen.getByText('Order #ORD-001')).toBeInTheDocument();
    });

    // Check that dates are formatted correctly (e.g., "Jan 1, 2024" format)
    const dateElements = screen.getAllByText(/Jan \d+, 2024/);
    expect(dateElements.length).toBeGreaterThan(0);

    // Verify the date format matches expected pattern
    dateElements.forEach((element) => {
      expect(element.textContent).toMatch(
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{1,2}, \d{4}$/
      );
    });
  });
});
