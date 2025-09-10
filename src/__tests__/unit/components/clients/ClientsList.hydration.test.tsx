import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ClientsList from '@/components/clients/ClientsList';
import type { PaginatedClients, ClientsFilters } from '@/lib/actions/clients';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.useFakeTimers();

function renderWithQuery(ui: React.ReactElement, client?: QueryClient) {
  const queryClient =
    client ||
    new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe('ClientsList - SSR hydration with React Query', () => {
  const initialData: PaginatedClients = {
    data: [],
    count: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
  };

  it('does not refetch on initial render when initialData is provided', async () => {
    const getClientsAction = jest
      .fn<
        Promise<PaginatedClients>,
        [number, number, ClientsFilters | undefined]
      >()
      .mockResolvedValue({ ...initialData });

    renderWithQuery(
      <ClientsList
        initialData={initialData}
        getClientsAction={getClientsAction}
        archivedClientsCount={0}
      />
    );

    // No refetch should occur on mount due to initialData + staleTime
    expect(getClientsAction).not.toHaveBeenCalled();
  });

  it('refetches on search change after debounce with correct filters', async () => {
    const getClientsAction = jest
      .fn<
        Promise<PaginatedClients>,
        [number, number, ClientsFilters | undefined]
      >()
      .mockResolvedValue({ ...initialData, data: [], count: 0 });

    renderWithQuery(
      <ClientsList
        initialData={initialData}
        getClientsAction={getClientsAction}
        archivedClientsCount={3}
      />
    );

    const input = screen.getByPlaceholderText(
      /search by name, email, or phone/i
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'john' } });

    // advance debounce
    jest.advanceTimersByTime(350);

    await waitFor(() => {
      expect(getClientsAction).toHaveBeenCalledWith(1, 10, {
        search: 'john',
        sortBy: 'created_at',
        sortOrder: 'desc',
        includeArchived: false,
      });
    });

    // Toggle archived and expect includeArchived true
    const toggle = screen.getByLabelText(/show archived/i);
    fireEvent.click(toggle);

    await waitFor(() => {
      expect(getClientsAction).toHaveBeenLastCalledWith(1, 10, {
        search: 'john',
        sortBy: 'created_at',
        sortOrder: 'desc',
        includeArchived: true,
      });
    });
  });
});
