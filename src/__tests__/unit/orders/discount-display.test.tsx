import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnhancedInvoiceLineItems from '@/components/invoices/EnhancedInvoiceLineItems';

// Mock the router
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: jest.fn(),
	}),
}));

describe('Discount Display on Orders Page', () => {
	const mockGarments = [
		{
			id: 'garment-1',
			name: 'Wedding Dress',
			stage: 'new',
		},
	];

	const mockLineItems = [
		{
			id: 'item-1',
			garment_id: 'garment-1',
			name: 'Hemming',
			quantity: 1,
			unit_price_cents: 5000,
			line_total_cents: 5000,
			is_removed: false,
		},
		{
			id: 'item-2',
			garment_id: 'garment-1',
			name: 'Alterations',
			quantity: 2,
			unit_price_cents: 3000,
			line_total_cents: 6000,
			is_removed: false,
		},
	];

	describe('EnhancedInvoiceLineItems with Discount', () => {
		it('should display discount in pricing breakdown', () => {
			render(
				<EnhancedInvoiceLineItems
					items={mockLineItems}
					garments={mockGarments}
					discountCents={1000} // $10 discount
					taxCents={1000} // $10 tax
				/>
			);

			// Check that subtotal is displayed
			expect(screen.getByText('Subtotal')).toBeInTheDocument();

			// Check that discount is displayed
			expect(screen.getByText('Discount')).toBeInTheDocument();
			expect(screen.getByText('-$10.00')).toBeInTheDocument();

			// Check that tax is displayed
			expect(screen.getByText('Sales Tax')).toBeInTheDocument();
			expect(screen.getByText('$10.00')).toBeInTheDocument();

			// Check that total is calculated correctly
			// Subtotal: $110, Discount: -$10, Tax: $10, Total: $110
			const totalElements = screen.getAllByText('$110.00');
			expect(totalElements.length).toBeGreaterThan(0);
		});

		it('should not display discount section when no discount is applied', () => {
			render(
				<EnhancedInvoiceLineItems
					items={mockLineItems}
					garments={mockGarments}
					discountCents={0}
					taxCents={0}
				/>
			);

			// Check that discount is NOT displayed
			expect(screen.queryByText('Discount')).not.toBeInTheDocument();
			expect(screen.queryByText('Sales Tax')).not.toBeInTheDocument();

			// Should only show Order Summary
			expect(screen.getByText('Order Summary')).toBeInTheDocument();
		});

		it('should calculate total correctly with discount', () => {
			render(
				<EnhancedInvoiceLineItems
					items={mockLineItems}
					garments={mockGarments}
					discountCents={2000} // $20 discount
					taxCents={900} // $9 tax (on discounted amount)
				/>
			);

			// Check calculations
			// Subtotal: $110
			// Discount: -$20
			// Subtotal after discount: $90
			// Tax: $9
			// Total: $99

			expect(screen.getByText('-$20.00')).toBeInTheDocument();
			expect(screen.getByText('$9.00')).toBeInTheDocument();

			// Find the total in the Total row (not the header)
			const totalElements = screen.getAllByText('Total');
			const totalRow = totalElements
				.find(
					(el) =>
						el.tagName === 'H6' ||
						el.classList.contains('MuiTypography-subtitle1')
				)
				?.closest('tr');
			expect(totalRow).toBeDefined();
			expect(totalRow).toHaveTextContent('$99.00');
		});
	});
});
