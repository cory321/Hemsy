import { Page } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

/**
 * Helper functions for testing with Clerk authentication.
 */

/**
 * Sets up a page with Clerk testing token to bypass authentication.
 * This should be called at the beginning of tests that require authentication.
 */
export async function setupAuthenticatedPage(page: Page): Promise<void> {
  // Check if Clerk testing is configured
  if (!process.env.CLERK_PUBLISHABLE_KEY || !process.env.CLERK_SECRET_KEY) {
    throw new Error(
      'Clerk testing environment variables are not configured. Please set CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY.'
    );
  }

  // Inject the testing token into the page
  await setupClerkTestingToken({ page });
}

/**
 * Checks if Clerk testing is properly configured.
 * Returns true if all required environment variables are set.
 */
export function isClerkTestingConfigured(): boolean {
  return !!(process.env.CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}

/**
 * Skips a test if Clerk testing is not configured.
 * Use this in tests that absolutely require authentication.
 */
export function skipIfNoAuth(test: any): void {
  if (!isClerkTestingConfigured()) {
    test.skip('Clerk testing is not configured. Skipping authenticated test.');
  }
}

/**
 * Helper to navigate to a protected route with authentication.
 */
export async function navigateToProtectedRoute(
  page: Page,
  route: string
): Promise<void> {
  await setupAuthenticatedPage(page);
  await page.goto(route);
  // Wait for the page to fully load
  await page.waitForLoadState('networkidle');
}

/**
 * Helper to simulate a complete authentication flow for testing.
 * This bypasses the actual Clerk authentication UI.
 */
export async function authenticateUser(page: Page): Promise<void> {
  await setupAuthenticatedPage(page);
  // The testing token will automatically authenticate the user
  // No need to go through sign-in flow
}

/**
 * Helper to clear authentication state (for testing sign-out flows).
 */
export async function clearAuthentication(page: Page): Promise<void> {
  // Clear cookies and local storage
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Helper to wait for authentication to be ready.
 */
export async function waitForAuthReady(page: Page): Promise<void> {
  // Wait for Clerk to be loaded
  await page.waitForFunction(
    () => {
      return typeof window !== 'undefined' && (window as any).Clerk;
    },
    { timeout: 10000 }
  );

  // Wait for Clerk to be ready
  await page.waitForFunction(
    () => {
      const clerk = (window as any).Clerk;
      return clerk && clerk.loaded;
    },
    { timeout: 10000 }
  );
}

/**
 * Helper to get the current user's ID from Clerk.
 */
export async function getCurrentUserId(page: Page): Promise<string | null> {
  await waitForAuthReady(page);

  return await page.evaluate(() => {
    const clerk = (window as any).Clerk;
    return clerk?.user?.id || null;
  });
}

/**
 * Helper to check if a user is currently authenticated.
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  await waitForAuthReady(page);

  return await page.evaluate(() => {
    const clerk = (window as any).Clerk;
    return !!clerk?.user;
  });
}

/**
 * Alias for authenticateUser - provides a more intuitive name for tests.
 * This function sets up authentication using Clerk testing tokens.
 */
export async function signInWithClerk(page: Page): Promise<void> {
  await authenticateUser(page);
}
