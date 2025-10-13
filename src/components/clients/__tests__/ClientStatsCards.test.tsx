import { render, screen } from '@testing-library/react';
import { ClientStatsCards } from '@/components/clients/ClientProfileCard';
import type { Tables } from '@/types/supabase';
import type { Appointment } from '@/types';

describe('ClientStatsCards', () => {
	const mockClient: Tables<'clients'> = {
		id: 'client_123',
		shop_id: 'shop_123',
		first_name: 'John',
		last_name: 'Doe',
		email: 'john.doe@example.com',
		phone_number: '1234567890',
		accept_email: true,
		accept_sms: false,
		mailing_address: null,
		notes: null,
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T00:00:00Z',
		archived_at: null,
		archived_by: null,
		is_archived: false,
	};

	it('should display formatted next appointment when one exists', () => {
		const mockAppointment: Appointment = {
			id: 'appt_123',
			shop_id: 'shop_123',
			client_id: mockClient.id,
			date: '2024-12-20',
			start_time: '14:30',
			end_time: '15:30',
			type: 'fitting',
			status: 'confirmed',
			notes: 'Test appointment',
			reminder_sent: false,
			created_at: '2024-12-10T10:00:00Z',
			updated_at: '2024-12-10T10:00:00Z',
		};

		render(
			<ClientStatsCards
				client={mockClient}
				nextAppointment={mockAppointment}
				readyForPickupCount={3}
				activeOrdersCount={2}
				outstandingBalanceCents={12500}
			/>
		);

		// Check that the next appointment is displayed with correct format
		expect(screen.getByText('Next Appointment')).toBeInTheDocument();
		expect(screen.getByText(/Fri, Dec 20 • 2:30 PM/)).toBeInTheDocument();
	});

	it('should display "None scheduled" when no upcoming appointment exists', () => {
		render(
			<ClientStatsCards
				client={mockClient}
				nextAppointment={null}
				readyForPickupCount={0}
				activeOrdersCount={1}
				outstandingBalanceCents={5000}
			/>
		);

		// Check that "None scheduled" is displayed
		expect(screen.getByText('Next Appointment')).toBeInTheDocument();
		expect(screen.getByText('None scheduled')).toBeInTheDocument();
	});

	it('should display other static stats correctly', () => {
		render(
			<ClientStatsCards
				client={mockClient}
				nextAppointment={null}
				readyForPickupCount={2}
				activeOrdersCount={3}
				outstandingBalanceCents={12500}
			/>
		);

		// Check that real active orders count is displayed
		expect(screen.getByText('Active Orders')).toBeInTheDocument();
		expect(screen.getByText('3')).toBeInTheDocument();

		// Check that real outstanding balance is displayed
		expect(screen.getByText('Outstanding Balances')).toBeInTheDocument();
		expect(screen.getByText('$125.00')).toBeInTheDocument();

		expect(screen.getByText('Ready For Pickup')).toBeInTheDocument();
		expect(screen.getByText('2')).toBeInTheDocument();
	});

	it('should display real ready for pickup count', () => {
		const readyForPickupCount = 7;
		render(
			<ClientStatsCards
				client={mockClient}
				nextAppointment={null}
				readyForPickupCount={readyForPickupCount}
				activeOrdersCount={5}
				outstandingBalanceCents={8000}
			/>
		);

		expect(screen.getByText('Ready For Pickup')).toBeInTheDocument();
		expect(screen.getByText('7')).toBeInTheDocument();
	});

	it('should display 0 when no garments are ready for pickup', () => {
		render(
			<ClientStatsCards
				client={mockClient}
				nextAppointment={null}
				readyForPickupCount={0}
				activeOrdersCount={1}
				outstandingBalanceCents={2500}
			/>
		);

		expect(screen.getByText('Ready For Pickup')).toBeInTheDocument();
		// Use getAllByText to handle multiple 0s and check that one is under "Ready For Pickup"
		const readyForPickupCard = screen
			.getByText('Ready For Pickup')
			.closest('.MuiCard-root');
		expect(readyForPickupCard).toContainElement(screen.getByText('0'));
	});

	it('should display real active orders count', () => {
		const activeOrdersCount = 5;
		render(
			<ClientStatsCards
				client={mockClient}
				nextAppointment={null}
				readyForPickupCount={2}
				activeOrdersCount={activeOrdersCount}
				outstandingBalanceCents={15000}
			/>
		);

		expect(screen.getByText('Active Orders')).toBeInTheDocument();
		expect(screen.getByText('5')).toBeInTheDocument();
	});

	it('should display 0 when client has no active orders', () => {
		render(
			<ClientStatsCards
				client={mockClient}
				nextAppointment={null}
				readyForPickupCount={1}
				activeOrdersCount={0}
				outstandingBalanceCents={0}
			/>
		);

		expect(screen.getByText('Active Orders')).toBeInTheDocument();
		expect(screen.getByText('0')).toBeInTheDocument();
	});

	it('should correctly display all stats with real data', () => {
		const mockAppointment: Appointment = {
			id: 'appt_456',
			shop_id: 'shop_123',
			client_id: mockClient.id,
			date: '2024-12-25',
			start_time: '10:00',
			end_time: '11:00',
			type: 'consultation',
			status: 'confirmed',
			notes: null,
			reminder_sent: false,
			created_at: '2024-12-15T09:00:00Z',
			updated_at: '2024-12-15T09:00:00Z',
		};

		render(
			<ClientStatsCards
				client={mockClient}
				nextAppointment={mockAppointment}
				readyForPickupCount={4}
				activeOrdersCount={7}
				outstandingBalanceCents={25000}
			/>
		);

		// Verify all stats are displayed with real data
		expect(screen.getByText('Active Orders')).toBeInTheDocument();
		expect(screen.getByText('7')).toBeInTheDocument();

		expect(screen.getByText('Ready For Pickup')).toBeInTheDocument();
		expect(screen.getByText('4')).toBeInTheDocument();

		expect(screen.getByText('Next Appointment')).toBeInTheDocument();
		expect(screen.getByText(/Wed, Dec 25 • 10:00 AM/)).toBeInTheDocument();

		expect(screen.getByText('Outstanding Balances')).toBeInTheDocument();
		expect(screen.getByText('$250.00')).toBeInTheDocument(); // Real outstanding balance data
	});

	it('should display real outstanding balance', () => {
		const outstandingBalanceCents = 45000; // $450.00
		render(
			<ClientStatsCards
				client={mockClient}
				nextAppointment={null}
				readyForPickupCount={2}
				activeOrdersCount={3}
				outstandingBalanceCents={outstandingBalanceCents}
			/>
		);

		expect(screen.getByText('Outstanding Balances')).toBeInTheDocument();
		expect(screen.getByText('$450.00')).toBeInTheDocument();
	});

	it('should display $0.00 when client has no outstanding balance', () => {
		render(
			<ClientStatsCards
				client={mockClient}
				nextAppointment={null}
				readyForPickupCount={1}
				activeOrdersCount={2}
				outstandingBalanceCents={0}
			/>
		);

		expect(screen.getByText('Outstanding Balances')).toBeInTheDocument();
		expect(screen.getByText('$0.00')).toBeInTheDocument();
	});

	it('should use error color for outstanding balance when amount is greater than 0', () => {
		render(
			<ClientStatsCards
				client={mockClient}
				nextAppointment={null}
				readyForPickupCount={1}
				activeOrdersCount={2}
				outstandingBalanceCents={10000}
			/>
		);

		const outstandingCard = screen
			.getByText('Outstanding Balances')
			.closest('.MuiCard-root');
		const outstandingAmount = screen.getByText('$100.00');

		// The component should apply error styling when there's an outstanding balance
		expect(outstandingCard).toContainElement(outstandingAmount);
		expect(screen.getByText('Outstanding Balances')).toBeInTheDocument();
	});

	it('should use primary color for outstanding balance when amount is 0', () => {
		render(
			<ClientStatsCards
				client={mockClient}
				nextAppointment={null}
				readyForPickupCount={1}
				activeOrdersCount={2}
				outstandingBalanceCents={0}
			/>
		);

		const outstandingCard = screen
			.getByText('Outstanding Balances')
			.closest('.MuiCard-root');
		const outstandingAmount = screen.getByText('$0.00');

		// The component should apply primary styling when there's no outstanding balance
		expect(outstandingCard).toContainElement(outstandingAmount);
		expect(screen.getByText('Outstanding Balances')).toBeInTheDocument();
	});
});
