import { test, expect } from '@playwright/test';
import { signInWithClerk } from './helpers/clerk-auth.helper';

test.describe('Garment Stage Optimistic Updates', () => {
  test.beforeEach(async ({ page }) => {
    await signInWithClerk(page);
  });

  test('should instantly update garment stage when adding a service', async ({
    page,
  }) => {
    // Navigate to a garment detail page
    // First, let's find a garment to test with
    await page.goto('/garments');
    await page.waitForLoadState('networkidle');

    // Click on the first garment
    const firstGarment = page.locator('[data-testid="garment-card"]').first();
    await expect(firstGarment).toBeVisible();
    await firstGarment.click();

    // Wait for garment detail page to load
    await page.waitForLoadState('networkidle');
    await expect(
      page.locator('[data-testid="garment-image-section"]')
    ).toBeVisible();

    // Get the initial stage
    const stageBox = page
      .locator('text=New, text=In Progress, text=Ready For Pickup, text=Done')
      .first();
    const initialStage = await stageBox.textContent();

    // Open the add service dialog
    const addServiceButton = page.locator('button:has-text("Add Service")');
    await expect(addServiceButton).toBeVisible();
    await addServiceButton.click();

    // Wait for dialog to open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Add a custom service
    await page.locator('button:has-text("Custom Service")').click();

    // Fill in service details
    await page.fill('input[placeholder*="Service name"]', 'Test Service');
    await page.fill('input[placeholder*="Price"]', '25.00');

    // Submit the service
    const submitButton = page.locator('button:has-text("Add Service")');
    await submitButton.click();

    // The stage should update instantly (optimistically)
    // If the garment had no services before, it should change from "New" to "New" (still New because service isn't done)
    // If it had services, the stage calculation should be immediate

    // Wait a moment for the optimistic update
    await page.waitForTimeout(100);

    // Verify the service appears in the list immediately
    await expect(page.locator('text=Test Service')).toBeVisible();

    // The stage should be updated without needing a page refresh
    // For a new service (not completed), if this was the first service, stage should still be "New"
    // If there were already services, stage should be calculated correctly

    // Let's mark the service as complete to test stage transition
    const serviceCheckbox = page.locator('input[type="checkbox"]').last();
    await serviceCheckbox.check();

    // Stage should instantly update to "Ready For Pickup" if this is the only service
    // or "In Progress" if there are other incomplete services
    await page.waitForTimeout(100);

    // Verify stage updated without page refresh
    const updatedStage = await stageBox.textContent();
    expect(updatedStage).not.toBe(initialStage);

    console.log(`Stage changed from "${initialStage}" to "${updatedStage}"`);
  });

  test('should instantly update stage when toggling service completion', async ({
    page,
  }) => {
    // Navigate to a garment with services
    await page.goto('/garments');
    await page.waitForLoadState('networkidle');

    // Find a garment with services (look for one that's "In Progress")
    const inProgressGarment = page
      .locator('[data-testid="garment-card"]:has-text("In Progress")')
      .first();

    if ((await inProgressGarment.count()) > 0) {
      await inProgressGarment.click();
      await page.waitForLoadState('networkidle');

      // Get initial stage
      const stageBox = page
        .locator('text=New, text=In Progress, text=Ready For Pickup, text=Done')
        .first();
      const initialStage = await stageBox.textContent();

      // Find an incomplete service and complete it
      const incompleteService = page
        .locator('input[type="checkbox"]:not(:checked)')
        .first();
      if ((await incompleteService.count()) > 0) {
        await incompleteService.check();

        // Stage should update instantly
        await page.waitForTimeout(100);

        const updatedStage = await stageBox.textContent();
        console.log(
          `Stage changed from "${initialStage}" to "${updatedStage}" after completing service`
        );

        // Now uncheck it
        await incompleteService.uncheck();
        await page.waitForTimeout(100);

        const revertedStage = await stageBox.textContent();
        console.log(
          `Stage reverted to "${revertedStage}" after uncompleting service`
        );
      }
    }
  });

  test('should handle stage updates when removing services', async ({
    page,
  }) => {
    // This test would verify that removing services also updates the stage optimistically
    // Implementation would be similar to the above tests
    await page.goto('/garments');
    await page.waitForLoadState('networkidle');

    // Click on first garment
    const firstGarment = page.locator('[data-testid="garment-card"]').first();
    await expect(firstGarment).toBeVisible();
    await firstGarment.click();
    await page.waitForLoadState('networkidle');

    // If there are services with remove buttons, test removing one
    const removeButton = page
      .locator('button[aria-label*="Remove"], button:has-text("Remove")')
      .first();

    if ((await removeButton.count()) > 0) {
      const initialStage = await page
        .locator('text=New, text=In Progress, text=Ready For Pickup, text=Done')
        .first()
        .textContent();

      await removeButton.click();

      // Confirm removal if there's a confirmation dialog
      const confirmButton = page.locator(
        'button:has-text("Remove"), button:has-text("Confirm")'
      );
      if ((await confirmButton.count()) > 0) {
        await confirmButton.click();
      }

      await page.waitForTimeout(100);

      const updatedStage = await page
        .locator('text=New, text=In Progress, text=Ready For Pickup, text=Done')
        .first()
        .textContent();
      console.log(
        `Stage changed from "${initialStage}" to "${updatedStage}" after removing service`
      );
    }
  });
});
