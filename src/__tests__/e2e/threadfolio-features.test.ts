import { test, expect } from '@playwright/test';
import {
  setupAuthenticatedPage,
  navigateToProtectedRoute,
  isClerkTestingConfigured,
  waitForAuthReady,
} from './helpers/clerk-auth.helper';

/**
 * E2E tests for core Hemsy features requiring authentication.
 * These tests demonstrate testing the actual business logic of the application.
 */
test.describe('Hemsy Core Features', () => {
  // Only run if Clerk is configured
  test.beforeAll(() => {
    if (!isClerkTestingConfigured()) {
      console.log(
        '⚠️  Skipping Hemsy feature tests - Clerk testing not configured'
      );
      test.skip();
    }
  });

  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedPage(page);
  });

  test.describe('Client Management', () => {
    test('can view clients list', async ({ page }) => {
      await navigateToProtectedRoute(page, '/clients');

      // Should see the clients page
      await expect(
        page.getByRole('heading', { name: /clients/i })
      ).toBeVisible();

      // Should have an "Add Client" button
      await expect(
        page.getByRole('button', { name: /add client/i })
      ).toBeVisible();
    });

    test('can search for clients', async ({ page }) => {
      await navigateToProtectedRoute(page, '/clients');

      // Find search input
      const searchInput = page.getByPlaceholder(/search.*client/i);

      // Type a search query
      await searchInput.fill('John');

      // Wait for search results to update
      await page.waitForTimeout(500); // Debounce delay

      // Verify search is working (this would need actual test data)
      // The actual results would depend on your test data setup
    });

    test('can add a new client', async ({ page }) => {
      await navigateToProtectedRoute(page, '/clients');

      // Click Add Client button
      await page.getByRole('button', { name: /add client/i }).click();

      // Fill in the form
      await page.getByLabel(/^name/i).fill('Jane Smith');
      await page.getByLabel(/email/i).fill('jane.smith@example.com');
      await page.getByLabel(/phone/i).fill('+12025551234');

      // Add address if fields exist
      const addressField = page.getByLabel(/address/i);
      if (await addressField.isVisible()) {
        await addressField.fill('123 Main St, New York, NY 10001');
      }

      // Submit the form
      await page.getByRole('button', { name: /save|create|add/i }).click();

      // Verify success (toast notification or redirect)
      // Look for success indicators
      const successMessage = page.getByText(
        /client.*added|created.*successfully/i
      );
      await expect(successMessage).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Order Management', () => {
    test('can view orders list', async ({ page }) => {
      await navigateToProtectedRoute(page, '/orders');

      // Should see the orders page
      await expect(
        page.getByRole('heading', { name: /orders/i })
      ).toBeVisible();

      // Should have order status filters
      const statusFilters = ['All', 'Pending', 'In Progress', 'Completed'];
      for (const status of statusFilters) {
        await expect(page.getByText(status)).toBeVisible();
      }
    });

    test('can filter orders by status', async ({ page }) => {
      await navigateToProtectedRoute(page, '/orders');

      // Click on "Pending" filter
      await page.getByRole('button', { name: /pending/i }).click();

      // Wait for filter to apply
      await page.waitForTimeout(300);

      // Verify URL or state reflects the filter
      // This would depend on your implementation
    });

    test('can create a new order', async ({ page }) => {
      await navigateToProtectedRoute(page, '/orders');

      // Click Add Order button
      await page.getByRole('button', { name: /add order|new order/i }).click();

      // Select a client (assuming dropdown)
      const clientSelect = page.getByLabel(/client/i);
      await clientSelect.click();
      await page.getByRole('option').first().click();

      // Add order details
      await page.getByLabel(/description/i).fill('Wedding dress alteration');

      // Set due date
      const dueDateInput = page.getByLabel(/due date/i);
      await dueDateInput.click();
      // Select a date from calendar (implementation-specific)

      // Add price
      await page.getByLabel(/price|amount/i).fill('150.00');

      // Submit
      await page.getByRole('button', { name: /save|create/i }).click();

      // Verify success
      await expect(page.getByText(/order.*created/i)).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('Appointment Scheduling', () => {
    test('can view appointments calendar', async ({ page }) => {
      await navigateToProtectedRoute(page, '/appointments');

      // Should see the appointments page
      await expect(
        page.getByRole('heading', { name: /appointments/i })
      ).toBeVisible();

      // Should have calendar navigation
      await expect(page.getByRole('button', { name: /today/i })).toBeVisible();
      await expect(
        page.getByRole('button', { name: /previous|back/i })
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /next|forward/i })
      ).toBeVisible();
    });

    test('can switch calendar views', async ({ page }) => {
      await navigateToProtectedRoute(page, '/appointments');

      // Test month view
      const monthButton = page.getByRole('button', { name: /month/i });
      if (await monthButton.isVisible()) {
        await monthButton.click();
        await page.waitForTimeout(300);
      }

      // Test week view
      const weekButton = page.getByRole('button', { name: /week/i });
      if (await weekButton.isVisible()) {
        await weekButton.click();
        await page.waitForTimeout(300);
      }

      // Test day view
      const dayButton = page.getByRole('button', { name: /day/i });
      if (await dayButton.isVisible()) {
        await dayButton.click();
        await page.waitForTimeout(300);
      }
    });

    test('can schedule a new appointment', async ({ page }) => {
      await navigateToProtectedRoute(page, '/appointments');

      // Click Add Appointment button
      await page
        .getByRole('button', {
          name: /add appointment|new appointment|schedule/i,
        })
        .click();

      // Fill appointment form
      const clientSelect = page.getByLabel(/client/i);
      await clientSelect.click();
      await page.getByRole('option').first().click();

      // Set appointment type/service
      const serviceSelect = page.getByLabel(/service|type/i);
      if (await serviceSelect.isVisible()) {
        await serviceSelect.click();
        await page.getByRole('option').first().click();
      }

      // Set date and time
      await page.getByLabel(/date/i).fill('2024-12-20');
      await page.getByLabel(/time/i).fill('14:00');

      // Add notes
      await page
        .getByLabel(/notes|description/i)
        .fill('First fitting for wedding dress');

      // Submit
      await page.getByRole('button', { name: /save|schedule|create/i }).click();

      // Verify success
      await expect(page.getByText(/appointment.*scheduled/i)).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('Garment Management', () => {
    test('can view garments list', async ({ page }) => {
      await navigateToProtectedRoute(page, '/garments');

      // Should see the garments page
      await expect(
        page.getByRole('heading', { name: /garments/i })
      ).toBeVisible();

      // Should have view toggle (grid/list)
      const viewToggle = page.getByRole('button', { name: /view|grid|list/i });
      await expect(viewToggle).toBeVisible();
    });

    test('can add a new garment', async ({ page }) => {
      await navigateToProtectedRoute(page, '/garments');

      // Click Add Garment button
      await page
        .getByRole('button', { name: /add garment|new garment/i })
        .click();

      // Select client
      const clientSelect = page.getByLabel(/client/i);
      await clientSelect.click();
      await page.getByRole('option').first().click();

      // Enter garment details
      await page.getByLabel(/name|title/i).fill('Blue Evening Dress');

      // Select garment type
      const typeSelect = page.getByLabel(/type|category/i);
      if (await typeSelect.isVisible()) {
        await typeSelect.click();
        await page.getByText(/dress/i).click();
      }

      // Add measurements or notes
      const notesField = page.getByLabel(/notes|description/i);
      if (await notesField.isVisible()) {
        await notesField.fill('Size 8, needs hemming');
      }

      // Submit
      await page.getByRole('button', { name: /save|create|add/i }).click();

      // Verify success
      await expect(page.getByText(/garment.*added/i)).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('Settings and Profile', () => {
    test('can access user settings', async ({ page }) => {
      await navigateToProtectedRoute(page, '/settings');

      // Should see settings page
      await expect(
        page.getByRole('heading', { name: /settings/i })
      ).toBeVisible();

      // Should have profile section
      await expect(page.getByText(/profile|account/i)).toBeVisible();
    });

    test('can update business information', async ({ page }) => {
      await navigateToProtectedRoute(page, '/settings');

      // Navigate to business settings if in tabs
      const businessTab = page.getByRole('tab', { name: /business/i });
      if (await businessTab.isVisible()) {
        await businessTab.click();
      }

      // Update business name
      const businessNameInput = page.getByLabel(/business name/i);
      if (await businessNameInput.isVisible()) {
        await businessNameInput.clear();
        await businessNameInput.fill('Premium Tailoring Services');

        // Save changes
        await page.getByRole('button', { name: /save|update/i }).click();

        // Verify success
        await expect(page.getByText(/updated.*successfully/i)).toBeVisible({
          timeout: 5000,
        });
      }
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('mobile navigation works correctly', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size

      await navigateToProtectedRoute(page, '/dashboard');

      // Open mobile menu
      const menuButton = page.getByRole('button', { name: /menu/i });
      await menuButton.click();

      // Verify navigation items are accessible
      const navItems = [
        'Dashboard',
        'Clients',
        'Orders',
        'Appointments',
        'Garments',
      ];
      for (const item of navItems) {
        await expect(
          page.getByRole('link', { name: new RegExp(item, 'i') })
        ).toBeVisible();
      }

      // Navigate to a page
      await page.getByRole('link', { name: /clients/i }).click();
      await page.waitForURL('**/clients');

      // Verify mobile layout
      expect(page.url()).toContain('/clients');
    });

    test('forms are usable on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 812 });

      await navigateToProtectedRoute(page, '/clients');

      // Open add client form
      await page.getByRole('button', { name: /add client/i }).click();

      // Verify form is accessible and scrollable
      const nameInput = page.getByLabel(/name/i);
      await expect(nameInput).toBeVisible();

      // Should be able to interact with form elements
      await nameInput.fill('Mobile Test Client');

      // Form should be scrollable to reach all fields
      const submitButton = page.getByRole('button', { name: /save|create/i });
      await submitButton.scrollIntoViewIfNeeded();
      await expect(submitButton).toBeVisible();
    });
  });
});
