import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ClientOrdersSection from '@/components/clients/ClientOrdersSection';
import * as clientsActions from '@/lib/actions/clients';

jest.mock('@/lib/actions/clients');

describe('ClientOrdersSection - SSR hydration / query behavior', () => {
  const renderWithQuery = (ui: React.ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  it('renders empty state when no orders returned', async () => {
    (clientsActions.getClientOrders as jest.Mock).mockResolvedValue([]);

    renderWithQuery(<ClientOrdersSection clientId="c1" clientName="Jane" />);

    await waitFor(() =>
      expect(screen.getByText(/No orders yet for Jane/i)).toBeInTheDocument()
    );
  });

  it('renders list when orders returned', async () => {
    (clientsActions.getClientOrders as jest.Mock).mockResolvedValue([
      {
        id: 'o1',
        status: 'in_progress',
        created_at: '2024-01-01T00:00:00Z',
        total_cents: 1234,
        garment_count: 2,
      },
    ]);

    renderWithQuery(<ClientOrdersSection clientId="c1" clientName="Jane" />);

    await waitFor(() =>
      expect(screen.getByText(/Order #/i)).toBeInTheDocument()
    );
  });
});
