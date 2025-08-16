import { test, expect } from '@playwright/test';

// Note: These are E2E test specifications that would run with Playwright
// They test the full user journey of marking services as complete

test.describe('Garment Service Completion', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a garment detail page
    // This assumes test data is set up with a garment that has services
    await page.goto('/garments/test-garment-id');
  });

  test('should mark a service as complete and update garment stage', async ({
    page,
  }) => {
    // Initial assertions
    await expect(page.getByText('Stage: New')).toBeVisible();
    await expect(page.getByText('0 of 3 completed')).toBeVisible();

    // Find the first service and click "Mark Complete"
    const firstService = page.locator('[data-testid="service-item"]').first();
    await firstService.getByRole('button', { name: 'Mark Complete' }).click();

    // Wait for optimistic update
    await expect(
      firstService.getByRole('button', { name: 'Mark Incomplete' })
    ).toBeVisible();
    await expect(firstService.getByText('Completed')).toBeVisible();

    // Check that progress updated
    await expect(page.getByText('1 of 3 completed')).toBeVisible();

    // Check that garment stage updated to "In Progress"
    await expect(page.getByText('Stage: In Progress')).toBeVisible();

    // Verify the service has visual indication of completion
    await expect(firstService).toHaveCSS('opacity', '0.6');

    // Check for success toast
    await expect(page.getByText('Service marked as complete')).toBeVisible();
  });

  test('should mark all services complete and update stage to "Ready For Pickup"', async ({
    page,
  }) => {
    // Mark all services as complete
    const markCompleteButtons = page.getByRole('button', {
      name: 'Mark Complete',
    });
    const count = await markCompleteButtons.count();

    for (let i = 0; i < count; i++) {
      await markCompleteButtons.nth(i).click();
      // Wait for each update
      await page.waitForTimeout(500);
    }

    // Check final state
    await expect(
      page.getByText(`${count} of ${count} completed`)
    ).toBeVisible();
    await expect(page.getByText('Stage: Ready For Pickup')).toBeVisible();

    // All services should show as completed
    const completedChips = page.getByText('Completed');
    await expect(completedChips).toHaveCount(count);
  });

  test('should mark service as incomplete and revert stage', async ({
    page,
  }) => {
    // First mark a service as complete
    const firstService = page.locator('[data-testid="service-item"]').first();
    await firstService.getByRole('button', { name: 'Mark Complete' }).click();

    // Wait for update
    await expect(page.getByText('Stage: In Progress')).toBeVisible();

    // Now mark it as incomplete
    await firstService.getByRole('button', { name: 'Mark Incomplete' }).click();

    // Check that it reverted
    await expect(
      firstService.getByRole('button', { name: 'Mark Complete' })
    ).toBeVisible();
    await expect(page.getByText('Stage: New')).toBeVisible();
    await expect(page.getByText('0 of 3 completed')).toBeVisible();

    // Check for success toast
    await expect(page.getByText('Service marked as incomplete')).toBeVisible();
  });

  test('should show progress bar with correct percentage', async ({ page }) => {
    // Get the progress bar
    const progressBar = page.getByRole('progressbar');

    // Initially should be 0%
    await expect(progressBar).toHaveAttribute('aria-valuenow', '0');

    // Mark one service complete (assuming 3 total services)
    await page.getByRole('button', { name: 'Mark Complete' }).first().click();

    // Progress should be ~33%
    await expect(progressBar).toHaveAttribute(
      'aria-valuenow',
      '33.333333333333336'
    );

    // Mark another service complete
    await page.getByRole('button', { name: 'Mark Complete' }).first().click();

    // Progress should be ~66%
    await expect(progressBar).toHaveAttribute(
      'aria-valuenow',
      '66.66666666666667'
    );
  });

  test('should persist completion status after page refresh', async ({
    page,
  }) => {
    // Mark a service as complete
    const firstService = page.locator('[data-testid="service-item"]').first();
    await firstService.getByRole('button', { name: 'Mark Complete' }).click();

    // Wait for update
    await expect(firstService.getByText('Completed')).toBeVisible();

    // Refresh the page
    await page.reload();

    // Check that the completion status persisted
    await expect(firstService.getByText('Completed')).toBeVisible();
    await expect(
      firstService.getByRole('button', { name: 'Mark Incomplete' })
    ).toBeVisible();
    await expect(page.getByText('1 of 3 completed')).toBeVisible();
    await expect(page.getByText('Stage: In Progress')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Simulate network error by going offline
    await page.context().setOffline(true);

    // Try to mark a service as complete
    await page.getByRole('button', { name: 'Mark Complete' }).first().click();

    // Should show error message
    await expect(
      page.getByText('Failed to update service completion')
    ).toBeVisible();

    // Service should remain unchanged
    const firstService = page.locator('[data-testid="service-item"]').first();
    await expect(
      firstService.getByRole('button', { name: 'Mark Complete' })
    ).toBeVisible();

    // Go back online
    await page.context().setOffline(false);
  });

  test('should be accessible with keyboard navigation', async ({ page }) => {
    // Tab to the first Mark Complete button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Might need multiple tabs depending on page structure

    // The Mark Complete button should be focused
    const firstButton = page
      .getByRole('button', { name: 'Mark Complete' })
      .first();
    await expect(firstButton).toBeFocused();

    // Press Enter to activate
    await page.keyboard.press('Enter');

    // Check that it updated
    await expect(page.getByText('1 of 3 completed')).toBeVisible();
  });

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // All functionality should still work
    await page.getByRole('button', { name: 'Mark Complete' }).first().click();
    await expect(page.getByText('1 of 3 completed')).toBeVisible();
    await expect(page.getByText('Stage: In Progress')).toBeVisible();

    // UI should be properly sized for mobile
    const button = page
      .getByRole('button', { name: 'Mark Incomplete' })
      .first();
    const boundingBox = await button.boundingBox();
    expect(boundingBox?.width).toBeGreaterThanOrEqual(100); // Minimum touch target size
  });
});
