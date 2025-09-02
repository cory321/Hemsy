import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'react-hot-toast';
import ManualRefundManagement from '../ManualRefundManagement';
import { processManualRefund } from '@/lib/actions/payments';

// Mock dependencies
jest.mock('@/lib/actions/payments');
jest.mock('react-hot-toast');

const mockProcessManualRefund = jest.mocked(processManualRefund);
const mockToast = jest.mocked(toast);

const mockCashPayment = {
  id: 'payment-123',
  payment_type: 'payment',
  payment_method: 'cash',
  amount_cents: 5000, // $50.00
  status: 'completed',
  created_at: '2024-01-15T10:00:00Z',
  processed_at: '2024-01-15T10:00:00Z',
  notes: 'Cash payment received',
};

const mockExternalPosPayment = {
  id: 'payment-456',
  payment_type: 'payment',
  payment_method: 'external_pos',
  amount_cents: 7500, // $75.00
  status: 'completed',
  created_at: '2024-01-15T11:00:00Z',
  processed_at: '2024-01-15T11:00:00Z',
};

const mockStripePayment = {
  id: 'payment-789',
  payment_type: 'payment',
  payment_method: 'stripe',
  amount_cents: 10000, // $100.00
  status: 'completed',
  stripe_payment_intent_id: 'pi_123456789',
  created_at: '2024-01-15T12:00:00Z',
  processed_at: '2024-01-15T12:00:00Z',
};

const mockRefundedPayment = {
  ...mockCashPayment,
  status: 'refunded',
};

