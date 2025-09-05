import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import OrderCardMinimal from '@/components/orders/OrderCardMinimal';

const theme = createTheme();

const mockOrder = {
  id: 'order-123',
  order_number: '2024-001',
  status: 'new',
  order_due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  total_cents: 7700,
  paid_amount_cents: 3900,
  client: {
    id: 'client-1',
    first_name: 'Lizet',
    last_name: 'Benner',
  },
  garments: [
    { id: 'g1', stage: 'In Progress' },
    { id: 'g2', stage: 'Ready For Pickup' },
  ],
};

describe('OrderCardMinimal column alignment', () => {
  it('renders with a fixed grid template and column testids', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardMinimal order={mockOrder} onClick={jest.fn()} />
      </ThemeProvider>
    );

    const grid = screen.getByTestId('order-card-minimal-grid');
    expect(grid).toBeInTheDocument();

    // Verify the grid template columns marker for consistent alignment
    expect(grid).toHaveAttribute(
      'data-grid-template-columns',
      '72px 1fr 140px 160px 120px 120px 40px'
    );

    // Verify each expected column exists
    expect(screen.getByTestId('order-col-number')).toBeInTheDocument();
    expect(screen.getByTestId('order-col-client')).toBeInTheDocument();
    expect(screen.getByTestId('order-col-date')).toBeInTheDocument();
    expect(screen.getByTestId('order-col-payment')).toBeInTheDocument();
    expect(screen.getByTestId('order-col-payment-status')).toBeInTheDocument();
    expect(screen.getByTestId('order-col-order-status')).toBeInTheDocument();
    expect(screen.getByTestId('order-col-action')).toBeInTheDocument();
  });
});
