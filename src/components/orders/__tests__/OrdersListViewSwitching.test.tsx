import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrdersList from '../OrdersList';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

const theme = createTheme();

const mockInitialData = {
  data: [
    {
      id: 'order-1',
      order_number: '2024-001',
      status: 'partially_paid',
      order_due_date: new Date(
        Date.now() + 2 * 24 * 60 * 60 * 1000
      ).toISOString(),
      total_cents: 50000,
      subtotal_cents: 45000,
      tax_cents: 5000,
      discount_cents: 0,
      deposit_amount_cents: null,
      paid_amount_cents: 25000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      client_id: 'client-1',
      shop_id: 'shop-1',
      user_id: 'user-1',
      is_paid: false,
      paid_at: null,
      notes: null,
      payment_status: 'partially_paid',
      client: {
        id: 'client-1',
        first_name: 'Jane',
        last_name: 'Doe',
        phone_number: '5551234567',
      },
      garments: [
        { id: 'g1', name: 'Dress', stage: 'Ready For Pickup' },
        { id: 'g2', name: 'Suit', stage: 'Sewing' },
      ],
    },
    {
      id: 'order-2',
      order_number: '2024-002',
      status: 'paid',
      order_due_date: new Date(
        Date.now() + 5 * 24 * 60 * 60 * 1000
      ).toISOString(),
      total_cents: 75000,
      subtotal_cents: 70000,
      tax_cents: 5000,
      discount_cents: 0,
      deposit_amount_cents: null,
      paid_amount_cents: 75000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      client_id: 'client-2',
      shop_id: 'shop-1',
      user_id: 'user-1',
      is_paid: true,
      paid_at: new Date().toISOString(),
      notes: null,
      payment_status: 'paid',
      client: {
        id: 'client-2',
        first_name: 'John',
        last_name: 'Smith',
        phone_number: '5559876543',
      },
      garments: [{ id: 'g3', name: 'Jacket', stage: 'Completed' }],
    },
  ],
  page: 1,
  pageSize: 10,
  count: 2,
  totalPages: 1,
  hasMore: false,
};

const mockGetOrdersAction = jest.fn().mockResolvedValue(mockInitialData);

