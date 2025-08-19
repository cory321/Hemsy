import React from 'react';
import { render, screen } from '@testing-library/react';
import ClientsPage from '@/app/(app)/clients/page';
import { getClients } from '@/lib/actions/clients';

jest.mock('@/lib/actions/clients');
jest.mock('@/components/clients/ClientsList', () => {
  const MockClientsList = () => <div data-testid="clients-list" />;
  MockClientsList.displayName = 'MockClientsList';
  return MockClientsList;
});

// Mock AddClientCtas to render a deterministic button for test
jest.mock('@/components/clients/AddClientCtas', () => {
  const MockAddClientCtas = () => <button type="button">Add Client</button>;
  MockAddClientCtas.displayName = 'MockAddClientCtas';
  return MockAddClientCtas;
});

// Mock next/link for SSR component rendering in tests
jest.mock('next/link', () => {
  const MockNextLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
  MockNextLink.displayName = 'MockNextLink';
  return {
    __esModule: true,
    default: MockNextLink,
  };
});

describe('ClientsPage header actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getClients as jest.Mock).mockResolvedValue({
      data: [],
      count: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    });
  });

  it('renders desktop Add Client action', async () => {
    render(await ClientsPage());

    // Desktop action button should be present in the DOM
    const desktopButton = screen.getByRole('button', { name: /add client/i });
    expect(desktopButton).toBeInTheDocument();
  });
});
