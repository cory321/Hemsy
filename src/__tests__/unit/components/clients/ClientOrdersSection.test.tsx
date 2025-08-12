import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ClientOrdersSection } from '@/components/clients/ClientOrdersSection';
import { getOrdersByClient } from '@/lib/actions/orders';

// Mock the server action
jest.mock('@/lib/actions/orders', () => ({
  getOrdersByClient: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return {
    __esModule: true,
    default: ({
      children,
      href,
    }: {
      children: React.ReactNode;
      href: string;
    }) => <a href={href}>{children}</a>,
  };
});

describe('ClientOrdersSection', () => {
  const mockProps = {
    clientId: 'client-123',
    clientName: 'John Doe',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (getOrdersByClient as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<ClientOrdersSection {...mockProps} />);

    // Check for loading skeletons by looking for elements with MuiSkeleton class
    const container = screen.getByText('Orders (0)').closest('.MuiCard-root');
    const skeletons = container?.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons?.length).toBeGreaterThan(0);
  });

  it('should render orders when loaded successfully', async () => {
    const mockOrders = [
      {
        id: 'order-1',
        order_number: 'ORD-001',
        status: 'new',
        total_cents: 5000,
        garment_count: 2,
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'order-2',
        order_number: 'ORD-002',
        status: 'completed',
        total_cents: 10000,
        garment_count: 1,
        created_at: '2024-01-02T00:00:00Z',
        is_paid: true,
      },
    ];

    (getOrdersByClient as jest.Mock).mockResolvedValue({
      success: true,
      orders: mockOrders,
    });

    render(<ClientOrdersSection {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Orders (2)')).toBeInTheDocument();
      expect(screen.getByText('Order #ORD-001')).toBeInTheDocument();
      expect(screen.getByText('Order #ORD-002')).toBeInTheDocument();
    });

    // Check for the New Order button
    const newOrderButton = screen.getByRole('link', { name: /new order/i });
    expect(newOrderButton).toHaveAttribute(
      'href',
      `/orders/new?clientId=${mockProps.clientId}`
    );
  });

  it('should render empty state when no orders exist', async () => {
    (getOrdersByClient as jest.Mock).mockResolvedValue({
      success: true,
      orders: [],
    });

    render(<ClientOrdersSection {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Orders (0)')).toBeInTheDocument();
      expect(
        screen.getByText(`No orders yet for ${mockProps.clientName}`)
      ).toBeInTheDocument();
    });
  });

  it('should render error state when fetch fails', async () => {
    (getOrdersByClient as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Failed to fetch orders',
      orders: [],
    });

    render(<ClientOrdersSection {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch orders')).toBeInTheDocument();
    });
  });

  it('should handle unexpected errors gracefully', async () => {
    (getOrdersByClient as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    render(<ClientOrdersSection {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load orders')).toBeInTheDocument();
    });
  });
});
