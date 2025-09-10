import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ClientRestoreButton from './ClientRestoreButton';
import { restoreClient } from '@/lib/actions/clients';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/actions/clients', () => ({
  restoreClient: jest.fn(),
}));

jest.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
}));

describe('ClientRestoreButton', () => {
  const mockRefresh = jest.fn();
  const mockRestoreClient = restoreClient as jest.MockedFunction<
    typeof restoreClient
  >;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const renderWithQuery = (ui: React.ReactElement) => {
    const utils = render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
    const wrappedRerender = (nextUi: React.ReactElement) =>
      utils.rerender(
        <QueryClientProvider client={queryClient}>{nextUi}</QueryClientProvider>
      );
    return { ...utils, rerender: wrappedRerender } as typeof utils;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      refresh: mockRefresh,
    });
  });

  it('should render restore button with correct text', () => {
    renderWithQuery(
      <ClientRestoreButton clientId="client1" clientName="John Doe" />
    );

    expect(
      screen.getByRole('button', { name: /restore/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId('RestoreIcon')).toBeInTheDocument();
  });

  it('should show tooltip with client name on hover', async () => {
    const user = userEvent.setup();

    renderWithQuery(
      <ClientRestoreButton clientId="client1" clientName="John Doe" />
    );

    const button = screen.getByRole('button', { name: /restore/i });
    await user.hover(button);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent(
        'Restore John Doe to active clients'
      );
    });
  });

  it('should restore client and refresh page on click', async () => {
    const user = userEvent.setup();
    mockRestoreClient.mockResolvedValueOnce(undefined);

    renderWithQuery(
      <ClientRestoreButton clientId="client123" clientName="John Doe" />
    );

    const button = screen.getByRole('button', { name: /restore/i });
    await user.click(button);

    expect(mockRestoreClient).toHaveBeenCalledWith('client123');

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it('should show loading state while restoring', async () => {
    const user = userEvent.setup();
    let resolveRestore: () => void;
    const restorePromise = new Promise<void>((resolve) => {
      resolveRestore = resolve;
    });
    mockRestoreClient.mockReturnValueOnce(restorePromise);

    renderWithQuery(
      <ClientRestoreButton clientId="client1" clientName="John Doe" />
    );

    const button = screen.getByRole('button', { name: /restore/i });
    await user.click(button);

    // Should show loading state
    expect(button).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    // Resolve the restore
    resolveRestore!();

    await waitFor(() => {
      expect(button).not.toBeDisabled();
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });
  });

  it('should handle restore errors gracefully', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockRestoreClient.mockRejectedValueOnce(new Error('Failed to restore'));

    renderWithQuery(
      <ClientRestoreButton clientId="client1" clientName="John Doe" />
    );

    const button = screen.getByRole('button', { name: /restore/i });
    await user.click(button);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to restore client:',
        expect.any(Error)
      );
    });

    // Button should be enabled again after error
    expect(button).not.toBeDisabled();

    consoleErrorSpy.mockRestore();
  });

  it('should stop event propagation when clicked', async () => {
    const user = userEvent.setup();
    const handleRowClick = jest.fn();
    mockRestoreClient.mockResolvedValueOnce(undefined);

    renderWithQuery(
      <div onClick={handleRowClick}>
        <ClientRestoreButton clientId="client1" clientName="John Doe" />
      </div>
    );

    const button = screen.getByRole('button', { name: /restore/i });
    await user.click(button);

    // Row click should not be triggered
    expect(handleRowClick).not.toHaveBeenCalled();
  });

  it('should render with different variants', () => {
    const { rerender } = renderWithQuery(
      <ClientRestoreButton
        clientId="client1"
        clientName="John Doe"
        variant="text"
      />
    );

    expect(screen.getByRole('button')).toHaveClass('MuiButton-text');

    rerender(
      <ClientRestoreButton
        clientId="client1"
        clientName="John Doe"
        variant="contained"
      />
    );

    expect(screen.getByRole('button')).toHaveClass('MuiButton-contained');
  });

  it('should render with different sizes', () => {
    const { rerender } = renderWithQuery(
      <ClientRestoreButton
        clientId="client1"
        clientName="John Doe"
        size="small"
      />
    );

    expect(screen.getByRole('button')).toHaveClass('MuiButton-sizeSmall');

    rerender(
      <ClientRestoreButton
        clientId="client1"
        clientName="John Doe"
        size="large"
      />
    );

    expect(screen.getByRole('button')).toHaveClass('MuiButton-sizeLarge');
  });
});
