import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import NewOrderClient from '@/app/(app)/orders/new/NewOrderClient';
import { getClient } from '@/lib/actions/clients';

// Mock dependencies
jest.mock('@/lib/actions/clients');
jest.mock('next/navigation', () => ({
	useRouter: () => ({
		push: jest.fn(),
		replace: jest.fn(),
		prefetch: jest.fn(),
	}),
	useSearchParams: jest.fn(),
}));

// Mock the OrderFlowStepper component
jest.mock('@/components/orders/OrderFlowStepper', () => {
	const MockOrderFlowStepper = () => {
		const { useOrderFlow } = require('@/contexts/OrderFlowContext');
		const { orderDraft } = useOrderFlow();
		return (
			<div data-testid="order-flow-stepper">
				<div data-testid="client-info">
					{orderDraft.client
						? `Selected: ${orderDraft.client.first_name} ${orderDraft.client.last_name}`
						: 'No client selected'}
				</div>
			</div>
		);
	};
	MockOrderFlowStepper.displayName = 'MockOrderFlowStepper';
	return MockOrderFlowStepper;
});

// Mock next/link
jest.mock('next/link', () => {
	return {
		__esModule: true,
		default: ({
			children,
			href,
		}: {
			children: React.ReactNode;
			href: string;
		}) => <a href={href}>{children}</a>,
	};
});

const { useSearchParams } = require('next/navigation');

describe('NewOrderPage', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		localStorage.clear();
	});

	it('should render without clientId in URL', () => {
		useSearchParams.mockReturnValue({
			get: jest.fn().mockReturnValue(null),
		});

		render(<NewOrderClient taxPercent={0} />);

		expect(screen.getByText('Create New Order')).toBeInTheDocument();
		expect(screen.getByTestId('client-info')).toHaveTextContent(
			'No client selected'
		);
	});

	it('should fetch and display client when clientId is in URL', async () => {
		const mockClient = {
			id: 'client-123',
			first_name: 'John',
			last_name: 'Doe',
			email: 'john@example.com',
			phone_number: '1234567890',
		};

		(getClient as jest.Mock).mockResolvedValue(mockClient);

		useSearchParams.mockReturnValue({
			get: jest.fn().mockImplementation((key) => {
				if (key === 'clientId') return 'client-123';
				return null;
			}),
		});

		render(<NewOrderClient initialClientId="client-123" taxPercent={0} />);

		await waitFor(() => {
			expect(screen.getByTestId('client-info')).toHaveTextContent(
				'Selected: John Doe'
			);
		});

		expect(getClient).toHaveBeenCalledWith('client-123');
	});

	it('should have cancel link that goes to orders page', () => {
		useSearchParams.mockReturnValue({
			get: jest.fn().mockReturnValue(null),
		});

		render(<NewOrderClient taxPercent={0} />);

		const cancelLink = screen.getByText('Cancel');
		expect(cancelLink).toHaveAttribute('href', '/orders');
	});
});
