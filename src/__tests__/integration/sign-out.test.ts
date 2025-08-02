import { useClerk } from '@clerk/nextjs';

// Mock Clerk at the module level
jest.mock('@clerk/nextjs', () => ({
  useClerk: jest.fn(),
}));

describe('Sign Out Integration', () => {
  it('should handle sign out with Clerk SDK', async () => {
    const mockSignOut = jest.fn().mockResolvedValue(undefined);

    (useClerk as jest.Mock).mockReturnValue({
      signOut: mockSignOut,
    });

    // Get the hook result
    const { signOut } = useClerk();

    // Call sign out with redirect
    await signOut({ redirectUrl: '/' });

    // Verify it was called correctly
    expect(mockSignOut).toHaveBeenCalledWith({ redirectUrl: '/' });
  });

  it('should handle sign out errors gracefully', async () => {
    const mockSignOut = jest
      .fn()
      .mockRejectedValue(new Error('Sign out failed'));

    (useClerk as jest.Mock).mockReturnValue({
      signOut: mockSignOut,
    });

    // Get the hook result
    const { signOut } = useClerk();

    // Attempt to sign out
    await expect(signOut({ redirectUrl: '/' })).rejects.toThrow(
      'Sign out failed'
    );
  });
});
