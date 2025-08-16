import { test, expect } from '@playwright/test';

test.describe('Garments Page - Client Name Sorting', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to garments page
    // Note: In a real test, you'd need to handle authentication
    await page.goto('/garments');

    // Wait for the page to load
    await page.waitForSelector('[data-testid="garment-card"]', {
      state: 'visible',
      timeout: 10000,
    });
  });

  test('should sort garments by client name', async ({ page }) => {
    // Select client name from sort dropdown
    await page.click('text=Sort By');
    await page.click('text=Client Name');

    // Wait for the garments to reload
    await page.waitForTimeout(1000);

    // Get all visible garment cards
    const garmentCards = await page
      .locator('[data-testid="garment-card"]')
      .all();

    // Extract client names from the cards
    const clientNames = await Promise.all(
      garmentCards.map(async (card) => {
        const clientNameElement = await card.locator(
          'text=/^[A-Z][a-z]+ [A-Z][a-z]+$/'
        );
        return clientNameElement.textContent();
      })
    );

    // Filter out null values and check if sorted
    const validClientNames = clientNames.filter(
      (name) => name !== null
    ) as string[];

    // Check if names are sorted alphabetically (ascending by default)
    for (let i = 1; i < validClientNames.length; i++) {
      const comparison = validClientNames[i - 1].localeCompare(
        validClientNames[i]
      );
      expect(comparison).toBeLessThanOrEqual(0);
    }
  });

  test('should handle infinite scroll when sorting by client name', async ({
    page,
  }) => {
    // Select client name from sort dropdown
    await page.click('text=Sort By');
    await page.click('text=Client Name');

    // Wait for initial load
    await page.waitForTimeout(1000);

    // Count initial garments
    const initialCount = await page
      .locator('[data-testid="garment-card"]')
      .count();

    // Scroll to bottom to trigger infinite scroll
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for load more button or end text
    const loadMoreButton = page.locator('text=Load more garments');
    const endText = page.locator('text=/All \\d+ garments loaded/');

    // Check if there are more garments to load
    const hasLoadMore = await loadMoreButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (hasLoadMore) {
      // Click load more
      await loadMoreButton.click();

      // Wait for new garments to load
      await page.waitForTimeout(1000);

      // Count garments after loading more
      const newCount = await page
        .locator('[data-testid="garment-card"]')
        .count();

      // Verify more garments were loaded
      expect(newCount).toBeGreaterThan(initialCount);

      // Verify client names are still sorted after loading more
      const garmentCards = await page
        .locator('[data-testid="garment-card"]')
        .all();
      const clientNames = await Promise.all(
        garmentCards.map(async (card) => {
          const clientNameElement = await card.locator(
            'text=/^[A-Z][a-z]+ [A-Z][a-z]+$/'
          );
          return clientNameElement.textContent();
        })
      );

      const validClientNames = clientNames.filter(
        (name) => name !== null
      ) as string[];

      // Check sorting is maintained
      for (let i = 1; i < validClientNames.length; i++) {
        const comparison = validClientNames[i - 1].localeCompare(
          validClientNames[i]
        );
        expect(comparison).toBeLessThanOrEqual(0);
      }
    } else {
      // Verify end text is shown
      await expect(endText).toBeVisible();
    }
  });

  test('should toggle sort order for client name', async ({ page }) => {
    // Select client name from sort dropdown
    await page.click('text=Sort By');
    await page.click('text=Client Name');

    // Wait for initial load
    await page.waitForTimeout(1000);

    // Click sort order button to change to descending
    await page.click('[aria-label*="Ascending"]');

    // Wait for reload
    await page.waitForTimeout(1000);

    // Get client names
    const garmentCards = await page
      .locator('[data-testid="garment-card"]')
      .all();
    const clientNames = await Promise.all(
      garmentCards.slice(0, 5).map(async (card) => {
        // Check first 5 for performance
        const clientNameElement = await card.locator(
          'text=/^[A-Z][a-z]+ [A-Z][a-z]+$/'
        );
        return clientNameElement.textContent();
      })
    );

    const validClientNames = clientNames.filter(
      (name) => name !== null
    ) as string[];

    // Check if names are sorted in descending order
    for (let i = 1; i < validClientNames.length; i++) {
      const comparison = validClientNames[i - 1].localeCompare(
        validClientNames[i]
      );
      expect(comparison).toBeGreaterThanOrEqual(0);
    }
  });

  test('should maintain client name sort when searching', async ({ page }) => {
    // Select client name from sort dropdown
    await page.click('text=Sort By');
    await page.click('text=Client Name');

    // Wait for initial load
    await page.waitForTimeout(1000);

    // Type in search box
    const searchBox = page.locator('[placeholder*="Search garments"]');
    await searchBox.fill('shirt');

    // Wait for search results
    await page.waitForTimeout(1000);

    // Verify results are still sorted by client name
    const garmentCards = await page
      .locator('[data-testid="garment-card"]')
      .all();

    if (garmentCards.length > 1) {
      const clientNames = await Promise.all(
        garmentCards.map(async (card) => {
          const clientNameElement = await card.locator(
            'text=/^[A-Z][a-z]+ [A-Z][a-z]+$/'
          );
          return clientNameElement.textContent();
        })
      );

      const validClientNames = clientNames.filter(
        (name) => name !== null
      ) as string[];

      // Check sorting is maintained
      for (let i = 1; i < validClientNames.length; i++) {
        const comparison = validClientNames[i - 1].localeCompare(
          validClientNames[i]
        );
        expect(comparison).toBeLessThanOrEqual(0);
      }
    }
  });
});
