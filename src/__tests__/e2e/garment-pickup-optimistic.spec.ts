import { test, expect } from '@playwright/test';

test.describe('Garment Pickup - Optimistic UI Update', () => {
  test('should optimistically update garment stage to Done when marking as picked up', async ({
    page,
  }) => {
    // Navigate to a garment detail page that is in "Ready For Pickup" stage
    // This assumes you have a test garment with ID that's ready for pickup
    // Replace with actual test data setup
    await page.goto('/garments/test-garment-id');

    // Wait for the page to load
    await page.waitForSelector('text=All services complete!');

    // Verify the garment is in "Ready For Pickup" stage
    await expect(page.locator('[data-testid="garment-stage"]')).toContainText(
      'Ready For Pickup'
    );

    // The ready for pickup banner should be visible
    await expect(
      page.locator('text=This garment is ready for pickup.')
    ).toBeVisible();

    // Click the "Mark as Picked Up" button
    await page.click('button:has-text("Mark as Picked Up")');

    // The stage should immediately update to "Done" (optimistic update)
    await expect(page.locator('[data-testid="garment-stage"]')).toContainText(
      'Done',
      { timeout: 1000 } // Quick timeout to ensure it's optimistic
    );

    // The banner should disappear
    await expect(
      page.locator('text=This garment is ready for pickup.')
    ).not.toBeVisible();

    // A success toast should appear
    await expect(page.locator('text=marked as picked up')).toBeVisible();

    // The change should be reflected in the history
    await page.waitForTimeout(500); // Small delay for history to update
    await expect(
      page.locator('text=Stage changed from Ready For Pickup to Done')
    ).toBeVisible();
  });

  test('should rollback optimistic update on server error', async ({
    page,
  }) => {
    // Mock the server to return an error
    await page.route('**/api/**', (route) => {
      if (route.request().method() === 'POST') {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error' }),
        });
      } else {
        route.continue();
      }
    });

    // Navigate to garment detail page
    await page.goto('/garments/test-garment-id');

    // Wait for the page to load
    await page.waitForSelector('text=All services complete!');

    // Click the "Mark as Picked Up" button
    await page.click('button:has-text("Mark as Picked Up")');

    // The stage might briefly show "Done" but should rollback to "Ready For Pickup"
    await page.waitForTimeout(1000); // Wait for rollback

    // Verify the stage is back to "Ready For Pickup"
    await expect(page.locator('[data-testid="garment-stage"]')).toContainText(
      'Ready For Pickup'
    );

    // The banner should still be visible
    await expect(
      page.locator('text=This garment is ready for pickup.')
    ).toBeVisible();

    // An error toast should appear
    await expect(
      page.locator('text=Failed to mark garment as picked up')
    ).toBeVisible();
  });
});
