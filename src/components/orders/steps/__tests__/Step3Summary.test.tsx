'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Step3Summary from '../Step3Summary';

// Mock environment variables
process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test-cloud';

// Mock the resolveGarmentDisplayImage utility
jest.mock('@/utils/displayImage', () => ({
  resolveGarmentDisplayImage: jest.fn(),
}));
jest.mock('@/lib/utils/phone', () => ({
  formatPhoneNumber: (value: string) => `FORMATTED:${value}`,
}));

// Mock the OrderFlow context
const mockOrderFlowContext = {
  orderDraft: {
    client: {
      id: 'client-1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone_number: '+1234567890',
    },
    garments: [
      {
        id: 'garment-1',
        name: 'Wedding Dress',
        cloudinaryPublicId: 'test-cloud-id',
        cloudinaryUrl: 'https://test-url.com/image.jpg',
        presetIconKey: 'dress-formal',
        presetFillColor: '#ff0000',
        services: [
          {
            name: 'Hemming',
            quantity: 1,
            unit: 'item',
            unitPriceCents: 5000,
          },
        ],
        dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        notes: 'Special care needed',
      },
      {
        id: 'garment-2',
        name: 'Suit Jacket',
        presetIconKey: 'jacket',
        presetFillColor: '#0000ff',
        services: [
          {
            name: 'Alterations',
            quantity: 2,
            unit: 'item',
            unitPriceCents: 3000,
          },
        ],
      },
      {
        id: 'garment-3',
        name: 'Plain Shirt',
        services: [
          {
            name: 'Basic Alterations',
            quantity: 1,
            unit: 'item',
            unitPriceCents: 2000,
          },
        ],
      },
    ],
    discountCents: 0,
    notes: 'Test order notes',
  },
  updateOrderDraft: jest.fn(),
  calculateSubtotal: jest.fn(() => 16000), // $160.00
  calculateTotal: jest.fn(() => 17280), // $172.80 (with tax)
  addGarment: jest.fn(),
  updateGarment: jest.fn(),
  removeGarment: jest.fn(),
  resetOrder: jest.fn(),
  setClient: jest.fn(),
};

// Mock the useOrderFlow hook
jest.mock('@/contexts/OrderFlowContext', () => ({
  useOrderFlow: () => mockOrderFlowContext,
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({ data: { user: { id: 'test-user' } } })
      ),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() =>
            Promise.resolve({ data: { tax_percent: 0.08 } })
          ),
        })),
      })),
    })),
  })),
}));

// Mock PaymentCollectionCard
jest.mock('../../PaymentCollectionCard', () => {
  return function MockPaymentCollectionCard() {
    return (
      <div data-testid="payment-collection-card">Payment Collection Card</div>
    );
  };
});

const theme = createTheme();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </QueryClientProvider>
  );
};

describe('Step3Summary Image Display', () => {
  const { resolveGarmentDisplayImage } = require('@/utils/displayImage');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays cloudinary image when available', () => {
    // Mock cloudinary image resolution
    resolveGarmentDisplayImage.mockReturnValue({
      kind: 'cloud',
      src: 'https://res.cloudinary.com/test-cloud/image/upload/test-cloud-id',
    });

    renderWithProviders(<Step3Summary />);

    // Check that cloudinary image is rendered
    const cloudinaryImage = screen.getByAltText('Wedding Dress');
    expect(cloudinaryImage).toBeInTheDocument();
    expect(cloudinaryImage).toHaveAttribute(
      'src',
      'https://res.cloudinary.com/test-cloud/image/upload/c_fill,h_96,w_96/test-cloud-id'
    );
  });

  it('displays preset SVG icon when no cloudinary image', () => {
    // Mock preset icon resolution
    resolveGarmentDisplayImage.mockReturnValue({
      kind: 'preset',
      src: '/presets/garments/jacket.svg',
    });

    renderWithProviders(<Step3Summary />);

    // The InlinePresetSvg component should be rendered with the correct src
    expect(resolveGarmentDisplayImage).toHaveBeenCalledWith({
      cloudPublicId: undefined,
      photoUrl: undefined,
      presetIconKey: 'jacket',
    });
  });

  it('displays default select-garment.svg when nothing is set', () => {
    // Mock default resolution
    resolveGarmentDisplayImage.mockReturnValue({
      kind: 'preset',
      src: '/presets/garments/select-garment.svg',
    });

    renderWithProviders(<Step3Summary />);

    // Should use default SVG for garment without any image data
    expect(resolveGarmentDisplayImage).toHaveBeenCalledWith({
      cloudPublicId: undefined,
      photoUrl: undefined,
      presetIconKey: undefined,
    });
  });

  it('renders garment information correctly', () => {
    resolveGarmentDisplayImage.mockReturnValue({
      kind: 'preset',
      src: '/presets/garments/select-garment.svg',
    });

    renderWithProviders(<Step3Summary />);

    // Check garment names are displayed
    expect(screen.getByText('Wedding Dress')).toBeInTheDocument();
    expect(screen.getByText('Suit Jacket')).toBeInTheDocument();
    expect(screen.getByText('Plain Shirt')).toBeInTheDocument();

    // Check services are displayed
    expect(screen.getByText(/Hemming \(1 item\)/)).toBeInTheDocument();
    expect(screen.getByText(/Alterations \(2 item\)/)).toBeInTheDocument();
    expect(
      screen.getByText(/Basic Alterations \(1 item\)/)
    ).toBeInTheDocument();
  });

  it('handles rush orders correctly', () => {
    resolveGarmentDisplayImage.mockReturnValue({
      kind: 'preset',
      src: '/presets/garments/select-garment.svg',
    });

    renderWithProviders(<Step3Summary />);

    // Should show rush indicator for garment with due date tomorrow
    expect(screen.getByText('Rush')).toBeInTheDocument();
  });

  it('displays client information', () => {
    resolveGarmentDisplayImage.mockReturnValue({
      kind: 'preset',
      src: '/presets/garments/select-garment.svg',
    });

    renderWithProviders(<Step3Summary />);

    // Check client information
    expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
    expect(screen.getAllByText('john@example.com').length).toBeGreaterThan(0);
  });

  it('calculates and displays pricing correctly', async () => {
    resolveGarmentDisplayImage.mockReturnValue({
      kind: 'preset',
      src: '/presets/garments/select-garment.svg',
    });

    renderWithProviders(<Step3Summary />);

    // Wait for async tax percent fetch to update totals; allow multiple matches
    const totals = await screen.findAllByText('$172.80');
    expect(totals.length).toBeGreaterThan(0);
  });

  it('formats client phone number using phone utility', () => {
    const { resolveGarmentDisplayImage } = require('@/utils/displayImage');
    resolveGarmentDisplayImage.mockReturnValue({
      kind: 'preset',
      src: '/presets/garments/select-garment.svg',
    });

    renderWithProviders(<Step3Summary />);

    const elems = screen.getAllByText('FORMATTED:+1234567890');
    expect(elems.length).toBeGreaterThan(0);
  });
});
