import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import ClientEditDialog from './ClientEditDialog';
import { updateClient } from '@/lib/actions/clients';
import type { Tables } from '@/types/supabase';

// Mock dependencies
jest.mock('next/navigation', () => ({
	useRouter: jest.fn(),
}));

jest.mock('@/lib/actions/clients', () => ({
	updateClient: jest.fn(),
}));

describe('ClientEditDialog', () => {
	const mockPush = jest.fn();
	const mockRefresh = jest.fn();
	const mockUpdateClient = updateClient as jest.MockedFunction<
		typeof updateClient
	>;

	const mockClient: Tables<'clients'> = {
		id: 'client1',
		shop_id: 'shop1',
		first_name: 'John',
		last_name: 'Doe',
		email: 'john@example.com',
		phone_number: '5551234567',
		accept_email: true,
		accept_sms: false,
		notes: 'Test notes',
		mailing_address: '123 Main St',
		created_at: '2024-01-01T00:00:00Z',
		updated_at: '2024-01-01T00:00:00Z',
		archived_at: null,
		archived_by: null,
		is_archived: false,
	};

	beforeEach(() => {
		jest.clearAllMocks();
		(useRouter as jest.Mock).mockReturnValue({
			push: mockPush,
			refresh: mockRefresh,
		});
	});

	it('renders trigger element and opens dialog on click', async () => {
		const user = userEvent.setup();

		render(
			<ClientEditDialog client={mockClient}>
				<button>Edit Client</button>
			</ClientEditDialog>
		);

		const trigger = screen.getByText('Edit Client');
		expect(trigger).toBeInTheDocument();

		await user.click(trigger);

		expect(
			screen.getByText('Edit Client', { selector: 'h2' })
		).toBeInTheDocument();
		expect(screen.getByDisplayValue('John')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
	});

	it('pre-populates form with client data', async () => {
		const user = userEvent.setup();

		render(
			<ClientEditDialog client={mockClient}>
				<button>Edit</button>
			</ClientEditDialog>
		);

		await user.click(screen.getByText('Edit'));

		expect(screen.getByDisplayValue('John')).toBeInTheDocument();
		expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
		expect(screen.getByDisplayValue('john@example.com')).toBeInTheDocument();
		// Phone input displays formatted value; assert digits match
		const phoneInput = screen.getByLabelText(
			/Phone Number/i
		) as HTMLInputElement;
		expect(phoneInput).toBeInTheDocument();
		expect(phoneInput.value.replace(/\D/g, '')).toBe('5551234567');
		expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument();
		expect(screen.getByDisplayValue('123 Main St')).toBeInTheDocument();

		const emailSwitch = screen.getByRole('checkbox', { name: /accept email/i });
		const smsSwitch = screen.getByRole('checkbox', { name: /accept sms/i });

		expect(emailSwitch).toBeChecked();
		expect(smsSwitch).not.toBeChecked();
	});

	it.skip('validates required fields', async () => {
		const user = userEvent.setup();

		render(
			<ClientEditDialog client={mockClient}>
				<button>Edit</button>
			</ClientEditDialog>
		);

		await user.click(screen.getByText('Edit'));

		// Clear required fields
		const firstNameInput = screen.getByLabelText(/first name/i);
		await user.clear(firstNameInput);

		const submitButton = screen.getByText('Update Client');
		await user.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText('First name is required')).toBeInTheDocument();
		});

		expect(mockUpdateClient).not.toHaveBeenCalled();
	});

	it('submits form with updated data', async () => {
		const user = userEvent.setup();
		mockUpdateClient.mockResolvedValueOnce({
			success: true,
			data: { id: 'client1' },
		} as any);

		render(
			<ClientEditDialog client={mockClient}>
				<button>Edit</button>
			</ClientEditDialog>
		);

		await user.click(screen.getByText('Edit'));

		// Update first name
		const firstNameInput = screen.getByLabelText(/first name/i);
		await user.clear(firstNameInput);
		await user.type(firstNameInput, 'Jane');

		// Toggle SMS preference
		const smsSwitch = screen.getByRole('checkbox', { name: /accept sms/i });
		await user.click(smsSwitch);

		const submitButton = screen.getByText('Update Client');
		await user.click(submitButton);

		await waitFor(() => {
			expect(mockUpdateClient).toHaveBeenCalledWith('client1', {
				first_name: 'Jane',
				last_name: 'Doe',
				email: 'john@example.com',
				phone_number: '5551234567',
				accept_email: true,
				accept_sms: true,
				notes: 'Test notes',
				mailing_address: '123 Main St',
			});
		});

		expect(mockRefresh).toHaveBeenCalled();
	});

	it('handles update errors', async () => {
		const user = userEvent.setup();
		mockUpdateClient.mockRejectedValueOnce(new Error('Update failed'));

		render(
			<ClientEditDialog client={mockClient}>
				<button>Edit</button>
			</ClientEditDialog>
		);

		await user.click(screen.getByText('Edit'));

		const submitButton = screen.getByText('Update Client');
		await user.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText('Update failed')).toBeInTheDocument();
		});

		// Dialog should remain open
		expect(
			screen.getByText('Edit Client', { selector: 'h2' })
		).toBeInTheDocument();
	});

	it('closes dialog on cancel', async () => {
		const user = userEvent.setup();

		render(
			<ClientEditDialog client={mockClient}>
				<button>Edit</button>
			</ClientEditDialog>
		);

		await user.click(screen.getByText('Edit'));
		expect(
			screen.getByText('Edit Client', { selector: 'h2' })
		).toBeInTheDocument();

		const cancelButton = screen.getByText('Cancel');
		await user.click(cancelButton);

		await waitFor(() => {
			expect(
				screen.queryByText('Edit Client', { selector: 'h2' })
			).not.toBeInTheDocument();
		});
	});

	it('shows loading state during submission', async () => {
		const user = userEvent.setup();

		// Create a promise that we can control
		let resolveUpdate: () => void;
		const updatePromise = new Promise<any>((resolve) => {
			resolveUpdate = () => resolve({});
		});
		mockUpdateClient.mockReturnValueOnce(updatePromise);

		render(
			<ClientEditDialog client={mockClient}>
				<button>Edit</button>
			</ClientEditDialog>
		);

		await user.click(screen.getByText('Edit'));

		const submitButton = screen.getByText('Update Client');
		await user.click(submitButton);

		// Check loading state
		expect(screen.getByText('Updating...')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

		// Resolve the promise
		resolveUpdate!();

		await waitFor(() => {
			expect(screen.queryByText('Updating...')).not.toBeInTheDocument();
		});
	});
});
