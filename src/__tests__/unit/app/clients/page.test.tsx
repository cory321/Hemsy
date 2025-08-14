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

  it('renders desktop Add Client link', async () => {
    render(await ClientsPage());

    // Desktop link should be present in the DOM
    const desktopLink = screen.getByRole('link', { name: /add client/i });
    expect(desktopLink).toBeInTheDocument();

    // Verify it links to the new client page
    expect(desktopLink).toHaveAttribute('href', '/clients/new');
  });
});
