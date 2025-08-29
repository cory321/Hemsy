import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderCardDetailed from '../OrderCardDetailed';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const mockOrder = {
  id: 'order-123',
  order_number: '2024-0142',
  status: 'partially_paid',
  order_due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
  total_cents: 85000,
  paid_amount_cents: 45000,
  created_at: new Date('2024-12-10').toISOString(),
  client: {
    id: 'client-456',
    first_name: 'Sarah',
    last_name: 'Johnson',
    phone_number: '5551234567',
    email: 'sarah@example.com',
  },
  garments: [
    {
      id: 'g1',
      name: 'Wedding Dress - Hemming & Bustle',
      stage: 'Finishing',
      preset_icon_key: 'dress',
      preset_fill_color: '#FF69B4',
    },
    {
      id: 'g2',
      name: 'Bridesmaid Dress - Alterations',
      stage: 'Sewing',
      preset_icon_key: 'dress',
      preset_fill_color: '#9370DB',
    },
    {
      id: 'g3',
      name: 'Evening Gown - Full Reconstruction',
      stage: 'Cutting',
      preset_icon_key: 'dress',
      preset_fill_color: '#4169E1',
    },
  ],
};

const mockOrderOverdue = {
  ...mockOrder,
  id: 'order-overdue',
  order_due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
};

const mockOrderDueToday = {
  ...mockOrder,
  id: 'order-today',
  order_due_date: new Date().toISOString(),
};

const mockOrderDueTomorrow = {
  ...mockOrder,
  id: 'order-tomorrow',
  order_due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
};

const mockOrderPaid = {
  ...mockOrder,
  id: 'order-paid',
  status: 'paid',
  paid_amount_cents: 85000,
};

const mockOrderManyGarments = {
  ...mockOrder,
  id: 'order-many',
  garments: [
    ...mockOrder.garments,
    { id: 'g4', name: 'Shirt', stage: 'Not Started' },
    { id: 'g5', name: 'Pants', stage: 'Ready For Pickup' },
  ],
};

