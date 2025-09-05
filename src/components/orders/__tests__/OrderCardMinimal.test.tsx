import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderCardMinimal from '../OrderCardMinimal';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const mockOrder = {
  id: 'order-123',
  order_number: '2024-001',
  status: 'partially_paid',
  order_due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
  total_cents: 50000,
  paid_amount_cents: 25000,
  created_at: new Date().toISOString(),
  client: {
    id: 'client-456',
    first_name: 'Jane',
    last_name: 'Doe',
    phone_number: '5551234567',
  },
  garments: [
    { id: 'g1', name: 'Wedding Dress', stage: 'Ready For Pickup' },
    { id: 'g2', name: 'Suit', stage: 'Sewing' },
    { id: 'g3', name: 'Blouse', stage: 'Cutting' },
  ],
};

const mockOrderOverdue = {
  ...mockOrder,
  id: 'order-overdue',
  order_due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
};

const mockOrderPaid = {
  ...mockOrder,
  id: 'order-paid',
  status: 'paid',
  paid_amount_cents: 50000,
};

const mockOrderNoClient = {
  ...mockOrder,
  id: 'order-noclient',
  client: null,
};

describe('OrderCardMinimal', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders order information correctly', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardMinimal order={mockOrder} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Check order number (shows as #-001)
    expect(screen.getByText('#-001')).toBeInTheDocument();

    // Check client name
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();

    // Check garment count
    expect(screen.getByText(/3 garments.*1 ready/)).toBeInTheDocument();

    // Check payment amounts
    expect(screen.getByText('$250/$500')).toBeInTheDocument();

    // Check payment status (shows as separate chips)
    expect(screen.getByText('○ UNPAID')).toBeInTheDocument();
    expect(screen.getByText('Partially_paid')).toBeInTheDocument();
  });

  it('displays clear phrasing for due dates within 3 days', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardMinimal order={mockOrder} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Should show "Due in 2 days" text
    expect(screen.getByText('Due in 2 days')).toBeInTheDocument();
  });

  it('displays clear overdue phrasing for past due dates (never negative)', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardMinimal order={mockOrderOverdue} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Should show overdue text (not "Due in -3 days")
    expect(screen.getByText('Overdue by 3 days')).toBeInTheDocument();
  });

  it('displays paid status correctly', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardMinimal order={mockOrderPaid} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Check payment status shows as paid
    expect(screen.getByText('✓ PAID')).toBeInTheDocument();
  });

  it('handles missing client gracefully', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardMinimal order={mockOrderNoClient} onClick={mockOnClick} />
      </ThemeProvider>
    );

    expect(screen.getByText('No Client')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardMinimal order={mockOrder} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Click the card directly (it's clickable)
    const card = document.querySelector('.MuiCard-root');
    fireEvent.click(card!);

    expect(mockOnClick).toHaveBeenCalledWith('order-123');
  });

  it('shows ready indicator when garments are ready', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardMinimal order={mockOrder} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Should show ready count
    expect(screen.getByText(/1 ready/)).toBeInTheDocument();
  });

  it('displays payment progress bar correctly', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <OrderCardMinimal order={mockOrder} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Check for LinearProgress component
    const progressBar = container.querySelector('.MuiLinearProgress-root');
    expect(progressBar).toBeInTheDocument();
  });

  it('handles zero payment correctly', () => {
    const orderUnpaid = {
      ...mockOrder,
      paid_amount_cents: 0,
      status: 'pending',
    };

    render(
      <ThemeProvider theme={theme}>
        <OrderCardMinimal order={orderUnpaid} onClick={mockOnClick} />
      </ThemeProvider>
    );

    expect(screen.getByText('$0/$500')).toBeInTheDocument();
    expect(screen.getByText('○ UNPAID')).toBeInTheDocument();
  });

  it('displays "Due today" for due date that is today', () => {
    const orderDueToday = {
      ...mockOrder,
      order_due_date: new Date().toISOString(),
    };

    render(
      <ThemeProvider theme={theme}>
        <OrderCardMinimal order={orderDueToday} onClick={mockOnClick} />
      </ThemeProvider>
    );

    expect(screen.getByText('Due today')).toBeInTheDocument();
  });
});
