import { test, expect } from '@playwright/test';
import {
  setupAuthenticatedPage,
  isClerkTestingConfigured,
  clearAuthentication,
  isAuthenticated,
} from './helpers/clerk-auth.helper';

test.describe('Sign Out', () => {
  test.beforeEach(async ({ page }) => {
    // Skip all tests in this suite if Clerk testing is not configured
    if (!isClerkTestingConfigured()) {
      test.skip();
      return;
    }

    // Set up authenticated page for tests that need it
    await setupAuthenticatedPage(page);
  });

  test('navigating to /sign-out logs the user out and redirects to home', async ({
    page,
  }) => {
    // Ensure user is authenticated first
    await page.goto('/dashboard');
    const authStatusBefore = await isAuthenticated(page);
    expect(authStatusBefore).toBe(true);

    // Navigate to sign-out page
    await page.goto('/sign-out');

    // Should show loading state
    await expect(page.getByText('Signing you out...')).toBeVisible();
    await expect(page.getByRole('progressbar')).toBeVisible();

    // Should redirect to home page
    await page.waitForURL('/');
    expect(page.url()).toContain('/');

    // User should no longer be authenticated
    const authStatusAfter = await isAuthenticated(page);
    expect(authStatusAfter).toBe(false);
  });

  test('sign-out page is accessible without authentication', async ({
    page,
  }) => {
    // Clear any existing authentication
    await clearAuthentication(page);

    // Navigate directly to sign-out page without auth
    const response = await page.goto('/sign-out');

    // Should not be blocked by authentication middleware
    expect(response?.status()).toBe(200);
  });

  test('protected routes redirect to sign-in after sign-out', async ({
    page,
  }) => {
    // Start authenticated
    await page.goto('/dashboard');
    expect(await isAuthenticated(page)).toBe(true);

    // Sign out
    await page.goto('/sign-out');
    await page.waitForURL('/');

    // Try to access protected route
    await page.goto('/clients');

    // Should be redirected to sign-in
    await page.waitForURL(/sign-in/, { timeout: 5000 });
    expect(page.url()).toContain('sign-in');
  });
});
