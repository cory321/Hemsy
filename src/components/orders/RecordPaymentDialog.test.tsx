import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecordPaymentDialog from './RecordPaymentDialog';
import { recordManualPayment } from '@/lib/actions/invoices';
import { createPaymentIntent } from '@/lib/actions/payments';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('@/lib/actions/invoices');
jest.mock('@/lib/actions/payments');
jest.mock('react-hot-toast');
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve(null)),
}));
jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: any) => <div>{children}</div>,
  PaymentElement: () => (
    <div data-testid="payment-element">Payment Element</div>
  ),
  useStripe: () => null,
  useElements: () => null,
}));

describe('RecordPaymentDialog', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    orderId: 'order-123',
    invoiceId: 'invoice-456',
    amountDue: 10000, // $100.00
    onPaymentSuccess: jest.fn(),
    clientEmail: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the dialog when open', () => {
      render(<RecordPaymentDialog {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Record Payment')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<RecordPaymentDialog {...defaultProps} open={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display the correct amount due', () => {
      render(<RecordPaymentDialog {...defaultProps} />);

      expect(screen.getByText(/Total Balance Due:/)).toBeInTheDocument();
      expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
    });

    it('should show payment type options', () => {
      render(<RecordPaymentDialog {...defaultProps} />);

      expect(screen.getByLabelText(/Full Balance Due/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Custom Amount/)).toBeInTheDocument();
    });

    it('should show payment method options', () => {
      render(<RecordPaymentDialog {...defaultProps} />);

      fireEvent.mouseDown(screen.getByLabelText('Payment Method'));

      expect(screen.getByRole('option', { name: 'Cash' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Check' })).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'External POS' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('option', { name: 'Credit/Debit Card (Stripe)' })
      ).toBeInTheDocument();
    });
  });

  describe('Payment Type Selection', () => {
    it('should default to balance due payment type', () => {
      render(<RecordPaymentDialog {...defaultProps} />);

      const balanceDueRadio = screen.getByLabelText(/Full Balance Due/);
      expect(balanceDueRadio).toBeChecked();
    });

    it('should show custom amount input when custom is selected', async () => {
      render(<RecordPaymentDialog {...defaultProps} />);

      const customRadio = screen.getByLabelText(/Custom Amount/);
      fireEvent.click(customRadio);

      await waitFor(() => {
        expect(screen.getByLabelText('Custom Amount')).toBeInTheDocument();
      });
    });

    it('should validate custom amount does not exceed balance due', async () => {
      render(<RecordPaymentDialog {...defaultProps} />);

      const customRadio = screen.getByLabelText(/Custom Amount/);
      fireEvent.click(customRadio);

      const customInput = await screen.findByLabelText('Custom Amount');
      await userEvent.type(customInput, '150');

      expect(
        screen.getByText(/Amount cannot exceed balance due/)
      ).toBeInTheDocument();
    });
  });

  describe('Payment Method Selection', () => {
    it('should show check number field for check payments', async () => {
      render(<RecordPaymentDialog {...defaultProps} />);

      fireEvent.mouseDown(screen.getByLabelText('Payment Method'));
      fireEvent.click(screen.getByRole('option', { name: 'Check' }));

      await waitFor(() => {
        expect(screen.getByLabelText('Check Number')).toBeInTheDocument();
      });
    });

    it('should show reference field for external POS payments', async () => {
      render(<RecordPaymentDialog {...defaultProps} />);

      fireEvent.mouseDown(screen.getByLabelText('Payment Method'));
      fireEvent.click(screen.getByRole('option', { name: 'External POS' }));

      await waitFor(() => {
        expect(screen.getByLabelText('Reference Number')).toBeInTheDocument();
      });
    });

    it('should show notes field for non-Stripe payments', () => {
      render(<RecordPaymentDialog {...defaultProps} />);

      expect(screen.getByLabelText('Notes (Optional)')).toBeInTheDocument();
    });

    it('should not show Stripe option without publishable key', () => {
      const originalEnv = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

      render(<RecordPaymentDialog {...defaultProps} />);

      fireEvent.mouseDown(screen.getByLabelText('Payment Method'));
      expect(
        screen.queryByRole('option', { name: 'Credit/Debit Card (Stripe)' })
      ).not.toBeInTheDocument();

      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = originalEnv;
    });
  });

  describe('Manual Payment Recording', () => {
    it('should record cash payment successfully', async () => {
      (recordManualPayment as jest.Mock).mockResolvedValue({ success: true });

      render(<RecordPaymentDialog {...defaultProps} />);

      const recordButton = screen.getByRole('button', {
        name: 'Record Payment',
      });
      fireEvent.click(recordButton);

      await waitFor(() => {
        expect(recordManualPayment).toHaveBeenCalledWith({
          invoiceId: 'invoice-456',
          amountCents: 10000,
          paymentMethod: 'cash',
          externalReference: undefined,
          notes: undefined,
        });
        expect(toast.success).toHaveBeenCalledWith(
          'Payment recorded successfully'
        );
        expect(defaultProps.onPaymentSuccess).toHaveBeenCalled();
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it('should handle payment recording error', async () => {
      (recordManualPayment as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Payment failed',
      });

      render(<RecordPaymentDialog {...defaultProps} />);

      const recordButton = screen.getByRole('button', {
        name: 'Record Payment',
      });
      fireEvent.click(recordButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Payment failed');
        expect(defaultProps.onPaymentSuccess).not.toHaveBeenCalled();
        expect(defaultProps.onClose).not.toHaveBeenCalled();
      });
    });

    it('should require invoice ID for manual payment', async () => {
      const { invoiceId, ...propsWithoutInvoiceId } = defaultProps;
      render(<RecordPaymentDialog {...propsWithoutInvoiceId} />);

      const recordButton = screen.getByRole('button', {
        name: 'Record Payment',
      });
      fireEvent.click(recordButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Invoice required to record payment'
        );
        expect(recordManualPayment).not.toHaveBeenCalled();
      });
    });

    it('should record check payment with check number', async () => {
      (recordManualPayment as jest.Mock).mockResolvedValue({ success: true });

      render(<RecordPaymentDialog {...defaultProps} />);

      // Select check payment method
      fireEvent.mouseDown(screen.getByLabelText('Payment Method'));
      fireEvent.click(screen.getByRole('option', { name: 'Check' }));

      // Enter check number
      const checkNumberInput = await screen.findByLabelText('Check Number');
      await userEvent.type(checkNumberInput, '12345');

      const recordButton = screen.getByRole('button', {
        name: 'Record Payment',
      });
      fireEvent.click(recordButton);

      await waitFor(() => {
        expect(recordManualPayment).toHaveBeenCalledWith({
          invoiceId: 'invoice-456',
          amountCents: 10000,
          paymentMethod: 'check',
          externalReference: '12345',
          notes: undefined,
        });
      });
    });

    it('should record custom amount payment', async () => {
      (recordManualPayment as jest.Mock).mockResolvedValue({ success: true });

      render(<RecordPaymentDialog {...defaultProps} />);

      // Select custom amount
      const customRadio = screen.getByLabelText(/Custom Amount/);
      fireEvent.click(customRadio);

      // Enter custom amount
      const customInput = await screen.findByLabelText('Custom Amount');
      await userEvent.clear(customInput);
      await userEvent.type(customInput, '50');

      const recordButton = screen.getByRole('button', {
        name: 'Record Payment',
      });
      fireEvent.click(recordButton);

      await waitFor(() => {
        expect(recordManualPayment).toHaveBeenCalledWith({
          invoiceId: 'invoice-456',
          amountCents: 5000, // $50.00
          paymentMethod: 'cash',
          externalReference: undefined,
          notes: undefined,
        });
      });
    });
  });

  describe('Stripe Payment Integration', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
    });

    it('should create payment intent when Stripe is selected', async () => {
      (createPaymentIntent as jest.Mock).mockResolvedValue({
        success: true,
        data: { clientSecret: 'pi_test_secret' },
      });

      render(<RecordPaymentDialog {...defaultProps} />);

      fireEvent.mouseDown(screen.getByLabelText('Payment Method'));
      fireEvent.click(
        screen.getByRole('option', { name: 'Credit/Debit Card (Stripe)' })
      );

      await waitFor(() => {
        expect(createPaymentIntent).toHaveBeenCalledWith({
          invoiceId: 'invoice-456',
          paymentType: 'remainder',
          customAmountCents: undefined,
        });
      });
    });

    it('should handle Stripe payment intent creation error', async () => {
      (createPaymentIntent as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Failed to create payment intent',
      });

      render(<RecordPaymentDialog {...defaultProps} />);

      fireEvent.mouseDown(screen.getByLabelText('Payment Method'));
      fireEvent.click(
        screen.getByRole('option', { name: 'Credit/Debit Card (Stripe)' })
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Failed to create payment intent'
        );
      });
    });

    it('should show error when Stripe selected without invoice', async () => {
      const { invoiceId, ...propsWithoutInvoiceId } = defaultProps;
      render(<RecordPaymentDialog {...propsWithoutInvoiceId} />);

      fireEvent.mouseDown(screen.getByLabelText('Payment Method'));

      // Stripe option should not be available without invoice ID
      expect(
        screen.queryByRole('option', { name: 'Credit/Debit Card (Stripe)' })
      ).not.toBeInTheDocument();
    });
  });

  describe('Dialog Actions', () => {
    it('should close dialog when Cancel is clicked', () => {
      render(<RecordPaymentDialog {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should disable buttons while processing', async () => {
      (recordManualPayment as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true }), 100)
          )
      );

      render(<RecordPaymentDialog {...defaultProps} />);

      const recordButton = screen.getByRole('button', {
        name: 'Record Payment',
      });
      fireEvent.click(recordButton);

      // Buttons should be disabled during processing
      expect(recordButton).toHaveTextContent('Processing...');
      expect(recordButton).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

      await waitFor(() => {
        expect(defaultProps.onPaymentSuccess).toHaveBeenCalled();
      });
    });

    it('should reset form when dialog is closed and reopened', () => {
      const { rerender } = render(<RecordPaymentDialog {...defaultProps} />);

      // Select custom amount and enter value
      const customRadio = screen.getByLabelText(/Custom Amount/);
      fireEvent.click(customRadio);

      // Close dialog
      defaultProps.onClose();
      rerender(<RecordPaymentDialog {...defaultProps} open={false} />);

      // Reopen dialog
      rerender(<RecordPaymentDialog {...defaultProps} open={true} />);

      // Should be reset to balance due
      const balanceDueRadio = screen.getByLabelText(/Full Balance Due/);
      expect(balanceDueRadio).toBeChecked();
    });
  });

  describe('Payment Summary Display', () => {
    it('should show payment amount summary for valid amount', () => {
      render(<RecordPaymentDialog {...defaultProps} />);

      expect(screen.getByText(/Payment Amount:/)).toBeInTheDocument();
      expect(screen.getByText(/\$100\.00/)).toBeInTheDocument();
    });

    it('should show remaining balance for partial payment', async () => {
      render(<RecordPaymentDialog {...defaultProps} />);

      // Select custom amount
      const customRadio = screen.getByLabelText(/Custom Amount/);
      fireEvent.click(customRadio);

      // Enter partial amount
      const customInput = await screen.findByLabelText('Custom Amount');
      await userEvent.clear(customInput);
      await userEvent.type(customInput, '60');

      await waitFor(() => {
        expect(screen.getByText(/Payment Amount:/)).toBeInTheDocument();
        expect(screen.getByText(/\$60\.00/)).toBeInTheDocument();
        expect(screen.getByText(/Remaining Balance:/)).toBeInTheDocument();
        expect(screen.getByText(/\$40\.00/)).toBeInTheDocument();
      });
    });
  });
});
