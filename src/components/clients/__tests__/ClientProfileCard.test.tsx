import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ClientProfileCard from '../ClientProfileCard';
import type { Tables } from '@/types/supabase';
import type { Appointment } from '@/types';

// Mock client data
const mockClient: Tables<'clients'> = {
	id: '1',
	first_name: 'John',
	last_name: 'Doe',
	email: 'john.doe@example.com',
	phone_number: '5551234567',
	accept_email: true,
	accept_sms: false,
	mailing_address: null,
	notes: null,
	created_at: '2024-01-01T00:00:00.000Z',
	updated_at: '2024-01-01T00:00:00.000Z',
	shop_id: 'shop-1',
	archived_at: null,
	archived_by: null,
	is_archived: false,
};

const mockAppointment: Appointment = {
	id: 'appt-1',
	shop_id: 'shop-1',
	client_id: '1',
	date: '2024-10-15',
	start_time: '14:30',
	end_time: '15:30',
	status: 'confirmed',
	notes: null,
	created_at: '2024-01-01T00:00:00.000Z',
	updated_at: '2024-01-01T00:00:00.000Z',
	type: 'fitting',
};

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
	return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe('ClientProfileCard', () => {
	describe('Stats Display', () => {
		it('renders all four stat cards', () => {
			renderWithTheme(
				<ClientProfileCard
					client={mockClient}
					activeOrdersCount={3}
					outstandingBalanceCents={5000}
					readyForPickupCount={2}
					nextAppointment={mockAppointment}
				/>
			);

			expect(screen.getByText('Active Orders')).toBeInTheDocument();
			expect(screen.getByText('Outstanding Balance')).toBeInTheDocument();
			expect(screen.getByText('Ready For Pickup')).toBeInTheDocument();
			expect(screen.getByText('Next Appointment')).toBeInTheDocument();
		});

		it('displays active orders count correctly', () => {
			renderWithTheme(
				<ClientProfileCard
					client={mockClient}
					activeOrdersCount={5}
					outstandingBalanceCents={0}
					readyForPickupCount={0}
				/>
			);

			expect(screen.getByText('5')).toBeInTheDocument();
		});

		it('displays zero active orders', () => {
			renderWithTheme(
				<ClientProfileCard
					client={mockClient}
					activeOrdersCount={0}
					outstandingBalanceCents={0}
					readyForPickupCount={0}
				/>
			);

			// Multiple "0" values will be present (active orders and ready for pickup)
			const zeros = screen.getAllByText('0');
			expect(zeros.length).toBeGreaterThanOrEqual(2);
		});

		it('formats outstanding balance as currency', () => {
			renderWithTheme(
				<ClientProfileCard
					client={mockClient}
					activeOrdersCount={0}
					outstandingBalanceCents={12599} // $125.99
					readyForPickupCount={0}
				/>
			);

			expect(screen.getByText('$125.99')).toBeInTheDocument();
		});

		it('displays zero balance correctly', () => {
			renderWithTheme(
				<ClientProfileCard
					client={mockClient}
					activeOrdersCount={0}
					outstandingBalanceCents={0}
					readyForPickupCount={0}
				/>
			);

			expect(screen.getByText('$0.00')).toBeInTheDocument();
		});

		it('displays ready for pickup count', () => {
			renderWithTheme(
				<ClientProfileCard
					client={mockClient}
					activeOrdersCount={0}
					outstandingBalanceCents={0}
					readyForPickupCount={3}
				/>
			);

			expect(screen.getByText('3')).toBeInTheDocument();
		});
	});

	describe('Next Appointment Display', () => {
		it('formats next appointment date and time correctly', () => {
			renderWithTheme(
				<ClientProfileCard
					client={mockClient}
					activeOrdersCount={0}
					outstandingBalanceCents={0}
					readyForPickupCount={0}
					nextAppointment={mockAppointment}
				/>
			);

			// The appointment should be formatted as "Tue, Oct 15 • 2:30 PM"
			expect(screen.getByText(/Oct 15/)).toBeInTheDocument();
			expect(screen.getByText(/2:30 PM/)).toBeInTheDocument();
		});

		it('displays "None scheduled" when no appointment exists', () => {
			renderWithTheme(
				<ClientProfileCard
					client={mockClient}
					activeOrdersCount={0}
					outstandingBalanceCents={0}
					readyForPickupCount={0}
					nextAppointment={null}
				/>
			);

			expect(screen.getByText('None scheduled')).toBeInTheDocument();
		});

		it('displays "None scheduled" when appointment is undefined', () => {
			renderWithTheme(
				<ClientProfileCard
					client={mockClient}
					activeOrdersCount={0}
					outstandingBalanceCents={0}
					readyForPickupCount={0}
				/>
			);

			expect(screen.getByText('None scheduled')).toBeInTheDocument();
		});
	});

	describe('Default Values', () => {
		it('uses default values when stats are not provided', () => {
			renderWithTheme(<ClientProfileCard client={mockClient} />);

			// Should default to 0 for counts and $0.00 for balance
			const zeros = screen.getAllByText('0');
			expect(zeros.length).toBeGreaterThanOrEqual(2); // At least active orders and ready for pickup

			expect(screen.getByText('$0.00')).toBeInTheDocument();
			expect(screen.getByText('None scheduled')).toBeInTheDocument();
		});
	});

	describe('Layout and Structure', () => {
		it('renders within a Card component', () => {
			const { container } = renderWithTheme(
				<ClientProfileCard client={mockClient} />
			);

			const card = container.querySelector('.MuiCard-root');
			expect(card).toBeInTheDocument();
		});

		it('displays all stats in a consistent layout', () => {
			renderWithTheme(
				<ClientProfileCard
					client={mockClient}
					activeOrdersCount={5}
					outstandingBalanceCents={10000}
					readyForPickupCount={2}
					nextAppointment={mockAppointment}
				/>
			);

			// All four stat titles should be present
			expect(screen.getByText('Active Orders')).toBeInTheDocument();
			expect(screen.getByText('Outstanding Balance')).toBeInTheDocument();
			expect(screen.getByText('Ready For Pickup')).toBeInTheDocument();
			expect(screen.getByText('Next Appointment')).toBeInTheDocument();
		});
	});

	describe('Currency Formatting', () => {
		it('formats large amounts correctly', () => {
			renderWithTheme(
				<ClientProfileCard
					client={mockClient}
					outstandingBalanceCents={999999} // $9,999.99
				/>
			);

			expect(screen.getByText('$9,999.99')).toBeInTheDocument();
		});

		it('formats small amounts with proper decimals', () => {
			renderWithTheme(
				<ClientProfileCard
					client={mockClient}
					outstandingBalanceCents={150} // $1.50
				/>
			);

			expect(screen.getByText('$1.50')).toBeInTheDocument();
		});

		it('handles single digit cents correctly', () => {
			renderWithTheme(
				<ClientProfileCard
					client={mockClient}
					outstandingBalanceCents={505} // $5.05
				/>
			);

			expect(screen.getByText('$5.05')).toBeInTheDocument();
		});
	});
});
