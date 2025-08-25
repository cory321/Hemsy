import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import NewClientPage from './page';
import { createClient } from '@/lib/actions/clients';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/actions/clients', () => ({
  createClient: jest.fn(),
}));

describe('NewClientPage', () => {
  const mockPush = jest.fn();
  const mockCreateClient = createClient as jest.MockedFunction<
    typeof createClient
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders the form with all required fields', () => {
    render(<NewClientPage />);

    expect(screen.getByText('Add New Client')).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mailing address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/accept email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/accept sms/i)).toBeInTheDocument();
  });

  it('has correct default values', () => {
    render(<NewClientPage />);

    const emailSwitch = screen.getByRole('checkbox', { name: /accept email/i });
    const smsSwitch = screen.getByRole('checkbox', { name: /accept sms/i });

    expect(emailSwitch).toBeChecked();
    expect(smsSwitch).not.toBeChecked();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();

    render(<NewClientPage />);

    // Try to submit the form without filling any fields
    const submitButton = screen.getByRole('button', { name: /add client/i });
    await user.click(submitButton);

    // Since the form uses react-hook-form, it won't submit if validation fails
    // So we just verify that the createClient function was not called
    await waitFor(() => {
      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    // The form should prevent submission with empty required fields
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();

    const mockNewClient = {
      id: 'new-client-id',
      shop_id: 'shop1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone_number: '5551234567',
      accept_email: true,
      accept_sms: false,
      notes: null,
      mailing_address: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockCreateClient.mockResolvedValueOnce({
      success: true,
      data: mockNewClient,
    });

    render(<NewClientPage />);

    // Fill in all required fields but with invalid email
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email address/i), 'invalid-email');
    await user.type(screen.getByLabelText(/phone number/i), '5551234567');

    const submitButton = screen.getByRole('button', { name: /add client/i });
    await user.click(submitButton);

    // The form should not submit with invalid email
    await waitFor(() => {
      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    // Now fix the email and try again
    const emailInput = screen.getByLabelText(/email address/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'john@example.com');
    await user.click(submitButton);

    // Now it should submit
    await waitFor(() => {
      expect(mockCreateClient).toHaveBeenCalled();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockNewClient = {
      id: 'new-client-id',
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
    };

    mockCreateClient.mockResolvedValueOnce({
      success: true,
      data: mockNewClient,
    });

    render(<NewClientPage />);

    // Fill in required fields
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(
      screen.getByLabelText(/email address/i),
      'john@example.com'
    );
    await user.type(screen.getByLabelText(/phone number/i), '5551234567');
    await user.type(screen.getByLabelText(/mailing address/i), '123 Main St');
    await user.type(screen.getByLabelText(/notes/i), 'Test notes');

    // Toggle SMS preference
    const smsSwitch = screen.getByRole('checkbox', { name: /accept sms/i });
    await user.click(smsSwitch);

    const submitButton = screen.getByText('Add client');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateClient).toHaveBeenCalledWith({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone_number: '5551234567',
        accept_email: true,
        accept_sms: true,
        notes: 'Test notes',
        mailing_address: '123 Main St',
      });
    });

    expect(mockPush).toHaveBeenCalledWith('/clients/new-client-id');
  });

  it('handles empty optional fields correctly', async () => {
    const user = userEvent.setup();
    const mockNewClient = {
      id: 'new-client-id',
      shop_id: 'shop1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone_number: '5551234567',
      accept_email: true,
      accept_sms: false,
      notes: null,
      mailing_address: null,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockCreateClient.mockResolvedValueOnce({
      success: true,
      data: mockNewClient,
    });

    render(<NewClientPage />);

    // Fill in only required fields
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(
      screen.getByLabelText(/email address/i),
      'john@example.com'
    );
    await user.type(screen.getByLabelText(/phone number/i), '5551234567');

    const submitButton = screen.getByText('Add client');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateClient).toHaveBeenCalledWith({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone_number: '5551234567',
        accept_email: true,
        accept_sms: false,
        notes: null,
        mailing_address: null,
      });
    });
  });

  it('handles creation errors', async () => {
    const user = userEvent.setup();
    mockCreateClient.mockRejectedValueOnce(new Error('Creation failed'));

    render(<NewClientPage />);

    // Fill in required fields
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(
      screen.getByLabelText(/email address/i),
      'john@example.com'
    );
    await user.type(screen.getByLabelText(/phone number/i), '5551234567');

    const submitButton = screen.getByText('Add client');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Creation failed')).toBeInTheDocument();
    });

    // Should not redirect
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();

    // Create a promise that we can control
    let resolveCreate: () => void;
    const createPromise = new Promise<any>((resolve) => {
      resolveCreate = () =>
        resolve({
          id: 'new-client-id',
          shop_id: 'shop1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone_number: '5551234567',
          accept_email: true,
          accept_sms: false,
          notes: null,
          mailing_address: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        });
    });
    mockCreateClient.mockReturnValueOnce(createPromise);

    render(<NewClientPage />);

    // Fill in required fields
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(
      screen.getByLabelText(/email address/i),
      'john@example.com'
    );
    await user.type(screen.getByLabelText(/phone number/i), '5551234567');

    const submitButton = screen.getByText('Add client');
    await user.click(submitButton);

    // Check loading state
    expect(screen.getByText('Adding...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

    // Resolve the promise
    resolveCreate!();

    await waitFor(() => {
      expect(mockCreateClient).toHaveBeenCalled();
    });
  });

  it('navigates back to clients list on cancel', async () => {
    const user = userEvent.setup();

    render(<NewClientPage />);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockPush).toHaveBeenCalledWith('/clients');
  });
});
