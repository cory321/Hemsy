import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EnhancedInvoiceLineItems from './EnhancedInvoiceLineItems';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock utility functions
jest.mock('@/lib/utils/currency', () => ({
  formatCentsAsCurrency: (cents: number) => `$${(cents / 100).toFixed(2)}`,
}));

jest.mock('@/constants/garmentStages', () => ({
  getStageColor: () => 'default',
}));

jest.mock('@/utils/presetIcons', () => ({
  getPresetIconUrl: () => '/icon.svg',
}));

describe('EnhancedInvoiceLineItems', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const defaultItems = [
    {
      id: 'item-1',
      garment_id: 'garment-1',
      name: 'Hemming',
      quantity: 2,
      unit_price_cents: 2000,
      line_total_cents: 4000,
      description: 'Basic hemming service',
    },
    {
      id: 'item-2',
      garment_id: 'garment-2',
      name: 'Alterations',
      quantity: 1,
      unit_price_cents: 5000,
      line_total_cents: 5000,
    },
  ];

  const defaultGarments = [
    {
      id: 'garment-1',
      name: 'Blue Dress',
      stage: 'In Progress',
      preset_icon_key: 'dress',
      preset_fill_color: '#0000FF',
    },
    {
      id: 'garment-2',
      name: 'Black Suit',
      stage: 'Ready For Pickup',
      preset_icon_key: 'suit',
      preset_fill_color: '#000000',
    },
  ];

  const defaultPayments = [
    {
      id: 'payment-1',
      payment_type: 'custom',
      payment_method: 'cash',
      amount_cents: 3000,
      status: 'completed',
      created_at: '2024-01-01T10:00:00Z',
    },
  ];

  const defaultProps = {
    items: defaultItems,
    garments: defaultGarments,
    showRemoved: false,
    readonly: false,
    payments: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  describe('Component Rendering', () => {
    it('should render line items table', () => {
      render(<EnhancedInvoiceLineItems {...defaultProps} />);

      expect(screen.getByText('Garment')).toBeInTheDocument();
      expect(screen.getByText('Service')).toBeInTheDocument();
      expect(screen.getByText('Quantity')).toBeInTheDocument();
      expect(screen.getByText('Price')).toBeInTheDocument();
    });

    it('should display all line items', () => {
      render(<EnhancedInvoiceLineItems {...defaultProps} />);

      expect(screen.getByText('Hemming')).toBeInTheDocument();
      expect(screen.getByText('Alterations')).toBeInTheDocument();
      expect(screen.getByText('Blue Dress')).toBeInTheDocument();
      expect(screen.getByText('Black Suit')).toBeInTheDocument();
    });

    it('should show service descriptions when provided', () => {
      render(<EnhancedInvoiceLineItems {...defaultProps} />);

      expect(screen.getByText('Basic hemming service')).toBeInTheDocument();
    });

    it('should calculate and display correct totals', () => {
      render(<EnhancedInvoiceLineItems {...defaultProps} />);

      // Individual line totals
      expect(screen.getByText('$40.00')).toBeInTheDocument(); // 2 * $20
      expect(screen.getByText('$50.00')).toBeInTheDocument(); // 1 * $50

      // Subtotal
      expect(screen.getByText('$90.00')).toBeInTheDocument();
    });
  });

  describe('Payment Status Display', () => {
    it('should show unpaid status when no payments', () => {
      render(<EnhancedInvoiceLineItems {...defaultProps} />);

      expect(screen.getByText('Total Amount Due')).toBeInTheDocument();
      expect(screen.getByText('$90.00')).toBeInTheDocument();
    });

    it('should show partial payment status', () => {
      render(
        <EnhancedInvoiceLineItems
          {...defaultProps}
          payments={defaultPayments}
        />
      );

      expect(screen.getByText('Total Amount Due')).toBeInTheDocument();
      expect(screen.getByText('$30.00 paid of $90.00')).toBeInTheDocument();
      expect(screen.getByText('$60.00')).toBeInTheDocument(); // Remaining amount
    });

    it('should show fully paid status', () => {
      const fullPayment = [
        {
          id: defaultPayments[0]!.id,
          payment_type: defaultPayments[0]!.payment_type,
          payment_method: defaultPayments[0]!.payment_method,
          amount_cents: 9000,
          status: defaultPayments[0]!.status,
          created_at: defaultPayments[0]!.created_at,
        },
      ];

      render(
        <EnhancedInvoiceLineItems {...defaultProps} payments={fullPayment} />
      );

      expect(screen.getByText('Total Amount Due')).toBeInTheDocument();
      expect(screen.getByText('Order fully paid')).toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('should show overpaid status', () => {
      const overPayment = [
        {
          id: defaultPayments[0]!.id,
          payment_type: defaultPayments[0]!.payment_type,
          payment_method: defaultPayments[0]!.payment_method,
          amount_cents: 10000,
          status: defaultPayments[0]!.status,
          created_at: defaultPayments[0]!.created_at,
        },
      ];

      render(
        <EnhancedInvoiceLineItems {...defaultProps} payments={overPayment} />
      );

      expect(screen.getByText('Credit Balance')).toBeInTheDocument();
      expect(
        screen.getByText('Customer has a credit of $10.00')
      ).toBeInTheDocument();
    });
  });

  describe('Record Payment Button', () => {
    it('should show Record Payment button when unpaid and callback provided', () => {
      const onRecordPayment = jest.fn();

      render(
        <EnhancedInvoiceLineItems
          {...defaultProps}
          onRecordPayment={onRecordPayment}
        />
      );

      const recordButton = screen.getByRole('button', {
        name: /Record Payment/i,
      });
      expect(recordButton).toBeInTheDocument();
    });

    it('should not show Record Payment button when fully paid', () => {
      const onRecordPayment = jest.fn();
      const fullPayment = [
        {
          id: defaultPayments[0]!.id,
          payment_type: defaultPayments[0]!.payment_type,
          payment_method: defaultPayments[0]!.payment_method,
          amount_cents: 9000,
          status: defaultPayments[0]!.status,
          created_at: defaultPayments[0]!.created_at,
        },
      ];

      render(
        <EnhancedInvoiceLineItems
          {...defaultProps}
          payments={fullPayment}
          onRecordPayment={onRecordPayment}
        />
      );

      expect(
        screen.queryByRole('button', { name: /Record Payment/i })
      ).not.toBeInTheDocument();
    });

    it('should not show Record Payment button when callback not provided', () => {
      render(<EnhancedInvoiceLineItems {...defaultProps} />);

      expect(
        screen.queryByRole('button', { name: /Record Payment/i })
      ).not.toBeInTheDocument();
    });

    it('should call onRecordPayment when button clicked', () => {
      const onRecordPayment = jest.fn();

      render(
        <EnhancedInvoiceLineItems
          {...defaultProps}
          onRecordPayment={onRecordPayment}
        />
      );

      const recordButton = screen.getByRole('button', {
        name: /Record Payment/i,
      });
      fireEvent.click(recordButton);

      expect(onRecordPayment).toHaveBeenCalledTimes(1);
    });

    it('should show button for partial payments', () => {
      const onRecordPayment = jest.fn();

      render(
        <EnhancedInvoiceLineItems
          {...defaultProps}
          payments={defaultPayments}
          onRecordPayment={onRecordPayment}
        />
      );

      const recordButton = screen.getByRole('button', {
        name: /Record Payment/i,
      });
      expect(recordButton).toBeInTheDocument();
    });
  });

  describe('Removed Items Handling', () => {
    it('should show removed items when showRemoved is true', () => {
      const itemsWithRemoved = [
        ...defaultItems,
        {
          id: 'item-3',
          garment_id: 'garment-1',
          name: 'Removed Service',
          quantity: 1,
          unit_price_cents: 1000,
          line_total_cents: 1000,
          is_removed: true,
          removed_at: '2024-01-02T10:00:00Z',
          removal_reason: 'Customer requested',
        },
      ];

      render(
        <EnhancedInvoiceLineItems
          {...defaultProps}
          items={itemsWithRemoved}
          showRemoved={true}
        />
      );

      expect(screen.getByText('Removed Service')).toBeInTheDocument();
      expect(screen.getByText(/Customer requested/)).toBeInTheDocument();
    });

    it('should not include removed items in total calculation', () => {
      const itemsWithRemoved = [
        ...defaultItems,
        {
          id: 'item-3',
          garment_id: 'garment-1',
          name: 'Removed Service',
          quantity: 1,
          unit_price_cents: 1000,
          line_total_cents: 1000,
          is_removed: true,
        },
      ];

      render(
        <EnhancedInvoiceLineItems
          {...defaultProps}
          items={itemsWithRemoved}
          showRemoved={true}
        />
      );

      // Total should still be $90.00, not $100.00
      expect(screen.getByText('$90.00')).toBeInTheDocument();
    });

    it('should call onRestoreItem when restore button clicked', () => {
      const onRestoreItem = jest.fn();
      const itemsWithRemoved = [
        {
          id: 'item-3',
          garment_id: 'garment-1',
          name: 'Removed Service',
          quantity: 1,
          unit_price_cents: 1000,
          line_total_cents: 1000,
          is_removed: true,
        },
      ];

      render(
        <EnhancedInvoiceLineItems
          {...defaultProps}
          items={itemsWithRemoved}
          showRemoved={true}
          onRestoreItem={onRestoreItem}
        />
      );

      const restoreButton = screen.getByRole('button', { name: /Restore/i });
      fireEvent.click(restoreButton);

      expect(onRestoreItem).toHaveBeenCalledWith('item-3', 'garment-1');
    });
  });

  describe('Garment Navigation', () => {
    it('should navigate to garment detail when garment clicked', () => {
      render(
        <EnhancedInvoiceLineItems {...defaultProps} orderId="order-123" />
      );

      const garmentRow = screen.getByText('Blue Dress').closest('tr');
      fireEvent.click(garmentRow!);

      expect(mockRouter.push).toHaveBeenCalledWith(
        '/garments/garment-1?from=order&orderId=order-123'
      );
    });

    it('should not navigate when readonly', () => {
      render(<EnhancedInvoiceLineItems {...defaultProps} readonly={true} />);

      const garmentRow = screen.getByText('Blue Dress').closest('tr');
      fireEvent.click(garmentRow!);

      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('Garment Grouping', () => {
    it('should group services by garment', () => {
      const multipleServicesPerGarment = [
        {
          id: 'item-1',
          garment_id: 'garment-1',
          name: 'Hemming',
          quantity: 1,
          unit_price_cents: 2000,
          line_total_cents: 2000,
        },
        {
          id: 'item-2',
          garment_id: 'garment-1',
          name: 'Taking In',
          quantity: 1,
          unit_price_cents: 3000,
          line_total_cents: 3000,
        },
      ];

      render(
        <EnhancedInvoiceLineItems
          {...defaultProps}
          items={multipleServicesPerGarment}
        />
      );

      // Blue Dress should appear only once (as a group header)
      const blueDressElements = screen.getAllByText('Blue Dress');
      expect(blueDressElements).toHaveLength(1);

      // Both services should be visible
      expect(screen.getByText('Hemming')).toBeInTheDocument();
      expect(screen.getByText('Taking In')).toBeInTheDocument();
    });

    it('should toggle garment service details', () => {
      const multipleServicesPerGarment = [
        {
          id: 'item-1',
          garment_id: 'garment-1',
          name: 'Hemming',
          quantity: 1,
          unit_price_cents: 2000,
          line_total_cents: 2000,
        },
        {
          id: 'item-2',
          garment_id: 'garment-1',
          name: 'Taking In',
          quantity: 1,
          unit_price_cents: 3000,
          line_total_cents: 3000,
        },
      ];

      render(
        <EnhancedInvoiceLineItems
          {...defaultProps}
          items={multipleServicesPerGarment}
        />
      );

      // Find and click the expand/collapse button
      const expandButton = screen.getByRole('button', { name: /expand/i });
      fireEvent.click(expandButton);

      // Services should still be visible (implementation dependent)
      expect(screen.getByText('Hemming')).toBeInTheDocument();
      expect(screen.getByText('Taking In')).toBeInTheDocument();
    });
  });

  describe('Stage Display', () => {
    it('should display garment stage chips', () => {
      render(<EnhancedInvoiceLineItems {...defaultProps} />);

      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.getByText('Ready For Pickup')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render table on desktop', () => {
      render(<EnhancedInvoiceLineItems {...defaultProps} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should handle empty items gracefully', () => {
      render(<EnhancedInvoiceLineItems {...defaultProps} items={[]} />);

      // Should still show total row
      expect(screen.getByText('Subtotal')).toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('should handle missing garment info gracefully', () => {
      const itemsWithoutGarment = [
        {
          id: 'item-1',
          garment_id: 'nonexistent',
          name: 'Service',
          quantity: 1,
          unit_price_cents: 1000,
          line_total_cents: 1000,
        },
      ];

      render(
        <EnhancedInvoiceLineItems
          {...defaultProps}
          items={itemsWithoutGarment}
          garments={[]}
        />
      );

      expect(screen.getByText('Service')).toBeInTheDocument();
      expect(screen.getByText('Unknown Garment')).toBeInTheDocument();
    });
  });
});
