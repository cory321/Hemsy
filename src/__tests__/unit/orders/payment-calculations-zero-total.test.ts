import { calculatePaymentStatus } from '@/lib/utils/payment-calculations';

describe('Payment Calculations - Zero Total Edge Cases', () => {
  describe('when order total is $0 due to removed services', () => {
    it('should show overpaid status when payments exist', () => {
      const result = calculatePaymentStatus(0, [
        {
          id: '1',
          amount_cents: 100, // $1 payment
          refunded_amount_cents: 0,
          status: 'completed',
        },
      ]);

      expect(result.totalPaid).toBe(100);
      expect(result.netPaid).toBe(100);
      expect(result.amountDue).toBe(-100); // Negative indicates credit
      expect(result.paymentStatus).toBe('overpaid');
    });

    it('should show unpaid status when no payments exist', () => {
      const result = calculatePaymentStatus(0, []);

      expect(result.totalPaid).toBe(0);
      expect(result.netPaid).toBe(0);
      expect(result.amountDue).toBe(0);
      expect(result.paymentStatus).toBe('unpaid');
    });

    it('should calculate correct credit balance with multiple payments', () => {
      const result = calculatePaymentStatus(0, [
        {
          id: '1',
          amount_cents: 500, // $5 payment
          refunded_amount_cents: 0,
          status: 'completed',
        },
        {
          id: '2',
          amount_cents: 300, // $3 payment
          refunded_amount_cents: 100, // $1 refunded
          status: 'partially_refunded',
        },
      ]);

      expect(result.totalPaid).toBe(800);
      expect(result.totalRefunded).toBe(100);
      expect(result.netPaid).toBe(700); // $7 net paid
      expect(result.amountDue).toBe(-700); // $7 credit
      expect(result.paymentStatus).toBe('overpaid');
    });
  });

  describe('when order transitions from having charges to no charges', () => {
    it('should properly reflect credit balance after service removal', () => {
      // Simulate: Order had $10 in services, customer paid $10, then all services removed
      const result = calculatePaymentStatus(0, [
        {
          id: '1',
          amount_cents: 1000, // $10 payment
          refunded_amount_cents: 0,
          status: 'completed',
        },
      ]);

      expect(result.paymentStatus).toBe('overpaid');
      expect(result.amountDue).toBe(-1000); // $10 credit
    });
  });
});
