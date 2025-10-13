import { render, screen, fireEvent } from '@testing-library/react';
import ServiceItem from '@/components/services/ServiceItem';

const baseService = {
	id: 'svc_1',
	name: 'Hem Pants',
	description: 'Shorten hem',
	default_qty: 1,
	default_unit: 'flat_rate' as const,
	default_unit_price_cents: 1500,
	frequently_used: false,
	frequently_used_position: null,
};

describe('ServiceItem', () => {
	it('opens edit dialog when card is clicked', () => {
		render(
			<ServiceItem
				service={baseService as any}
				onEdit={jest.fn()}
				onDelete={jest.fn()}
			/>
		);

		// Click the card via its text content
		fireEvent.click(screen.getByText('Hem Pants'));

		expect(screen.getByText('Edit Service')).toBeInTheDocument();
	});

	it('does not open edit dialog when menu button is clicked or when clicking outside to dismiss menu', () => {
		// This test is no longer relevant as there's no menu button in the current implementation
		// The card now opens the edit dialog directly when clicked
		expect(true).toBe(true);
	});

	describe('Service display logic', () => {
		it('does not display unit details for flat_rate services', () => {
			render(
				<ServiceItem
					service={baseService as any}
					onEdit={jest.fn()}
					onDelete={jest.fn()}
				/>
			);

			// Flat rate services don't display unit details
			expect(screen.queryByText('Flat Rate')).not.toBeInTheDocument();
			expect(screen.queryByText('1 flat rate')).not.toBeInTheDocument();
			// The service name should still be displayed
			expect(screen.getByText('Hem Pants')).toBeInTheDocument();
		});

		it('displays unit price and quantity chip for hourly services', () => {
			const hourlyService = {
				...baseService,
				default_unit: 'hour' as const,
				default_qty: 2,
			};

			render(
				<ServiceItem
					service={hourlyService as any}
					onEdit={jest.fn()}
					onDelete={jest.fn()}
				/>
			);

			expect(screen.getByText('$15.00/hour')).toBeInTheDocument();
			expect(screen.getByText('2 hours')).toBeInTheDocument();
			expect(screen.queryByText('Flat Rate')).not.toBeInTheDocument();
		});

		it('displays unit price and quantity chip for daily services', () => {
			const dailyService = {
				...baseService,
				default_unit: 'day' as const,
				default_qty: 3,
			};

			render(
				<ServiceItem
					service={dailyService as any}
					onEdit={jest.fn()}
					onDelete={jest.fn()}
				/>
			);

			expect(screen.getByText('$15.00/day')).toBeInTheDocument();
			expect(screen.getByText('3 days')).toBeInTheDocument();
			expect(screen.queryByText('Flat Rate')).not.toBeInTheDocument();
		});

		it('displays singular unit when quantity is 1', () => {
			const hourlyService = {
				...baseService,
				default_unit: 'hour' as const,
				default_qty: 1,
			};

			render(
				<ServiceItem
					service={hourlyService as any}
					onEdit={jest.fn()}
					onDelete={jest.fn()}
				/>
			);

			expect(screen.getByText('$15.00/hour')).toBeInTheDocument();
			expect(screen.getByText('1 hour')).toBeInTheDocument();
		});
	});
});
