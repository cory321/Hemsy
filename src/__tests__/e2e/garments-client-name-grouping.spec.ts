import { test, expect } from '@playwright/test';
import { setupClerkAuth } from '@/lib/test-utils/e2e-helpers';

test.describe('Garments Client Name Grouping', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authentication
    await setupClerkAuth(page);

    // Navigate to garments page
    await page.goto('/garments');

    // Wait for the page to load
    await page.waitForSelector('[data-testid="garment-card"]', {
      timeout: 10000,
    });
  });

  test('should display client name headers when sorting by client name', async ({
    page,
  }) => {
    // Open the sort dropdown
    await page.click('text=Sort By');

    // Select "Client Name" from the dropdown
    await page.click('li[role="option"]:has-text("Client Name")');

    // Wait for the sorting to complete
    await page.waitForLoadState('networkidle');

    // Check that client name headers are visible
    const clientHeaders = page.locator('h2');
    const firstHeader = await clientHeaders.first().textContent();

    // Verify that we have client name headers
    expect(firstHeader).toBeTruthy();

    // Check for the garment count in parentheses
    const headerWithCount = page.locator('text=/(\\d+) garments?/');
    await expect(headerWithCount.first()).toBeVisible();

    // Verify that garments are grouped under client headers
    const firstClientSection = page
      .locator('div')
      .filter({
        has: page.locator('h2').first(),
      })
      .first();

    const garmentsInFirstSection = firstClientSection.locator(
      '[data-testid="garment-card"]'
    );
    const garmentCount = await garmentsInFirstSection.count();

    expect(garmentCount).toBeGreaterThan(0);
  });

  test('should not display client headers when sorting by other fields', async ({
    page,
  }) => {
    // First ensure we're not sorting by client name
    await page.click('text=Sort By');
    await page.click('li[role="option"]:has-text("Due Date")');

    await page.waitForLoadState('networkidle');

    // Check that there are no h2 headers for client names
    const clientHeaders = page.locator('h2');
    const headerCount = await clientHeaders.count();

    // Should only have the main "All Garments" heading, no client grouping headers
    expect(headerCount).toBe(0);
  });

  test('should maintain grouping when changing sort order', async ({
    page,
  }) => {
    // Sort by client name
    await page.click('text=Sort By');
    await page.click('li[role="option"]:has-text("Client Name")');

    await page.waitForLoadState('networkidle');

    // Get the initial order of client names
    const clientHeaders = page.locator('h2');
    const initialOrder = await clientHeaders.allTextContents();

    // Click the sort order toggle button (ascending/descending)
    await page.click('[aria-label*="Ascending"], [aria-label*="Descending"]');

    await page.waitForLoadState('networkidle');

    // Get the new order of client names
    const newOrder = await clientHeaders.allTextContents();

    // Verify that the order has changed (reversed)
    expect(newOrder).not.toEqual(initialOrder);
    expect(newOrder.length).toEqual(initialOrder.length);

    // Headers should still be visible
    await expect(clientHeaders.first()).toBeVisible();
  });

  test('should handle "Unknown Client" grouping correctly', async ({
    page,
  }) => {
    // Sort by client name
    await page.click('text=Sort By');
    await page.click('li[role="option"]:has-text("Client Name")');

    await page.waitForLoadState('networkidle');

    // Check if there's an "Unknown Client" header (if applicable)
    const unknownClientHeader = page.locator('h2:has-text("Unknown Client")');
    const hasUnknownClients = (await unknownClientHeader.count()) > 0;

    if (hasUnknownClients) {
      // Verify that Unknown Client section has garments
      const unknownClientSection = page
        .locator('div')
        .filter({
          has: unknownClientHeader,
        })
        .first();

      const garmentsInSection = unknownClientSection.locator(
        '[data-testid="garment-card"]'
      );
      const garmentCount = await garmentsInSection.count();

      expect(garmentCount).toBeGreaterThan(0);
    }
  });
});
