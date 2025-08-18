import { render, screen, waitFor } from '@testing-library/react';
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import SignOutPage from '@/app/(auth)/sign-out/page';

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useClerk: jest.fn(),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('SignOutPage', () => {
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

  it('renders loading state', () => {
    render(<SignOutPage />);

    expect(screen.getByText('Signing you out...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('calls signOut on mount and redirects to home', async () => {
    mockSignOut.mockImplementation((callback: () => void) => {
      callback();
      return Promise.resolve();
    });

    render(<SignOutPage />);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('redirects to home even if signOut fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockSignOut.mockRejectedValue(new Error('Sign out failed'));

    render(<SignOutPage />);

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error signing out:',
        expect.any(Error)
      );
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    consoleErrorSpy.mockRestore();
  });
});
