import { render, screen, fireEvent } from '@testing-library/react';
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import MorePage from '@/app/(app)/more/page';

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useClerk: jest.fn(),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockedLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>;
  MockedLink.displayName = 'MockedLink';
  return MockedLink;
});

describe('MorePage', () => {
  const mockSignOut = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useClerk as jest.Mock).mockReturnValue({
      signOut: mockSignOut,
    });
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it('renders all menu items', () => {
    render(<MorePage />);

    // Check main menu items
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Invoices')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();

    // Check support items
    expect(screen.getByText('Help & Support')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('navigates to correct pages for menu items', () => {
    render(<MorePage />);

    // Check that links have correct hrefs
    const servicesLink = screen.getByText('Services').closest('a');
    expect(servicesLink).toHaveAttribute('href', '/services');

    const invoicesLink = screen.getByText('Invoices').closest('a');
    expect(invoicesLink).toHaveAttribute('href', '/invoices');

    const settingsLink = screen.getByText('Settings').closest('a');
    expect(settingsLink).toHaveAttribute('href', '/settings');

    const helpLink = screen.getByText('Help & Support').closest('a');
    expect(helpLink).toHaveAttribute('href', '/help');
  });

  it('calls signOut when Sign Out is clicked', () => {
    render(<MorePage />);

    const signOutItem = screen
      .getByText('Sign Out')
      .closest('.MuiListItem-root');
    expect(signOutItem).toBeInTheDocument();

    // Click the sign out item
    fireEvent.click(signOutItem!);

    // Verify signOut was called with correct redirect
    expect(mockSignOut).toHaveBeenCalledWith({ redirectUrl: '/' });
  });

  it('renders with correct styling for all items', () => {
    render(<MorePage />);

    // Check that all menu items are rendered
    const links = screen.getAllByRole('link');
    // 3 main menu items + 1 help link = 4 links
    expect(links.length).toBe(4);

    // Check that Sign Out item is rendered (not a link)
    const signOutItem = screen.getByText('Sign Out');
    expect(signOutItem).toBeInTheDocument();
  });

  it('displays correct descriptions for main menu items', () => {
    render(<MorePage />);

    expect(
      screen.getByText('Manage your alteration services')
    ).toBeInTheDocument();
    expect(screen.getByText('View and manage invoices')).toBeInTheDocument();
    expect(
      screen.getByText('Business info and preferences')
    ).toBeInTheDocument();
  });
});
