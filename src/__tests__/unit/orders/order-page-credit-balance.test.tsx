import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedInvoiceLineItems from '@/components/invoices/EnhancedInvoiceLineItems';

describe('Order Page - Credit Balance Display', () => {
  const mockGarments = [
    {
      id: 'garment1',
      name: 'Test Garment',
      stage: 'new',
    },
  ];

  const mockPayments = [
    {
      id: 'payment1',
      payment_type: 'payment',
      payment_method: 'cash',
      amount_cents: 100, // $1 payment
      status: 'completed',
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  describe('when all services are removed but payments exist', () => {
    it('should show credit balance instead of collect payment button', () => {
      const mockItems = [
        {
          id: 'service1',
          garment_id: 'garment1',
          name: 'Test Service',
          quantity: 1,
          unit_price_cents: 100,
          line_total_cents: 100,
          is_removed: true, // Service is removed
          removed_at: '2024-01-02T00:00:00Z',
          removal_reason: 'Customer request',
        },
      ];

      render(
        <EnhancedInvoiceLineItems
          items={mockItems}
          garments={mockGarments}
          showRemoved={true}
          payments={mockPayments}
          onRecordPayment={jest.fn()}
        />
      );

      // Should show credit balance
      expect(screen.getByText('Credit Balance')).toBeInTheDocument();

      // Find the Total Amount Due row and check the amount
      const totalRow = screen.getByRole('row', { name: /credit balance/i });
      expect(within(totalRow).getByText('$1.00')).toBeInTheDocument();

      // Should NOT show collect payment button
      expect(screen.queryByText('Collect Payment')).not.toBeInTheDocument();

      // Should show the credit message
      expect(
        screen.getByText(/Customer has a credit of \$1\.00/)
      ).toBeInTheDocument();
    });
  });

  describe('when no services and no payments', () => {
    it('should show no charges and no payment button', () => {
      const mockItems: any[] = [];

      render(
        <EnhancedInvoiceLineItems
          items={mockItems}
          garments={mockGarments}
          showRemoved={true}
          payments={[]}
          onRecordPayment={jest.fn()}
        />
      );

      // Should show $0.00 due in the Total Amount Due row
      const totalRow = screen.getByRole('row', { name: /total amount due/i });
      expect(within(totalRow).getByText('$0.00')).toBeInTheDocument();

      // Should NOT show collect payment button when total is 0
      expect(screen.queryByText('Collect Payment')).not.toBeInTheDocument();
    });
  });

  describe('when active services exist with no payments', () => {
    it('should show collect payment button', () => {
      const mockItems = [
        {
          id: 'service1',
          garment_id: 'garment1',
          name: 'Test Service',
          quantity: 1,
          unit_price_cents: 100,
          line_total_cents: 100,
          is_removed: false, // Active service
        },
      ];

      const mockRecordPayment = jest.fn();

      render(
        <EnhancedInvoiceLineItems
          items={mockItems}
          garments={mockGarments}
          showRemoved={true}
          payments={[]}
          onRecordPayment={mockRecordPayment}
        />
      );

      // Should show amount due
      expect(screen.getByText('Total Amount Due')).toBeInTheDocument();

      // Find the Total Amount Due row and check the amount
      const totalRow = screen.getByRole('row', { name: /total amount due/i });
      expect(within(totalRow).getByText('$1.00')).toBeInTheDocument();

      // Should show collect payment button
      expect(screen.getByText('Collect Payment')).toBeInTheDocument();
    });
  });
});
