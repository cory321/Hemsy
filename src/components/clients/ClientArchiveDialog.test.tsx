import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import ClientArchiveDialog from './ClientArchiveDialog';
import { archiveClient } from '@/lib/actions/clients';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/actions/clients', () => ({
  archiveClient: jest.fn(),
}));

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

describe('ClientArchiveDialog', () => {
  const renderWithQuery = (ui: React.ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();
  const mockArchiveClient = archiveClient as jest.MockedFunction<
    typeof archiveClient
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });
  });

  it('should render the trigger button', () => {
    renderWithQuery(
      <ClientArchiveDialog clientId="client1" clientName="John Doe">
        <button>Archive Client</button>
      </ClientArchiveDialog>
    );

    expect(screen.getByText('Archive Client')).toBeInTheDocument();
  });

  it('should open dialog when trigger is clicked', async () => {
    const user = userEvent.setup();

    renderWithQuery(
      <ClientArchiveDialog clientId="client1" clientName="John Doe">
        <button>Archive Client</button>
      </ClientArchiveDialog>
    );

    await user.click(screen.getByText('Archive Client'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText(/Are you sure you want to archive/)
    ).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should display archive information in the dialog', async () => {
    const user = userEvent.setup();

    renderWithQuery(
      <ClientArchiveDialog clientId="client1" clientName="Jane Smith">
        <button>Archive</button>
      </ClientArchiveDialog>
    );

    await user.click(screen.getByText('Archive'));

    expect(
      screen.getByText('Hide them from active client lists')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Preserve all order history and payments')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Keep appointment records intact')
    ).toBeInTheDocument();
    expect(screen.getByText('Allow recovery at any time')).toBeInTheDocument();
  });

  it('should close dialog when cancel is clicked', async () => {
    const user = userEvent.setup();

    renderWithQuery(
      <ClientArchiveDialog clientId="client1" clientName="John Doe">
        <button>Archive Client</button>
      </ClientArchiveDialog>
    );

    await user.click(screen.getByText('Archive Client'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('should archive client and redirect on success', async () => {
    const user = userEvent.setup();
    mockArchiveClient.mockResolvedValueOnce(undefined);

    renderWithQuery(
      <ClientArchiveDialog clientId="client123" clientName="John Doe">
        <button>Archive Client</button>
      </ClientArchiveDialog>
    );

    await user.click(screen.getByText('Archive Client'));

    const archiveButton = screen.getByRole('button', {
      name: /^Archive Client$/,
    });
    await user.click(archiveButton);

    expect(mockArchiveClient).toHaveBeenCalledWith('client123');

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/clients');
      expect(mockRefresh).toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('should display error message on archive failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to archive client';
    mockArchiveClient.mockRejectedValueOnce(new Error(errorMessage));

    renderWithQuery(
      <ClientArchiveDialog clientId="client1" clientName="John Doe">
        <button>Archive Client</button>
      </ClientArchiveDialog>
    );

    await user.click(screen.getByText('Archive Client'));

    const archiveButton = screen.getByRole('button', {
      name: /^Archive Client$/,
    });
    await user.click(archiveButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Dialog should remain open on error
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Should not redirect on error
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('should show loading state while archiving', async () => {
    const user = userEvent.setup();
    let resolveArchive: () => void;
    const archivePromise = new Promise<void>((resolve) => {
      resolveArchive = resolve;
    });
    mockArchiveClient.mockReturnValueOnce(archivePromise);

    renderWithQuery(
      <ClientArchiveDialog clientId="client1" clientName="John Doe">
        <button>Archive Client</button>
      </ClientArchiveDialog>
    );

    await user.click(screen.getByText('Archive Client'));

    const archiveButton = screen.getByRole('button', {
      name: /^Archive Client$/,
    });
    await user.click(archiveButton);

    // Should show loading state
    expect(screen.getByText('Archiving...')).toBeInTheDocument();
    expect(archiveButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();

    // Resolve the archive
    resolveArchive!();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/clients');
    });
  });

  it('should close dialog using the X button', async () => {
    const user = userEvent.setup();

    renderWithQuery(
      <ClientArchiveDialog clientId="client1" clientName="John Doe">
        <button>Archive Client</button>
      </ClientArchiveDialog>
    );

    await user.click(screen.getByText('Archive Client'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByLabelText('close'));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
