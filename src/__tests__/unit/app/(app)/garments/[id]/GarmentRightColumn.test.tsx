import React from 'react';
import { render, screen } from '@testing-library/react';
import { GarmentProvider } from '@/contexts/GarmentContext';
import GarmentRightColumn from '@/app/(app)/garments/[id]/GarmentRightColumn';

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

const mockGarment = {
  id: 'test-garment-id',
  name: 'Test Garment',
  due_date: '2024-12-01',
  event_date: '2024-12-15',
  preset_icon_key: null,
  preset_fill_color: null,
  preset_outline_color: null,
  notes: 'Test notes',
  stage: 'New',
  photo_url: null,
  image_cloud_id: null,
  created_at: '2024-01-01T00:00:00Z',
  order_id: 'test-order-id',
  garment_services: [
    {
      id: 'service-1',
      name: 'Hemming',
      quantity: 1,
      unit: 'flat_rate',
      unit_price_cents: 2000,
      line_total_cents: 2000,
      is_done: false,
    },
  ],
  order: {
    id: 'test-order-id',
    order_number: 'COR-25-0034',
    status: 'in_progress',
    client: {
      id: 'test-client-id',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone_number: '555-1234',
    },
    shop_id: 'test-shop-id',
  },
  totalPriceCents: 2000,
};

describe('GarmentRightColumn', () => {
  it('renders order number as clickable link to order page', () => {
    render(
      <GarmentProvider initialGarment={mockGarment}>
        <GarmentRightColumn clientName="John Doe" />
      </GarmentProvider>
    );

    // Check that order number is rendered as a link
    const orderLink = screen.getByRole('link', { name: /Order #COR-25-0034/i });
    expect(orderLink).toBeInTheDocument();
    expect(orderLink).toHaveAttribute('href', '/orders/test-order-id');
  });

  it('renders client name as clickable link to client page', () => {
    render(
      <GarmentProvider initialGarment={mockGarment}>
        <GarmentRightColumn clientName="John Doe" />
      </GarmentProvider>
    );

    // Check that client name is rendered as a link
    const clientLink = screen.getByRole('link', { name: /John Doe/i });
    expect(clientLink).toBeInTheDocument();
    expect(clientLink).toHaveAttribute('href', '/clients/test-client-id');
  });

  it('renders order number as plain text when order_id is missing', () => {
    const { order, ...garmentWithoutOrder } = mockGarment;
    const garmentWithoutOrderId = {
      ...garmentWithoutOrder,
      order_id: null, // Set to null to simulate missing order_id
    };

    render(
      <GarmentProvider initialGarment={garmentWithoutOrderId}>
        <GarmentRightColumn clientName="John Doe" />
      </GarmentProvider>
    );

    // Order should be rendered as plain text, not a link
    expect(screen.getByText(/Order #N\/A/)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /Order #/i })
    ).not.toBeInTheDocument();
  });

  it('renders client name as plain text when client id is missing', () => {
    const garmentWithoutClientId = {
      ...mockGarment,
      order: {
        ...mockGarment.order!,
        client: {
          ...mockGarment.order!.client,
          id: '',
        },
      },
    };

    render(
      <GarmentProvider initialGarment={garmentWithoutClientId}>
        <GarmentRightColumn clientName="John Doe" />
      </GarmentProvider>
    );

    // Client name should be rendered as plain text, not a link
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /John Doe/i })
    ).not.toBeInTheDocument();
  });
});
