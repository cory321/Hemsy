import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { OrderFlowProvider, useOrderFlow } from '@/contexts/OrderFlowContext';
import { getClient } from '@/lib/actions/clients';

// Mock dependencies
jest.mock('@/lib/actions/clients');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Test component to access context values
function TestComponent() {
  const { orderDraft } = useOrderFlow();
  return (
    <div>
      <div data-testid="client-id">{orderDraft.clientId || 'No client'}</div>
      <div data-testid="client-name">
        {orderDraft.client
          ? `${orderDraft.client.first_name} ${orderDraft.client.last_name}`
          : 'No client name'}
      </div>
    </div>
  );
}

describe('OrderFlowContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage
    localStorage.clear();
  });

  it('should initialize with empty client when no initialClientId is provided', () => {
    render(
      <OrderFlowProvider>
        <TestComponent />
      </OrderFlowProvider>
    );

    expect(screen.getByTestId('client-id')).toHaveTextContent('No client');
    expect(screen.getByTestId('client-name')).toHaveTextContent(
      'No client name'
    );
  });

  it('should fetch and set client data when initialClientId is provided', async () => {
    const mockClient = {
      id: 'client-123',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone_number: '1234567890',
    };

    (getClient as jest.Mock).mockResolvedValue(mockClient);

    render(
      <OrderFlowProvider initialClientId="client-123">
        <TestComponent />
      </OrderFlowProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('client-id')).toHaveTextContent('client-123');
      expect(screen.getByTestId('client-name')).toHaveTextContent('John Doe');
    });

    expect(getClient).toHaveBeenCalledWith('client-123');
  });

  it('should handle client fetch errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation();
    (getClient as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(
      <OrderFlowProvider initialClientId="client-123">
        <TestComponent />
      </OrderFlowProvider>
    );

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to fetch client:',
        expect.any(Error)
      );
    });

    // Should remain with no client
    expect(screen.getByTestId('client-id')).toHaveTextContent('No client');
    expect(screen.getByTestId('client-name')).toHaveTextContent(
      'No client name'
    );

    consoleError.mockRestore();
  });

  it('should not fetch client if already in localStorage and no initialClientId', () => {
    const storedData = {
      clientId: 'stored-client',
      client: {
        id: 'stored-client',
        first_name: 'Stored',
        last_name: 'Client',
      },
      garments: [],
      discountCents: 0,
      notes: '',
    };

    localStorage.setItem('threadfolio_order_draft', JSON.stringify(storedData));

    render(
      <OrderFlowProvider>
        <TestComponent />
      </OrderFlowProvider>
    );

    expect(screen.getByTestId('client-id')).toHaveTextContent('stored-client');
    expect(screen.getByTestId('client-name')).toHaveTextContent(
      'Stored Client'
    );
    expect(getClient).not.toHaveBeenCalled();
  });

  it('should prefer initialClientId over localStorage data', async () => {
    const storedData = {
      clientId: 'stored-client',
      client: {
        id: 'stored-client',
        first_name: 'Stored',
        last_name: 'Client',
      },
      garments: [],
      discountCents: 0,
      notes: '',
    };

    localStorage.setItem('threadfolio_order_draft', JSON.stringify(storedData));

    const mockClient = {
      id: 'new-client-123',
      first_name: 'New',
      last_name: 'Client',
      email: 'new@example.com',
      phone_number: '1234567890',
    };

    (getClient as jest.Mock).mockResolvedValue(mockClient);

    render(
      <OrderFlowProvider initialClientId="new-client-123">
        <TestComponent />
      </OrderFlowProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('client-id')).toHaveTextContent(
        'new-client-123'
      );
      expect(screen.getByTestId('client-name')).toHaveTextContent('New Client');
    });

    expect(getClient).toHaveBeenCalledWith('new-client-123');
  });
});
