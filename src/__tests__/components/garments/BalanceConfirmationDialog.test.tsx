import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BalanceConfirmationDialog from '@/components/garments/BalanceConfirmationDialog';
import { formatCentsAsCurrency } from '@/lib/utils/currency';

// Mock the RecordPaymentDialog component
jest.mock('@/components/orders/RecordPaymentDialog', () => {
  return function MockRecordPaymentDialog({
    open,
    onClose,
    onPaymentSuccess,
  }: {
    open: boolean;
    onClose: () => void;
    onPaymentSuccess?: () => void;
  }) {
    if (!open) return null;
    return (
      <div data-testid="mock-payment-dialog">
        <button onClick={onClose}>Close Payment Dialog</button>
        <button onClick={onPaymentSuccess}>Payment Success</button>
      </div>
    );
  };
});

describe('BalanceConfirmationDialog', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onConfirmWithoutPayment: jest.fn(),
    onPaymentSuccess: jest.fn(),
    balanceDue: 12550, // $125.50
    orderTotal: 25000, // $250.00
    paidAmount: 12450, // $124.50
    orderNumber: 'ORD-001',
    clientName: 'John Doe',
    orderId: 'order-123',
    invoiceId: 'invoice-456',
    clientEmail: 'john.doe@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dialog with correct information', () => {
    render(<BalanceConfirmationDialog {...defaultProps} />);

    expect(
      screen.getByText('Outstanding Balance on Order')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/This is the last garment for order/)
    ).toBeInTheDocument();
    expect(screen.getByText('#ORD-001')).toBeInTheDocument();
    expect(screen.getByText(/\(John Doe\)/)).toBeInTheDocument();

    // Check amounts
    expect(screen.getByText(formatCentsAsCurrency(25000))).toBeInTheDocument(); // Order Total
    expect(screen.getByText(formatCentsAsCurrency(12450))).toBeInTheDocument(); // Amount Paid
    expect(screen.getByText(formatCentsAsCurrency(12550))).toBeInTheDocument(); // Balance Due

    // Check percentage paid (12450/25000 = 49.8% rounds to 50%)
    expect(screen.getByText('50% paid')).toBeInTheDocument();
  });

  it('should render all three action buttons', () => {
    render(<BalanceConfirmationDialog {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Mark Picked Up Without Payment' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Collect Payment Now' })
    ).toBeInTheDocument();
  });

  it('should call onClose when Cancel is clicked', () => {
    render(<BalanceConfirmationDialog {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onConfirmWithoutPayment when proceeding without payment', async () => {
    render(<BalanceConfirmationDialog {...defaultProps} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Mark Picked Up Without Payment' })
    );

    await waitFor(() => {
      expect(defaultProps.onConfirmWithoutPayment).toHaveBeenCalledTimes(1);
    });
  });

  it('should open payment dialog when Collect Payment Now is clicked', () => {
    render(<BalanceConfirmationDialog {...defaultProps} />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Collect Payment Now' })
    );

    expect(screen.getByTestId('mock-payment-dialog')).toBeInTheDocument();
  });

  it('should call onPaymentSuccess when payment is successful', () => {
    render(<BalanceConfirmationDialog {...defaultProps} />);

    // Open payment dialog
    fireEvent.click(
      screen.getByRole('button', { name: 'Collect Payment Now' })
    );

    // Simulate payment success
    fireEvent.click(screen.getByText('Payment Success'));

    expect(defaultProps.onPaymentSuccess).toHaveBeenCalledTimes(1);
  });

  it('should show warning when no invoice exists', () => {
    render(<BalanceConfirmationDialog {...defaultProps} />);

    expect(
      screen.getByText(/No invoice found for this order/)
    ).toBeInTheDocument();

    // Collect Payment button should be disabled
    expect(
      screen.getByRole('button', { name: 'Collect Payment Now' })
    ).toBeDisabled();
  });

  it('should not render when closed', () => {
    render(<BalanceConfirmationDialog {...defaultProps} open={false} />);

    expect(
      screen.queryByText('Outstanding Balance on Order')
    ).not.toBeInTheDocument();
  });

  it('should calculate correct percentage for different payment amounts', () => {
    // Test 75% paid
    render(
      <BalanceConfirmationDialog
        {...defaultProps}
        orderTotal={10000}
        paidAmount={7500}
        balanceDue={2500}
      />
    );

    expect(screen.getByText('75% paid')).toBeInTheDocument();
  });

  it('should disable buttons when processing', async () => {
    render(<BalanceConfirmationDialog {...defaultProps} />);

    const pickupButton = screen.getByRole('button', {
      name: 'Mark Picked Up Without Payment',
    });
    fireEvent.click(pickupButton);

    // Check if button text changes to show processing state
    await waitFor(() => {
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });
});
