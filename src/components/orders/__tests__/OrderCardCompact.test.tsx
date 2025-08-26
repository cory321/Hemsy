import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderCardCompact from '../OrderCardCompact';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const mockOrder = {
  id: 'order-123',
  order_number: '2024-001',
  status: 'partially_paid',
  order_due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
  total_cents: 85000,
  paid_amount_cents: 45000,
  created_at: new Date().toISOString(),
  client: {
    id: 'client-456',
    first_name: 'Sarah',
    last_name: 'Johnson',
    phone_number: '5551234567',
    email: 'sarah@example.com',
  },
  garments: [
    { id: 'g1', name: 'Wedding Dress', stage: 'Ready For Pickup' },
    { id: 'g2', name: 'Bridesmaid Dress', stage: 'Sewing' },
    { id: 'g3', name: 'Evening Gown', stage: 'Fitting' },
  ],
};

const mockOrderOverdue = {
  ...mockOrder,
  id: 'order-overdue',
  order_due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
};

const mockOrderDueToday = {
  ...mockOrder,
  id: 'order-today',
  order_due_date: new Date().toISOString(),
};

const mockOrderPaid = {
  ...mockOrder,
  id: 'order-paid',
  status: 'paid',
  paid_amount_cents: 85000,
};

const mockOrderNoGarments = {
  ...mockOrder,
  id: 'order-nogarments',
  garments: [],
};

describe('OrderCardCompact', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders order header information correctly', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardCompact order={mockOrder} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Check order number
    expect(screen.getByText('#2024-001')).toBeInTheDocument();

    // Check urgency banner
    expect(screen.getByText('DUE IN 2 DAYS')).toBeInTheDocument();
  });

  it('renders client information with phone number', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardCompact order={mockOrder} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Check client name
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();

    // Check formatted phone number
    expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
  });

  it('displays garment status correctly', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardCompact order={mockOrder} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Check garment count
    expect(screen.getByText('3 garments')).toBeInTheDocument();

    // Check ready and in progress counts
    expect(screen.getByText('1 ready')).toBeInTheDocument();
    expect(screen.getByText('2 in progress')).toBeInTheDocument();
  });

  it('displays payment information and progress', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardCompact order={mockOrder} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Check payment amounts
    expect(screen.getByText('$450/$850')).toBeInTheDocument();

    // Check payment status (>50% paid shows MOSTLY PAID)
    expect(screen.getByText('PARTIAL PAID')).toBeInTheDocument();

    // Check amount due
    expect(screen.getByText('$400 due')).toBeInTheDocument();
  });

  it('shows overdue banner with error styling', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardCompact order={mockOrderOverdue} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Check for overdue banner
    expect(screen.getByText('3 DAYS OVERDUE')).toBeInTheDocument();
  });

  it('shows due today banner', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardCompact order={mockOrderDueToday} onClick={mockOnClick} />
      </ThemeProvider>
    );

    expect(screen.getByText('DUE TODAY')).toBeInTheDocument();
  });

  it('displays paid in full status correctly', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardCompact order={mockOrderPaid} onClick={mockOnClick} />
      </ThemeProvider>
    );

    expect(screen.getByText('PAID IN FULL')).toBeInTheDocument();
    // Should not show "due" amount when fully paid
    expect(screen.queryByText(/due/)).not.toBeInTheDocument();
  });

  it('handles empty garments array', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardCompact order={mockOrderNoGarments} onClick={mockOnClick} />
      </ThemeProvider>
    );

    expect(screen.getByText('0 garments')).toBeInTheDocument();
    // Should not show ready or in progress chips
    expect(screen.queryByText(/ready/)).not.toBeInTheDocument();
    expect(screen.queryByText(/in progress/)).not.toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardCompact order={mockOrder} onClick={mockOnClick} />
      </ThemeProvider>
    );

    const card = screen.getByRole('article').parentElement;
    fireEvent.click(card!);

    expect(mockOnClick).toHaveBeenCalledWith('order-123');
  });

  it('handles missing client phone gracefully', () => {
    const orderNoPhone = {
      ...mockOrder,
      client: {
        ...mockOrder.client,
        phone_number: null,
      },
    };

    render(
      <ThemeProvider theme={theme}>
        <OrderCardCompact order={orderNoPhone} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Should show name but not phone
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.queryByText(/555/)).not.toBeInTheDocument();
  });

  it('shows correct payment status for mostly paid orders', () => {
    const orderMostlyPaid = {
      ...mockOrder,
      paid_amount_cents: 70000, // More than 50% of 85000
    };

    render(
      <ThemeProvider theme={theme}>
        <OrderCardCompact order={orderMostlyPaid} onClick={mockOnClick} />
      </ThemeProvider>
    );

    expect(screen.getByText('MOSTLY PAID')).toBeInTheDocument();
  });

  it('displays payment progress bar', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <OrderCardCompact order={mockOrder} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Check for LinearProgress component
    const progressBar = container.querySelector('.MuiLinearProgress-root');
    expect(progressBar).toBeInTheDocument();
  });

  it('handles orders with no due date', () => {
    const orderNoDueDate = {
      ...mockOrder,
      order_due_date: null,
    };

    render(
      <ThemeProvider theme={theme}>
        <OrderCardCompact order={orderNoDueDate} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Should not show urgency banner
    expect(screen.queryByText(/DUE/)).not.toBeInTheDocument();
    expect(screen.queryByText(/OVERDUE/)).not.toBeInTheDocument();
  });
});