describe('ManualRefundManagement', () => {
  const mockOnRefundComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockToast.success = jest.fn();
    mockToast.error = jest.fn();
  });

  describe('refund button visibility', () => {
    it('should show refund button for completed cash payments', () => {
      render(
        <ManualRefundManagement
          payment={mockCashPayment}
          onRefundComplete={mockOnRefundComplete}
        />
      );

      const refundButton = screen.getByText('Process Refund');
      expect(refundButton).toBeInTheDocument();
    });

    it('should show refund button for completed external POS payments', () => {
      render(
        <ManualRefundManagement
          payment={mockExternalPosPayment}
          onRefundComplete={mockOnRefundComplete}
        />
      );

      const refundButton = screen.getByText('Process Refund');
      expect(refundButton).toBeInTheDocument();
    });

    it('should not show refund button for Stripe payments', () => {
      render(
        <ManualRefundManagement
          payment={mockStripePayment}
          onRefundComplete={mockOnRefundComplete}
        />
      );

      const refundButton = screen.queryByRole('button', {
        name: /process refund/i,
      });
      expect(refundButton).not.toBeInTheDocument();
    });

    it('should not show refund button for already refunded payments', () => {
      render(
        <ManualRefundManagement
          payment={mockRefundedPayment}
          onRefundComplete={mockOnRefundComplete}
        />
      );

      const refundButton = screen.queryByRole('button', {
        name: /process refund/i,
      });
      expect(refundButton).not.toBeInTheDocument();
    });
  });

  describe('refund dialog', () => {
    it('should open refund dialog when button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ManualRefundManagement
          payment={mockCashPayment}
          onRefundComplete={mockOnRefundComplete}
        />
      );

      const refundButton = screen.getByText('Process Refund');
      await user.click(refundButton);

      expect(screen.getByText('Process Manual Refund')).toBeInTheDocument();
      expect(screen.getByDisplayValue('50')).toBeInTheDocument(); // Amount field
      expect(screen.getByDisplayValue('full')).toBeInTheDocument(); // Refund type
    });

    it('should display payment details correctly for cash payment', async () => {
      const user = userEvent.setup();

      render(
        <ManualRefundManagement
          payment={mockCashPayment}
          onRefundComplete={mockOnRefundComplete}
        />
      );

      await user.click(screen.getByText('Process Refund'));

      expect(screen.getByText('$50.00')).toBeInTheDocument();
      expect(screen.getByText('Cash Payment')).toBeInTheDocument();
      expect(screen.getByText('Cash payment received')).toBeInTheDocument();
    });

    it('should display payment details correctly for external POS payment', async () => {
      const user = userEvent.setup();

      render(
        <ManualRefundManagement
          payment={mockExternalPosPayment}
          onRefundComplete={mockOnRefundComplete}
        />
      );

      await user.click(screen.getByText('Process Refund'));

      expect(screen.getByText('$75.00')).toBeInTheDocument();
      expect(screen.getByText('External POS Payment')).toBeInTheDocument();
    });

    it('should close dialog when close button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <ManualRefundManagement
          payment={mockCashPayment}
          onRefundComplete={mockOnRefundComplete}
        />
      );

      await user.click(screen.getByText('Process Refund'));
      expect(screen.getByText('Process Manual Refund')).toBeInTheDocument();

      await user.click(screen.getByLabelText('close'));
      await waitFor(() => {
        expect(
          screen.queryByText('Process Manual Refund')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('refund form interactions', () => {
    beforeEach(async () => {
      const user = userEvent.setup();

      render(
        <ManualRefundManagement
          payment={mockCashPayment}
          onRefundComplete={mockOnRefundComplete}
        />
      );

      await user.click(screen.getByText('Process Refund'));
    });

    it('should switch between full and partial refund types', async () => {
      const user = userEvent.setup();

      // Initially full refund
      expect(screen.getByDisplayValue('50')).toBeDisabled();

      // Switch to partial
      const refundTypeSelect = screen.getByLabelText('Refund Type');
      await user.click(refundTypeSelect);
      await user.click(screen.getByText('Partial Refund'));

      // Amount field should be enabled and reset to 0
      const amountField = screen.getByLabelText('Refund Amount');
      expect(amountField).not.toBeDisabled();
      expect(amountField).toHaveValue(0);

      // Switch back to full
      await user.click(refundTypeSelect);
      await user.click(screen.getByText('Full Refund'));

      // Amount should be disabled and set to full amount
      expect(screen.getByDisplayValue('50')).toBeDisabled();
    });

    it('should allow custom amount for partial refunds', async () => {
      const user = userEvent.setup();

      // Switch to partial refund
      const refundTypeSelect = screen.getByLabelText('Refund Type');
      await user.click(refundTypeSelect);
      await user.click(screen.getByText('Partial Refund'));

      // Enter custom amount
      const amountField = screen.getByLabelText('Refund Amount');
      await user.clear(amountField);
      await user.type(amountField, '25');

      expect(amountField).toHaveValue(25);
    });

    it('should allow selecting different refund methods', async () => {
      const user = userEvent.setup();

      // Default should be cash for cash payment
      expect(screen.getByDisplayValue('cash')).toBeInTheDocument();

      // Change to external POS
      const methodSelect = screen.getByLabelText('Refund Method');
      await user.click(methodSelect);
      await user.click(screen.getAllByText('External POS Refund')[0]!);

      expect(screen.getByDisplayValue('external_pos')).toBeInTheDocument();
    });

    it('should allow refund without reason', async () => {
      const user = userEvent.setup();

      const reasonField = screen.getByLabelText(/refund reason/i);
      expect(reasonField).not.toBeRequired();

      // Button should be enabled even without reason
      const submitButton = screen.getByRole('button', {
        name: /record full refund/i,
      });
      expect(submitButton).not.toBeDisabled();

      // Enter reason
      await user.type(reasonField, 'Customer not satisfied');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('refund processing', () => {
    it('should process full refund successfully', async () => {
      const user = userEvent.setup();

      mockProcessManualRefund.mockResolvedValueOnce({
        success: true,
        data: {
          refundId: 'refund-123',
          refundMethod: 'cash',
          amountRefunded: 5000,
        },
      });

      render(
        <ManualRefundManagement
          payment={mockCashPayment}
          onRefundComplete={mockOnRefundComplete}
        />
      );

      await user.click(screen.getByText('Process Refund'));

      // Fill in reason
      const reasonField = screen.getByLabelText(/refund reason/i);
      await user.type(reasonField, 'Customer requested refund');

      // Submit
      const submitButton = screen.getByRole('button', {
        name: /record full refund/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockProcessManualRefund).toHaveBeenCalledWith(
          'payment-123',
          5000,
          'Customer requested refund',
          'cash'
        );
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        'Full refund recorded successfully'
      );
      expect(mockOnRefundComplete).toHaveBeenCalled();
    });

    it('should process partial refund successfully', async () => {
      const user = userEvent.setup();

      mockProcessManualRefund.mockResolvedValueOnce({
        success: true,
        data: {
          refundId: 'refund-456',
          refundMethod: 'external_pos',
          amountRefunded: 2500,
        },
      });

      render(
        <ManualRefundManagement
          payment={mockExternalPosPayment}
          onRefundComplete={mockOnRefundComplete}
        />
      );

      await user.click(screen.getByText('Process Refund'));

      // Switch to partial refund
      const refundTypeSelect = screen.getByLabelText('Refund Type');
      await user.click(refundTypeSelect);
      await user.click(screen.getByText('Partial Refund'));

      // Set amount
      const amountField = screen.getByLabelText('Refund Amount');
      await user.clear(amountField);
      await user.type(amountField, '25');

      // Set method to external POS
      const methodSelect = screen.getByLabelText('Refund Method');
      await user.click(methodSelect);
      await user.click(screen.getAllByText('External POS Refund')[0]!);

      // Force dropdown to close by pressing Escape
      await user.keyboard('{Escape}');

      // Fill in reason
      const reasonField = screen.getByLabelText(/refund reason/i);
      await user.type(reasonField, 'Partial alteration issue');

      // Submit
      const submitButton = screen.getByRole('button', {
        name: 'Record Partial Refund',
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockProcessManualRefund).toHaveBeenCalledWith(
          'payment-456',
          2500,
          'Partial alteration issue',
          'external_pos'
        );
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        'Partial refund recorded successfully'
      );
      expect(mockOnRefundComplete).toHaveBeenCalled();
    });

    it('should handle refund processing errors', async () => {
      const user = userEvent.setup();

      mockProcessManualRefund.mockResolvedValueOnce({
        success: false,
        error: 'Refund amount cannot exceed remaining refundable amount',
      });

      // Use a payment that has already been partially refunded
      const partiallyRefundedPayment = {
        ...mockCashPayment,
        refunded_amount_cents: 4000, // $40.00 already refunded, $10.00 remaining
      };

      render(
        <ManualRefundManagement
          payment={partiallyRefundedPayment}
          onRefundComplete={mockOnRefundComplete}
        />
      );

      await user.click(screen.getByText('Process Refund'));

      // Fill in reason
      const reasonField = screen.getByLabelText(/refund reason/i);
      await user.type(reasonField, 'Test refund');

      // Submit
      const submitButton = screen.getByRole('button', {
        name: 'Record Partial Refund',
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Refund amount cannot exceed remaining refundable amount'
        );
      });

      expect(mockOnRefundComplete).not.toHaveBeenCalled();
    });

    it('should show loading state during processing', async () => {
      const user = userEvent.setup();

      // Mock a slow response
      mockProcessManualRefund.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: {
                    refundId: 'test',
                    refundMethod: 'cash',
                    amountRefunded: 5000,
                  },
                }),
              100
            )
          )
      );

      render(
        <ManualRefundManagement
          payment={mockCashPayment}
          onRefundComplete={mockOnRefundComplete}
        />
      );

      await user.click(screen.getByText('Process Refund'));

      // Fill in reason
      const reasonField = screen.getByLabelText(/refund reason/i);
      await user.type(reasonField, 'Test refund');

      // Submit
      const submitButton = screen.getByRole('button', {
        name: 'Record Full Refund',
      });
      await user.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Recording Refund...')).toBeInTheDocument();
      });
      expect(submitButton).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(
          screen.queryByText('Recording Refund...')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('validation', () => {
    it('should validate refund amount is positive', async () => {
      const user = userEvent.setup();

      render(
        <ManualRefundManagement
          payment={mockCashPayment}
          onRefundComplete={mockOnRefundComplete}
        />
      );

      await user.click(screen.getByText('Process Refund'));

      // Switch to partial refund
      const refundTypeSelect = screen.getByLabelText('Refund Type');
      await user.click(refundTypeSelect);
      await user.click(screen.getByText('Partial Refund'));

      // Set amount to 0
      const amountField = screen.getByLabelText('Refund Amount');
      await user.clear(amountField);
      await user.type(amountField, '0');

      // Fill in reason
      const reasonField = screen.getByLabelText(/refund reason/i);
      await user.type(reasonField, 'Test refund');

      // Submit button should be disabled
      const submitButton = screen.getByRole('button', {
        name: /record partial refund/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it('should show client-side validation for excessive amount', async () => {
      const user = userEvent.setup();

      mockProcessManualRefund.mockResolvedValueOnce({
        success: false,
        error: 'Refund amount cannot exceed remaining refundable amount',
      });

      render(
        <ManualRefundManagement
          payment={mockCashPayment}
          onRefundComplete={mockOnRefundComplete}
        />
      );

      await user.click(screen.getByText('Process Refund'));

      // Switch to partial refund
      const refundTypeSelect = screen.getByLabelText('Refund Type');
      await user.click(refundTypeSelect);
      await user.click(screen.getByText('Partial Refund'));

      // Set amount higher than payment
      const amountField = screen.getByLabelText('Refund Amount');
      await user.clear(amountField);
      await user.type(amountField, '100'); // More than $50 payment

      // Fill in reason
      const reasonField = screen.getByLabelText(/refund reason/i);
      await user.type(reasonField, 'Test refund');

      // Submit
      const submitButton = screen.getByRole('button', {
        name: /record partial refund/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Refund amount cannot exceed remaining refundable amount'
        );
      });
    });
  });
});
