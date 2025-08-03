import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import ClientDeleteDialog from './ClientDeleteDialog';
import { deleteClient } from '@/lib/actions/clients';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/actions/clients', () => ({
  deleteClient: jest.fn(),
}));

describe('ClientDeleteDialog', () => {
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();
  const mockDeleteClient = deleteClient as jest.MockedFunction<
    typeof deleteClient
  >;

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
      <ClientDeleteDialog clientId="client1" clientName="John Doe">
        <button>Delete Client</button>
      </ClientDeleteDialog>
    );

    const trigger = screen.getByText('Delete Client');
    expect(trigger).toBeInTheDocument();

    await user.click(trigger);

    expect(
      screen.getByText('Delete Client', { selector: 'h2' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/are you sure you want to delete/i)
    ).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('displays warning message with client name', async () => {
    const user = userEvent.setup();

    render(
      <ClientDeleteDialog clientId="client1" clientName="Jane Smith">
        <button>Delete</button>
      </ClientDeleteDialog>
    );

    await user.click(screen.getByText('Delete'));

    expect(
      screen.getByText(/are you sure you want to delete/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(
      screen.getByText(/this action cannot be undone/i)
    ).toBeInTheDocument();
  });

  it('closes dialog on cancel', async () => {
    const user = userEvent.setup();

    render(
      <ClientDeleteDialog clientId="client1" clientName="John Doe">
        <button>Delete</button>
      </ClientDeleteDialog>
    );

    await user.click(screen.getByText('Delete'));
    expect(
      screen.getByText('Delete Client', { selector: 'h2' })
    ).toBeInTheDocument();

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByText('Delete Client', { selector: 'h2' })
      ).not.toBeInTheDocument();
    });
  });

  it('deletes client and redirects on confirmation', async () => {
    const user = userEvent.setup();
    mockDeleteClient.mockResolvedValueOnce();

    render(
      <ClientDeleteDialog clientId="client123" clientName="John Doe">
        <button>Delete</button>
      </ClientDeleteDialog>
    );

    await user.click(screen.getByText('Delete'));

    const deleteButton = screen.getByText('Delete Client', {
      selector: 'button',
    });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteClient).toHaveBeenCalledWith('client123');
    });

    expect(mockPush).toHaveBeenCalledWith('/clients');
    expect(mockRefresh).toHaveBeenCalled();
  });

  it('handles delete errors', async () => {
    const user = userEvent.setup();
    mockDeleteClient.mockRejectedValueOnce(new Error('Delete failed'));

    render(
      <ClientDeleteDialog clientId="client1" clientName="John Doe">
        <button>Delete</button>
      </ClientDeleteDialog>
    );

    await user.click(screen.getByText('Delete'));

    const deleteButton = screen.getByText('Delete Client', {
      selector: 'button',
    });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Delete failed')).toBeInTheDocument();
    });

    // Dialog should remain open
    expect(
      screen.getByText('Delete Client', { selector: 'h2' })
    ).toBeInTheDocument();

    // Should not redirect
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('shows loading state during deletion', async () => {
    const user = userEvent.setup();

    // Create a promise that we can control
    let resolveDelete: () => void;
    const deletePromise = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });
    mockDeleteClient.mockReturnValueOnce(deletePromise);

    render(
      <ClientDeleteDialog clientId="client1" clientName="John Doe">
        <button>Delete</button>
      </ClientDeleteDialog>
    );

    await user.click(screen.getByText('Delete'));

    const deleteButton = screen.getByText('Delete Client', {
      selector: 'button',
    });
    await user.click(deleteButton);

    // Check loading state
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

    // Resolve the promise
    resolveDelete!();

    await waitFor(() => {
      expect(mockDeleteClient).toHaveBeenCalled();
    });
  });

  it('disables buttons during loading', async () => {
    const user = userEvent.setup();

    let resolveDelete: () => void;
    const deletePromise = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });
    mockDeleteClient.mockReturnValueOnce(deletePromise);

    render(
      <ClientDeleteDialog clientId="client1" clientName="John Doe">
        <button>Delete</button>
      </ClientDeleteDialog>
    );

    await user.click(screen.getByText('Delete'));

    const deleteButton = screen.getByText('Delete Client', {
      selector: 'button',
    });
    const cancelButton = screen.getByText('Cancel');

    await user.click(deleteButton);

    // Both buttons should be disabled during loading
    expect(deleteButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();

    resolveDelete!();

    await waitFor(() => {
      expect(mockDeleteClient).toHaveBeenCalled();
    });
  });
});
