import { test, expect, Page } from '@playwright/test';

test.describe('Garments Pagination', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    // Navigate to garments page
    await page.goto('/garments');

    // Wait for initial load
    await page.waitForSelector('[data-testid="garment-card"]', {
      timeout: 10000,
    });
  });

  test('should load initial garments', async () => {
    // Verify garments are displayed
    const garmentCards = await page
      .locator('[data-testid="garment-card"]')
      .count();
    expect(garmentCards).toBeGreaterThan(0);
    expect(garmentCards).toBeLessThanOrEqual(20); // Default page size

    // Verify total count is displayed
    const totalCount = await page
      .locator('text=/\\(\\d+ total\\)/')
      .textContent();
    expect(totalCount).toBeTruthy();
  });

  test('should load more garments on scroll', async () => {
    // Get initial count
    const initialCount = await page
      .locator('[data-testid="garment-card"]')
      .count();

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for new garments to load (if there are more)
    await page.waitForTimeout(1000); // Wait for infinite scroll trigger

    const hasMoreText = await page
      .locator('text=/All \\d+ garments loaded/')
      .isVisible();
    if (!hasMoreText) {
      // If not all garments are loaded, we should see more garments
      await page.waitForSelector(
        `[data-testid="garment-card"]:nth-child(${initialCount + 1})`,
        {
          timeout: 5000,
        }
      );

      const newCount = await page
        .locator('[data-testid="garment-card"]')
        .count();
      expect(newCount).toBeGreaterThan(initialCount);
    }
  });

  test('should search garments', async () => {
    // Type in search box
    const searchInput = await page.locator(
      'input[placeholder*="Search garments"]'
    );
    await searchInput.fill('test garment');

    // Wait for search results
    await page.waitForTimeout(500); // Debounce delay

    // Verify search is working (garments should be filtered)
    const garmentNames = await page
      .locator('[data-testid="garment-name"]')
      .allTextContents();

    // At least one garment should match (or no garments if no match)
    if (garmentNames.length > 0) {
      const hasMatch = garmentNames.some(
        (name) =>
          name.toLowerCase().includes('test') ||
          name.toLowerCase().includes('garment')
      );
      expect(hasMatch).toBeTruthy();
    }

    // Clear search
    const clearButton = await page.locator('[aria-label="clear search"]');
    await clearButton.click();

    // Wait for garments to reload
    await page.waitForTimeout(500);
  });

  test('should filter by stage', async () => {
    // Click on a stage filter
    const stageBoxes = await page.locator('[data-testid="stage-box"]');
    const stageCount = await stageBoxes.count();

    if (stageCount > 1) {
      // Click on second stage (first is "View All")
      await stageBoxes.nth(1).click();

      // Wait for filtered results
      await page.waitForTimeout(500);

      // Verify stage filter is applied
      const selectedStage = await page
        .locator('[data-testid="stage-box"].selected')
        .textContent();
      expect(selectedStage).toBeTruthy();

      // Reset to view all
      await stageBoxes.first().click();
    }
  });

  test('should sort garments', async () => {
    // Open sort dropdown
    const sortDropdown = await page
      .locator('label:has-text("Sort By")')
      .locator('..')
      .locator('select, [role="button"]')
      .first();
    await sortDropdown.click();

    // Select different sort option
    await page.locator('[role="option"]:has-text("Client Name")').click();

    // Wait for re-sort
    await page.waitForTimeout(500);

    // Verify garments are grouped by client
    const clientHeaders = await page
      .locator('h6:has-text("("):has-text(")")')
      .count();
    expect(clientHeaders).toBeGreaterThan(0);

    // Change sort order
    const sortOrderButton = await page.locator(
      '[aria-label*="Ascending"], [aria-label*="Descending"]'
    );
    await sortOrderButton.click();

    // Wait for re-sort
    await page.waitForTimeout(500);
  });

  test('should handle network errors gracefully', async () => {
    // Simulate network error
    await page.route('**/garments*', (route) => route.abort('failed'));

    // Scroll to trigger load more
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Should show error message
    await expect(
      page.locator('text=/Failed to load more garments/')
    ).toBeVisible({ timeout: 5000 });

    // Should show retry button
    const retryButton = await page.locator('button:has-text("Try again")');
    await expect(retryButton).toBeVisible();

    // Restore network
    await page.unroute('**/garments*');

    // Click retry
    await retryButton.click();

    // Should attempt to load again
    await page.waitForTimeout(1000);
  });

  test('should be accessible', async () => {
    // Check for proper ARIA labels
    const searchInput = await page.locator(
      'input[placeholder*="Search garments"]'
    );
    await expect(searchInput).toHaveAttribute('type', 'text');

    // Check for keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    // Check for screen reader announcements
    const statusRegion = await page.locator(
      '[role="status"][aria-live="polite"]'
    );
    await expect(statusRegion).toHaveCount(1);

    // Load more button should be accessible via keyboard
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.keyboard.press('Tab');

    // Focus should eventually reach a load more button (even if visually hidden)
    let foundLoadMore = false;
    for (let i = 0; i < 20; i++) {
      const focused = await page.locator(':focus');
      const text = await focused.textContent();
      if (text?.includes('Load more')) {
        foundLoadMore = true;
        break;
      }
      await page.keyboard.press('Tab');
    }
    expect(foundLoadMore).toBeTruthy();
  });

  test('should maintain scroll position on browser back', async () => {
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    const scrollPosition = await page.evaluate(() => window.scrollY);

    // Click on a garment to navigate away
    const firstGarment = await page
      .locator('[data-testid="garment-card"]')
      .first();
    await firstGarment.click();

    // Wait for navigation
    await page.waitForURL(/\/garments\/[^/]+$/);

    // Go back
    await page.goBack();

    // Check scroll position is restored (approximately)
    await page.waitForTimeout(500);
    const newScrollPosition = await page.evaluate(() => window.scrollY);
    expect(Math.abs(newScrollPosition - scrollPosition)).toBeLessThan(100);
  });
});
