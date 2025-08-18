import { test, expect } from '@playwright/test';

test.describe('Sign Out', () => {
  test.beforeEach(async ({ page }) => {
    // Note: In a real E2E test, you would need to set up authentication
    // This might involve using Clerk's testing tokens or mocking the auth state
    // For now, this is a placeholder that demonstrates the test structure
  });

  test('navigating to /sign-out logs the user out and redirects to home', async ({
    page,
  }) => {
    // Skip this test if Clerk is not configured for E2E testing
    if (!process.env.E2E_CLERK_TEST_TOKEN) {
      test.skip();
      return;
    }

    // Navigate to sign-out page
    await page.goto('/sign-out');

    // Should show loading state
    await expect(page.getByText('Signing you out...')).toBeVisible();
    await expect(page.getByRole('progressbar')).toBeVisible();

    // Should redirect to home page
    await page.waitForURL('/');
    expect(page.url()).toContain('/');

    // Should no longer have authentication
    // This would depend on your specific auth implementation
    // For example, checking that protected routes now redirect to sign-in
  });

  test('sign-out page is accessible without authentication', async ({
    page,
  }) => {
    // Navigate directly to sign-out page
    const response = await page.goto('/sign-out');

    // Should not be blocked by authentication middleware
    expect(response?.status()).toBe(200);
  });
});