describe('OrdersList View Switching', () => {
  beforeEach(() => {
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockGetOrdersAction.mockClear();
  });

  it('renders with default compact view', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrdersList
          initialData={mockInitialData}
          getOrdersAction={mockGetOrdersAction}
        />
      </ThemeProvider>
    );

    // Check for view toggle buttons
    expect(screen.getByLabelText('minimal view')).toBeInTheDocument();
    expect(screen.getByLabelText('compact view')).toBeInTheDocument();
    expect(screen.getByLabelText('detailed view')).toBeInTheDocument();

    // Compact view should be selected by default
    const compactButton = screen.getByLabelText('compact view');
    expect(compactButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('loads saved view preference from localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue('detailed');

    render(
      <ThemeProvider theme={theme}>
        <OrdersList
          initialData={mockInitialData}
          getOrdersAction={mockGetOrdersAction}
        />
      </ThemeProvider>
    );

    // Should load detailed view
    const detailedButton = screen.getByLabelText('detailed view');
    expect(detailedButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('switches to minimal view when clicked', async () => {
    render(
      <ThemeProvider theme={theme}>
        <OrdersList
          initialData={mockInitialData}
          getOrdersAction={mockGetOrdersAction}
        />
      </ThemeProvider>
    );

    const minimalButton = screen.getByLabelText('minimal view');
    fireEvent.click(minimalButton);

    await waitFor(() => {
      expect(minimalButton).toHaveAttribute('aria-pressed', 'true');
    });

    // Check localStorage was updated
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'orderListViewMode',
      'minimal'
    );

    // Check for minimal view specific elements (compact layout)
    expect(screen.getByText('#001')).toBeInTheDocument(); // Shortened order number
  });

  it('switches to detailed view when clicked', async () => {
    render(
      <ThemeProvider theme={theme}>
        <OrdersList
          initialData={mockInitialData}
          getOrdersAction={mockGetOrdersAction}
        />
      </ThemeProvider>
    );

    const detailedButton = screen.getByLabelText('detailed view');
    fireEvent.click(detailedButton);

    await waitFor(() => {
      expect(detailedButton).toHaveAttribute('aria-pressed', 'true');
    });

    // Check localStorage was updated
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'orderListViewMode',
      'detailed'
    );

    // Check for detailed view specific elements
    expect(screen.getByText('ORDER #2024-001')).toBeInTheDocument(); // Full order header
    expect(screen.getByText('PAYMENT')).toBeInTheDocument(); // Payment section
  });

  it('maintains view mode when data is refreshed', async () => {
    const { rerender } = render(
      <ThemeProvider theme={theme}>
        <OrdersList
          initialData={mockInitialData}
          getOrdersAction={mockGetOrdersAction}
        />
      </ThemeProvider>
    );

    // Switch to minimal view
    const minimalButton = screen.getByLabelText('minimal view');
    fireEvent.click(minimalButton);

    await waitFor(() => {
      expect(minimalButton).toHaveAttribute('aria-pressed', 'true');
    });

    // Simulate data refresh by changing search
    const searchInput = screen.getByPlaceholderText(
      'Search by order number or notes...'
    );
    fireEvent.change(searchInput, { target: { value: 'test' } });

    // Wait for debounce and data fetch
    await waitFor(
      () => {
        expect(mockGetOrdersAction).toHaveBeenCalled();
      },
      { timeout: 1000 }
    );

    // View mode should still be minimal
    expect(minimalButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('handles invalid localStorage value gracefully', () => {
    mockLocalStorage.getItem.mockReturnValue('invalid-view-mode');

    render(
      <ThemeProvider theme={theme}>
        <OrdersList
          initialData={mockInitialData}
          getOrdersAction={mockGetOrdersAction}
        />
      </ThemeProvider>
    );

    // Should fall back to default compact view
    const compactButton = screen.getByLabelText('compact view');
    expect(compactButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders different card components based on view mode', async () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <OrdersList
          initialData={mockInitialData}
          getOrdersAction={mockGetOrdersAction}
        />
      </ThemeProvider>
    );

    // Default compact view - check for phone icon (specific to compact)
    expect(screen.getAllByTestId('PhoneIcon').length).toBeGreaterThan(0);

    // Switch to minimal view
    const minimalButton = screen.getByLabelText('minimal view');
    fireEvent.click(minimalButton);

    await waitFor(() => {
      // Minimal view has more compact layout
      expect(screen.getByText('#001')).toBeInTheDocument();
    });

    // Switch to detailed view
    const detailedButton = screen.getByLabelText('detailed view');
    fireEvent.click(detailedButton);

    await waitFor(() => {
      // Detailed view has full order headers
      expect(screen.getByText('ORDER #2024-001')).toBeInTheDocument();
    });
  });

  it('preserves other filters when switching views', async () => {
    render(
      <ThemeProvider theme={theme}>
        <OrdersList
          initialData={mockInitialData}
          getOrdersAction={mockGetOrdersAction}
        />
      </ThemeProvider>
    );

    // Set a status filter
    const statusSelect = screen.getByLabelText('Status');
    fireEvent.mouseDown(statusSelect);
    const paidOption = screen.getByRole('option', { name: 'Paid' });
    fireEvent.click(paidOption);

    // Switch view mode
    const minimalButton = screen.getByLabelText('minimal view');
    fireEvent.click(minimalButton);

    await waitFor(() => {
      expect(minimalButton).toHaveAttribute('aria-pressed', 'true');
    });

    // Status filter should still be applied
    expect(statusSelect).toHaveTextContent('Paid');
  });

  it('shows tooltips on view toggle buttons', async () => {
    render(
      <ThemeProvider theme={theme}>
        <OrdersList
          initialData={mockInitialData}
          getOrdersAction={mockGetOrdersAction}
        />
      </ThemeProvider>
    );

    // Hover over minimal view button to show tooltip
    const minimalButton = screen.getByLabelText('minimal view');
    fireEvent.mouseEnter(minimalButton);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('Minimal View');
    });
  });
});
