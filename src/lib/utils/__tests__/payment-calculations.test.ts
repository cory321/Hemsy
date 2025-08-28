import {
  calculatePaymentStatus,
  type PaymentInfo,
} from '../payment-calculations';

describe('calculatePaymentStatus', () => {
  it('should calculate correct payment status for fully paid order', () => {
    const payments: PaymentInfo[] = [
      {
        id: '1',
        amount_cents: 10000,
        refunded_amount_cents: 0,
        status: 'completed',
        type: 'payment',
      },
    ];

    const result = calculatePaymentStatus(10000, payments);

    expect(result.totalPaid).toBe(10000);
    expect(result.totalRefunded).toBe(0);
    expect(result.netPaid).toBe(10000);
    expect(result.amountDue).toBe(0);
    expect(result.percentage).toBe(100);
    expect(result.paymentStatus).toBe('paid');
  });

  it('should calculate correct payment status for partially refunded payment', () => {
    const payments: PaymentInfo[] = [
      {
        id: '1',
        amount_cents: 10000,
        refunded_amount_cents: 5000,
        status: 'partially_refunded',
        type: 'payment',
      },
    ];

    const result = calculatePaymentStatus(10000, payments);

    expect(result.totalPaid).toBe(10000);
    expect(result.totalRefunded).toBe(5000);
    expect(result.netPaid).toBe(5000);
    expect(result.amountDue).toBe(5000);
    expect(result.percentage).toBe(50);
    expect(result.paymentStatus).toBe('partial');
  });

  it('should exclude refund transactions to avoid double-counting', () => {
    const payments: PaymentInfo[] = [
      {
        id: '1',
        amount_cents: 10000,
        refunded_amount_cents: 5000,
        status: 'partially_refunded',
        type: 'payment',
      },
      {
        id: '2',
        amount_cents: -5000,
        refunded_amount_cents: 0,
        status: 'succeeded',
        type: 'refund',
      },
    ];

    const result = calculatePaymentStatus(10000, payments);

    // Should only count the payment transaction, not the refund
    expect(result.totalPaid).toBe(10000);
    expect(result.totalRefunded).toBe(5000);
    expect(result.netPaid).toBe(5000);
    expect(result.amountDue).toBe(5000);
    expect(result.percentage).toBe(50);
    expect(result.paymentStatus).toBe('partial');
  });

  it('should handle fully refunded payments', () => {
    const payments: PaymentInfo[] = [
      {
        id: '1',
        amount_cents: 10000,
        refunded_amount_cents: 10000,
        status: 'refunded',
        type: 'payment',
      },
    ];

    const result = calculatePaymentStatus(10000, payments);

    expect(result.totalPaid).toBe(10000);
    expect(result.totalRefunded).toBe(10000);
    expect(result.netPaid).toBe(0);
    expect(result.amountDue).toBe(10000);
    expect(result.percentage).toBe(0);
    expect(result.paymentStatus).toBe('unpaid');
  });

  it('should handle overpayment scenarios', () => {
    const payments: PaymentInfo[] = [
      {
        id: '1',
        amount_cents: 15000,
        refunded_amount_cents: 0,
        status: 'completed',
        type: 'payment',
      },
    ];

    const result = calculatePaymentStatus(10000, payments);

    expect(result.totalPaid).toBe(15000);
    expect(result.totalRefunded).toBe(0);
    expect(result.netPaid).toBe(15000);
    expect(result.amountDue).toBe(-5000); // Negative indicates credit
    expect(result.percentage).toBe(150);
    expect(result.paymentStatus).toBe('overpaid');
  });

  it('should handle payments without type field (backward compatibility)', () => {
    const payments: PaymentInfo[] = [
      {
        id: '1',
        amount_cents: 10000,
        refunded_amount_cents: 2500,
        status: 'partially_refunded',
        // No type field
      },
    ];

    const result = calculatePaymentStatus(10000, payments);

    expect(result.totalPaid).toBe(10000);
    expect(result.totalRefunded).toBe(2500);
    expect(result.netPaid).toBe(7500);
    expect(result.amountDue).toBe(2500);
    expect(result.percentage).toBe(75);
    expect(result.paymentStatus).toBe('partial');
  });

  it('should correctly handle Order COR-25-0162 scenario', () => {
    // This test represents the exact scenario from the bug report
    const payments: PaymentInfo[] = [
      {
        id: 'e49d6f98-82ce-4d7d-b13f-0e0d6ee5d957',
        amount_cents: 10000,
        refunded_amount_cents: 5000,
        status: 'partially_refunded',
        type: 'payment',
      },
      {
        id: '16f4e8fd-00c9-4604-afbe-8c77d89531c4',
        amount_cents: -5000,
        status: 'succeeded',
        type: 'refund',
      },
    ];

    const result = calculatePaymentStatus(10000, payments);

    // Should show 50% refunded, not 100%
    expect(result.totalPaid).toBe(10000);
    expect(result.totalRefunded).toBe(5000);
    expect(result.netPaid).toBe(5000);
    expect(result.amountDue).toBe(5000);
    expect(result.percentage).toBe(50);
    expect(result.paymentStatus).toBe('partial');
  });
});