describe('OrderCardDetailed', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders order header with number and due date', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardDetailed order={mockOrder} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Check order number
    expect(screen.getByText('ORDER #2024-0142')).toBeInTheDocument();

    // Check due date (should show full date for non-urgent)
    expect(screen.getByText(/DUE:/)).toBeInTheDocument();
  });

  it('displays client information prominently', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardDetailed order={mockOrder} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Check client name
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();

    // Check formatted phone number
    expect(screen.getByText('(555) 123-4567')).toBeInTheDocument();
  });

  it('shows individual garment progress bars', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardDetailed order={mockOrder} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Check garment names
    expect(
      screen.getByText('Wedding Dress - Hemming & Bustle')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Bridesmaid Dress - Alterations')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Evening Gown - Full Reconstruction')
    ).toBeInTheDocument();

    // Check stage labels
    expect(screen.getByText('Finishing')).toBeInTheDocument();
    expect(screen.getByText('Sewing')).toBeInTheDocument();
    expect(screen.getByText('Cutting')).toBeInTheDocument();

    // Check progress percentages
    expect(screen.getByText('80%')).toBeInTheDocument(); // Finishing
    expect(screen.getByText('40%')).toBeInTheDocument(); // Sewing
    expect(screen.getByText('20%')).toBeInTheDocument(); // Cutting
  });

  it('displays detailed payment section', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardDetailed order={mockOrder} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Check payment header
    expect(screen.getByText('PAYMENT')).toBeInTheDocument();

    // Check payment amounts
    expect(screen.getByText('$450.00 / $850.00')).toBeInTheDocument();

    // Check payment percentage
    expect(screen.getByText(/53% paid/)).toBeInTheDocument();

    // Check payment status
    expect(screen.getByText('PARTIAL PAID')).toBeInTheDocument();

    // Check amount due
    expect(screen.getByText('$400.00 DUE')).toBeInTheDocument();
  });

  it('shows overdue urgency with red indicators', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardDetailed order={mockOrderOverdue} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Check for overdue text
    expect(screen.getByText(/5 days overdue/)).toBeInTheDocument();
  });

  it('shows due today with warning', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardDetailed order={mockOrderDueToday} onClick={mockOnClick} />
      </ThemeProvider>
    );

    expect(screen.getByText(/Due today/)).toBeInTheDocument();
  });

  it('shows due tomorrow with warning', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardDetailed order={mockOrderDueTomorrow} onClick={mockOnClick} />
      </ThemeProvider>
    );

    expect(screen.getByText(/Due tomorrow/)).toBeInTheDocument();
  });

  it('displays paid in full with success styling', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardDetailed order={mockOrderPaid} onClick={mockOnClick} />
      </ThemeProvider>
    );

    expect(screen.getByText('PAID IN FULL')).toBeInTheDocument();
    expect(screen.getByText('100% paid')).toBeInTheDocument();
    // Should not show amount due when fully paid
    expect(screen.queryByText(/DUE$/)).not.toBeInTheDocument();
  });

  it('truncates garment list when more than 3', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardDetailed
          order={mockOrderManyGarments}
          onClick={mockOnClick}
        />
      </ThemeProvider>
    );

    // Should show first 3 garments
    expect(
      screen.getByText('Wedding Dress - Hemming & Bustle')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Bridesmaid Dress - Alterations')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Evening Gown - Full Reconstruction')
    ).toBeInTheDocument();

    // Should show "+2 more garments" indicator
    expect(screen.getByText('+2 more garments')).toBeInTheDocument();

    // Should not show the 4th and 5th garments
    expect(screen.queryByText('Shirt')).not.toBeInTheDocument();
    expect(screen.queryByText('Pants')).not.toBeInTheDocument();
  });

  it('shows footer status tags', () => {
    const orderWithReadyGarments = {
      ...mockOrder,
      garments: [
        { id: 'g1', name: 'Dress 1', stage: 'Ready For Pickup' },
        { id: 'g2', name: 'Dress 2', stage: 'Sewing' },
        { id: 'g3', name: 'Dress 3', stage: 'Fitting' },
      ],
    };

    render(
      <ThemeProvider theme={theme}>
        <OrderCardDetailed
          order={orderWithReadyGarments}
          onClick={mockOnClick}
        />
      </ThemeProvider>
    );

    expect(screen.getByText('1 Ready For Pickup')).toBeInTheDocument();
    expect(screen.getByText('2 in progress')).toBeInTheDocument();
  });

  it('displays creation date', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardDetailed order={mockOrder} onClick={mockOnClick} />
      </ThemeProvider>
    );

    expect(screen.getByText('Created Dec 10')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    render(
      <ThemeProvider theme={theme}>
        <OrderCardDetailed order={mockOrder} onClick={mockOnClick} />
      </ThemeProvider>
    );

    const card = screen.getByRole('article').parentElement;
    fireEvent.click(card!);

    expect(mockOnClick).toHaveBeenCalledWith('order-123');
  });

  it('handles orders with no garments', () => {
    const orderNoGarments = {
      ...mockOrder,
      garments: [],
    };

    render(
      <ThemeProvider theme={theme}>
        <OrderCardDetailed order={orderNoGarments} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Should not show garment section
    expect(screen.queryByText(/Wedding Dress/)).not.toBeInTheDocument();
    // Should not show status tags
    expect(screen.queryByText(/Ready For Pickup/)).not.toBeInTheDocument();
    expect(screen.queryByText(/in progress/)).not.toBeInTheDocument();
  });

  it('shows payment progress bar with correct color coding', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <OrderCardDetailed order={mockOrder} onClick={mockOnClick} />
      </ThemeProvider>
    );

    // Check for LinearProgress components
    const progressBars = container.querySelectorAll('.MuiLinearProgress-root');
    expect(progressBars.length).toBeGreaterThan(0); // Should have payment progress and garment progress bars
  });

  it('handles missing due date gracefully', () => {
    const orderNoDueDate = {
      ...mockOrder,
      order_due_date: null,
    };

    render(
      <ThemeProvider theme={theme}>
        <OrderCardDetailed order={orderNoDueDate} onClick={mockOnClick} />
      </ThemeProvider>
    );

    expect(screen.getByText(/No due date/)).toBeInTheDocument();
  });
});
