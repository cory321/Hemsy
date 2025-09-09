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

// Mock OrderCard component with realistic content

jest.mock('@/components/orders/OrderCardMinimal', () => ({
  __esModule: true,
  default: ({ order, onClick }: any) => {
    const clientName = order.client
      ? `${order.client.first_name} ${order.client.last_name}`.trim()
      : 'No Client';
    const garmentCount = order.garments?.length || 0;
    const statusLabel =
      order.status === 'pending'
        ? 'Pending'
        : order.status === 'paid'
          ? 'Paid'
          : order.status?.charAt(0)?.toUpperCase() + order.status?.slice(1);
    const paymentStatus =
      order.payment_status === 'pending'
        ? 'Pending'
        : order.payment_status === 'paid'
          ? 'Paid'
          : order.payment_status?.charAt(0)?.toUpperCase() +
            order.payment_status?.slice(1);

    return (
      <div
        data-testid={`order-card-${order.id}`}
        onClick={() => onClick(order.id)}
      >
        <div>#{order.order_number?.slice(-3) || order.id.slice(0, 4)}</div>
        <div>{clientName}</div>
        <div>
          {garmentCount} garment{garmentCount !== 1 ? 's' : ''}
        </div>
        <div>${(order.total_cents / 100).toFixed(2)}</div>
        <div>{statusLabel}</div>
        <div>{paymentStatus}</div>
        {order.created_at && (
          <div>
            {new Date(order.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        )}
      </div>
    );
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const mockPush = jest.fn();
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

const mockInitialData: PaginatedOrders = {
  data: [
    {
      id: 'order_1',
      shop_id: 'shop_123',
      client_id: 'client_1',
      status: 'in_progress',
      order_number: 'ORD-001',
      total_cents: 5000,
      subtotal_cents: 5000,
      discount_cents: 0,
      tax_cents: 0,
      notes: 'Test order 1',
      order_due_date: null,
      due_at: '2024-01-10T00:00:00Z',
      is_paid: false,
      paid_at: null,
      deposit_amount_cents: null,
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
      status: 'completed',
      order_number: 'ORD-002',
      total_cents: 7500,
      subtotal_cents: 7500,
      discount_cents: 0,
      tax_cents: 0,
      notes: null,
      order_due_date: null,
      due_at: '2024-01-15T00:00:00Z',
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
      expect(screen.getByText('#001')).toBeInTheDocument();
    });

    // Check if other order details are displayed
    expect(screen.getByText('#002')).toBeInTheDocument();
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
      expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Paid').length).toBeGreaterThan(0);
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
        sortBy: 'created_at',
        sortOrder: 'desc',
        includeCancelled: false,
        onlyCancelled: false,
        onlyActive: true,
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

    // Click on the payment status select dropdown
    const paymentStatusDropdown = screen.getByText('All Payment Statuses');
    await user.click(paymentStatusDropdown);

    // Select 'Paid' from the menu
    const paidOption = await screen.findByRole('option', {
      name: 'Paid',
    });
    await user.click(paidOption);

    await waitFor(() => {
      expect(mockGetOrdersAction).toHaveBeenCalledWith(1, 10, {
        search: '',
        paymentStatus: 'paid',
        sortBy: 'created_at',
        sortOrder: 'desc',
        includeCancelled: false,
        onlyCancelled: false,
        onlyActive: true,
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
        sortBy: 'created_at',
        sortOrder: 'desc',
        includeCancelled: false,
        onlyCancelled: false,
        onlyActive: true,
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
        sortBy: 'created_at',
        sortOrder: 'desc',
        includeCancelled: false,
        onlyCancelled: false,
        onlyActive: true,
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
    // Since default filter is now 'active' (not 'all'), it shows the filtered message
    await waitFor(() => {
      expect(
        screen.getByText('No orders found matching your filters')
      ).toBeInTheDocument();
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
    const dataWithoutClient: PaginatedOrders = {
      ...mockInitialData,
      data: [
        {
          id: 'order_1',
          shop_id: 'shop_123',
          client_id: 'client_1',
          status: 'in_progress',
          order_number: 'ORD-001',
          total_cents: 5000,
          subtotal_cents: 5000,
          discount_cents: 0,
          tax_cents: 0,
          notes: 'Test order 1',
          order_due_date: null,
          due_at: '2024-01-10T00:00:00Z',
          is_paid: false,
          paid_at: null,
          deposit_amount_cents: null,
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
      expect(screen.getByText('#001')).toBeInTheDocument();
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

  describe('Active Orders Filter', () => {
    it('should default to "All Active Orders" filter', async () => {
      render(
        <OrdersList
          initialData={mockInitialData}
          getOrdersAction={mockGetOrdersAction}
        />
      );

      // Check that "All Active Orders" text is displayed as the default
      expect(screen.getByText('All Active Orders')).toBeInTheDocument();
    });

    it('should show "All Active Orders" as the first option in the dropdown', async () => {
      const user = userEvent.setup();
      render(
        <OrdersList
          initialData={mockInitialData}
          getOrdersAction={mockGetOrdersAction}
        />
      );

      // Click on the order status select dropdown
      const orderStatusDropdown = screen.getByText('All Active Orders');
      await user.click(orderStatusDropdown);

      // Check that "All Active Orders" option is available
      const activeOrdersOption = await screen.findByRole('option', {
        name: 'All Active Orders',
      });
      expect(activeOrdersOption).toBeInTheDocument();

      // Check that "All Order Statuses" is no longer available
      expect(
        screen.queryByRole('option', {
          name: 'All Order Statuses',
        })
      ).not.toBeInTheDocument();
    });

    it('should filter to active orders by default', async () => {
      const user = userEvent.setup();
      render(
        <OrdersList
          initialData={mockInitialData}
          getOrdersAction={mockGetOrdersAction}
        />
      );

      // Trigger any action that would cause filtering (like search)
      const searchInput = screen.getByPlaceholderText(
        'Search by order number or notes...'
      );
      await user.type(searchInput, 'test');

      await waitFor(() => {
        expect(mockGetOrdersAction).toHaveBeenCalledWith(1, 10, {
          search: 'test',
          sortBy: 'created_at',
          sortOrder: 'desc',
          includeCancelled: false,
          onlyCancelled: false,
          onlyActive: true,
        });
      });
    });

    it('should switch to specific status when selected', async () => {
      const user = userEvent.setup();
      render(
        <OrdersList
          initialData={mockInitialData}
          getOrdersAction={mockGetOrdersAction}
        />
      );

      // Click on the order status select dropdown
      const orderStatusDropdown = screen.getByText('All Active Orders');
      await user.click(orderStatusDropdown);

      // Select 'New' from the menu
      const newStatusOption = await screen.findByRole('option', {
        name: 'New',
      });
      await user.click(newStatusOption);

      await waitFor(() => {
        expect(mockGetOrdersAction).toHaveBeenCalledWith(1, 10, {
          search: '',
          status: 'new',
          sortBy: 'created_at',
          sortOrder: 'desc',
          includeCancelled: false,
          onlyCancelled: false,
          onlyActive: false,
        });
      });
    });

    it('should handle cancelled status filter correctly', async () => {
      const user = userEvent.setup();
      render(
        <OrdersList
          initialData={mockInitialData}
          getOrdersAction={mockGetOrdersAction}
        />
      );

      // Click on the order status select dropdown
      const orderStatusDropdown = screen.getByText('All Active Orders');
      await user.click(orderStatusDropdown);

      // Select 'Cancelled' from the menu
      const cancelledOption = await screen.findByRole('option', {
        name: 'Cancelled',
      });
      await user.click(cancelledOption);

      await waitFor(() => {
        expect(mockGetOrdersAction).toHaveBeenCalledWith(1, 10, {
          search: '',
          sortBy: 'created_at',
          sortOrder: 'desc',
          includeCancelled: true,
          onlyCancelled: true,
          onlyActive: false,
        });
      });
    });
  });
});
