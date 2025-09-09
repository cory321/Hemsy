import { test, expect } from '@playwright/test';

test.describe('ARIA Hidden Focus Accessibility', () => {
  test('should not have focusable elements inside aria-hidden containers', async ({
    page,
  }) => {
    // Navigate to different pages to test comprehensively
    const pagesToTest = [
      '/',
      '/dashboard',
      '/clients',
      '/appointments',
      '/garments',
      '/more',
    ];

    for (const pagePath of pagesToTest) {
      await page.goto(pagePath);

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Find all elements with aria-hidden="true"
      const ariaHiddenElements = await page
        .locator('[aria-hidden="true"]')
        .all();

      for (const ariaHiddenElement of ariaHiddenElements) {
        // Check if this aria-hidden element contains focusable elements
        const focusableSelectors = [
          'button:not([disabled])',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          'a[href]',
          '[tabindex]:not([tabindex="-1"])',
          'summary',
          'details[open] summary',
        ];

        for (const selector of focusableSelectors) {
          const focusableElements = await ariaHiddenElement
            .locator(selector)
            .all();

          if (focusableElements.length > 0) {
            // Get element details for debugging
            const ariaHiddenHTML = await ariaHiddenElement
              .innerHTML()
              .catch(() => 'Could not get HTML');
            const ariaHiddenClass = await ariaHiddenElement
              .getAttribute('class')
              .catch(() => '');

            console.log(
              `Found focusable elements in aria-hidden container on ${pagePath}:`
            );
            console.log(`Container class: ${ariaHiddenClass}`);
            console.log(`Focusable selector: ${selector}`);
            console.log(
              `Number of focusable elements: ${focusableElements.length}`
            );

            // This should not happen - fail the test
            expect(focusableElements.length).toBe(0);
          }
        }
      }
    }
  });

  test('should handle Material UI components correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check for common Material UI patterns that might cause issues
    const muiElements = await page.locator('[class*="Mui"]').all();

    for (const muiElement of muiElements) {
      const ariaHidden = await muiElement.getAttribute('aria-hidden');

      if (ariaHidden === 'true') {
        // Check if this MUI element has focusable content
        const buttons = await muiElement.locator('button').all();
        const inputs = await muiElement.locator('input').all();
        const links = await muiElement.locator('a[href]').all();

        const totalFocusable = buttons.length + inputs.length + links.length;

        if (totalFocusable > 0) {
          const className = await muiElement.getAttribute('class');
          console.log(
            `Material UI element with aria-hidden="true" contains focusable elements:`
          );
          console.log(`Class: ${className}`);
          console.log(`Focusable elements: ${totalFocusable}`);

          // Fail the test if we find this pattern
          expect(totalFocusable).toBe(0);
        }
      }
    }
  });

  test('should validate specific problematic patterns', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Test for the specific class mentioned by the user
    const muiBoxElements = await page.locator('.MuiBox-root.mui-0').all();

    for (const boxElement of muiBoxElements) {
      const ariaHidden = await boxElement.getAttribute('aria-hidden');

      if (ariaHidden === 'true') {
        // Check for focusable content
        const focusableContent = await boxElement
          .locator(
            'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
          )
          .all();

        if (focusableContent.length > 0) {
          console.log(
            `Found MuiBox-root mui-0 with aria-hidden="true" containing focusable elements:`
          );
          console.log(
            `Number of focusable elements: ${focusableContent.length}`
          );

          // This is the specific issue we're trying to fix
          expect(focusableContent.length).toBe(0);
        }
      }
    }
  });

  test('should ensure proper focus management in dialogs', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');

    // Try to open a dialog if available
    const createButton = page
      .locator('button')
      .filter({ hasText: /create|add|new/i })
      .first();

    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(500); // Wait for dialog to open

      // Check if dialog backdrop has proper aria attributes
      const backdrop = page.locator('.MuiBackdrop-root').first();

      if (await backdrop.isVisible()) {
        const ariaHidden = await backdrop.getAttribute('aria-hidden');

        // Backdrop should not be aria-hidden if it's part of the modal experience
        // But if it is aria-hidden, it shouldn't contain focusable elements
        if (ariaHidden === 'true') {
          const focusableInBackdrop = await backdrop
            .locator('button, input, select, textarea, a[href]')
            .all();
          expect(focusableInBackdrop.length).toBe(0);
        }
      }
    }
  });
});
