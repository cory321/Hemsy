import { test, expect } from '@playwright/test';
import { testWithAuth } from '../helpers/auth-helper';

test.describe('Garments Page - Due Date Pagination', () => {
  testWithAuth(
    'should load all garments when sorting by due date',
    async ({ page }) => {
      // Navigate to garments page
      await page.goto('/garments');

      // Wait for initial load
      await page.waitForSelector('[data-testid="garment-card"]');

      // Change sort to due date
      await page.click('text=Sort By');
      await page.click('text=Due Date');

      // Get the total count from "View All" stage
      const viewAllText = await page.textContent('text=View All');
      const totalMatch = viewAllText?.match(/\((\d+)\)/);
      const totalCount = totalMatch ? parseInt(totalMatch[1]) : 0;

      // Scroll to bottom to load all garments
      let previousCount = 0;
      let currentCount = 0;
      let scrollAttempts = 0;
      const maxScrollAttempts = 20;

      do {
        previousCount = currentCount;

        // Scroll to bottom
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight)
        );

        // Wait a bit for loading
        await page.waitForTimeout(500);

        // Count loaded garments
        currentCount = await page
          .locator('[data-testid="garment-card"]')
          .count();

        scrollAttempts++;
      } while (
        currentCount > previousCount &&
        scrollAttempts < maxScrollAttempts
      );

      // Check if we see the "All X garments loaded" message
      const endMessage = await page.textContent(
        'text=/All \\d+ garments loaded/'
      );

      // The loaded count in the message should match the total count
      if (endMessage) {
        const loadedMatch = endMessage.match(/All (\d+) garments loaded/);
        const loadedCount = loadedMatch ? parseInt(loadedMatch[1]) : 0;

        expect(loadedCount).toBe(totalCount);
        expect(currentCount).toBe(totalCount);
      }
    }
  );
});
