import { test, expect } from '@playwright/test';
import {
  setupAuthenticatedPage,
  navigateToProtectedRoute,
  isClerkTestingConfigured,
  isAuthenticated,
  getCurrentUserId,
  waitForAuthReady,
} from './helpers/clerk-auth.helper';

/**
 * Example test suite for authenticated user flows.
 * This demonstrates how to test protected routes and authenticated features.
 */
test.describe('Authenticated User Flows', () => {
  // Only run these tests if Clerk testing is configured
  test.beforeAll(() => {
    if (!isClerkTestingConfigured()) {
      console.log(
        '⚠️  Skipping authenticated flow tests - Clerk testing not configured'
      );
      test.skip();
    }
  });

  test.beforeEach(async ({ page }) => {
    // Set up authentication for each test
    await setupAuthenticatedPage(page);
  });

  test('can access dashboard when authenticated', async ({ page }) => {
    await navigateToProtectedRoute(page, '/dashboard');

    // Verify we're on the dashboard
    expect(page.url()).toContain('/dashboard');

    // Check for dashboard-specific elements
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible(
      {
        timeout: 10000,
      }
    );

    // Verify user is authenticated
    const authStatus = await isAuthenticated(page);
    expect(authStatus).toBe(true);
  });

  test('can navigate between protected routes', async ({ page }) => {
    // Start at dashboard
    await navigateToProtectedRoute(page, '/dashboard');

    // Navigate to clients page
    await page.getByRole('link', { name: /clients/i }).click();
    await page.waitForURL('**/clients');
    expect(page.url()).toContain('/clients');

    // Navigate to orders page
    await page.getByRole('link', { name: /orders/i }).click();
    await page.waitForURL('**/orders');
    expect(page.url()).toContain('/orders');

    // Navigate to appointments page
    await page.getByRole('link', { name: /appointments/i }).click();
    await page.waitForURL('**/appointments');
    expect(page.url()).toContain('/appointments');

    // Verify still authenticated throughout navigation
    const authStatus = await isAuthenticated(page);
    expect(authStatus).toBe(true);
  });

  test('can access user profile settings', async ({ page }) => {
    await navigateToProtectedRoute(page, '/settings');

    // Wait for settings page to load
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible({
      timeout: 10000,
    });

    // Get current user ID
    const userId = await getCurrentUserId(page);
    expect(userId).toBeTruthy();
    console.log(`Testing with user ID: ${userId}`);
  });

  test('protected API routes work with authentication', async ({ page }) => {
    await navigateToProtectedRoute(page, '/dashboard');

    // Wait for auth to be ready
    await waitForAuthReady(page);

    // Make an API request from the page context (simulating a fetch from the app)
    const apiResponse = await page.evaluate(async () => {
      const response = await fetch('/api/user', {
        credentials: 'include',
      });
      return {
        status: response.status,
        ok: response.ok,
      };
    });

    // API should accept the authenticated request
    expect(apiResponse.ok).toBe(true);
    expect(apiResponse.status).toBe(200);
  });

  test('can create a new client', async ({ page }) => {
    await navigateToProtectedRoute(page, '/clients');

    // Click on "Add Client" button
    await page.getByRole('button', { name: /add client/i }).click();

    // Fill in client form
    await page.getByLabel(/name/i).fill('Test Client');
    await page.getByLabel(/email/i).fill('test@example.com');
    await page.getByLabel(/phone/i).fill('+1234567890');

    // Submit form
    await page.getByRole('button', { name: /save/i }).click();

    // Verify client was created (look for success message or client in list)
    await expect(
      page.getByText(/client.*created|added successfully/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('mobile navigation works when authenticated', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await navigateToProtectedRoute(page, '/dashboard');

    // Open mobile menu
    const menuButton = page.getByRole('button', { name: /menu/i });
    await menuButton.click();

    // Check that navigation items are visible
    await expect(page.getByRole('link', { name: /clients/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /orders/i })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /appointments/i })
    ).toBeVisible();

    // Navigate to a page
    await page.getByRole('link', { name: /clients/i }).click();
    await page.waitForURL('**/clients');

    // Verify navigation worked
    expect(page.url()).toContain('/clients');
  });

  test('shows user-specific data', async ({ page }) => {
    await navigateToProtectedRoute(page, '/dashboard');

    // Wait for user data to load
    await waitForAuthReady(page);

    // Get user ID
    const userId = await getCurrentUserId(page);
    expect(userId).toBeTruthy();

    // Verify dashboard shows personalized content
    // This would depend on your specific implementation
    const dashboardContent = await page.textContent('body');

    // Check that the page doesn't show "Sign In" or "Sign Up" prompts
    expect(dashboardContent).not.toContain('Sign In');
    expect(dashboardContent).not.toContain('Sign Up');
  });

  test('handles session expiration gracefully', async ({ page }) => {
    await navigateToProtectedRoute(page, '/dashboard');

    // Simulate session expiration by clearing auth
    await page.evaluate(() => {
      // Clear Clerk session data
      const clerk = (window as any).Clerk;
      if (clerk && clerk.signOut) {
        clerk.signOut();
      }
    });

    // Try to navigate to another protected route
    await page.goto('/clients');

    // Should redirect to sign-in
    await page.waitForURL(/sign-in/, { timeout: 10000 });
    expect(page.url()).toContain('sign-in');
  });
});
