import { test, expect } from '@playwright/test';

// Mock authentication
test.beforeEach(async ({ page }) => {
  // Mock Clerk authentication
  await page.addInitScript(() => {
    (window as any).__clerk_nav_ref = () => {};
    (window as any).Clerk = {
      load: () => Promise.resolve(),
      isReady: () => true,
      client: {
        signIn: { status: 'complete' },
      },
      session: {
        id: 'test-session',
        user: {
          id: 'test-user',
          emailAddresses: [{ emailAddress: 'test@example.com' }],
        },
      },
    };
  });
});

test.describe('Garment SVG Centering', () => {
  test('should center preset SVG in garment detail page', async ({ page }) => {
    // Navigate to a garment detail page with a preset icon
    // You'll need to replace this with an actual garment ID that has a preset icon
    await page.goto('/garments/test-garment-id');

    // Wait for the garment image section to load
    await page.waitForSelector('[data-testid="garment-image-section"]', {
      timeout: 10000,
    });

    // Get the main container for the preset SVG
    const svgContainer = await page
      .locator('[data-testid="garment-image-section"] .MuiBox-root:has(svg)')
      .first();

    // Verify the container has proper centering styles
    const containerStyles = await svgContainer.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        display: computed.display,
        alignItems: computed.alignItems,
        justifyContent: computed.justifyContent,
      };
    });

    expect(containerStyles.display).toBe('flex');
    expect(containerStyles.alignItems).toBe('center');
    expect(containerStyles.justifyContent).toBe('center');

    // Get the SVG element
    const svg = await page
      .locator('[data-testid="garment-image-section"] svg')
      .first();

    // Get the SVG's parent container (the wrapper div from InlinePresetSvg)
    const svgWrapper = await svg.locator('..').first();

    // Verify the SVG is visually centered by checking its position
    const containerBox = await svgContainer.boundingBox();
    const svgBox = await svg.boundingBox();

    if (containerBox && svgBox) {
      // Calculate the center positions
      const containerCenterX = containerBox.x + containerBox.width / 2;
      const containerCenterY = containerBox.y + containerBox.height / 2;
      const svgCenterX = svgBox.x + svgBox.width / 2;
      const svgCenterY = svgBox.y + svgBox.height / 2;

      // Allow for small differences due to rounding
      const tolerance = 5;

      expect(Math.abs(containerCenterX - svgCenterX)).toBeLessThan(tolerance);
      expect(Math.abs(containerCenterY - svgCenterY)).toBeLessThan(tolerance);
    }
  });

  test('should maintain centering on window resize', async ({ page }) => {
    await page.goto('/garments/test-garment-id');
    await page.waitForSelector('[data-testid="garment-image-section"]');

    // Test different viewport sizes
    const viewportSizes = [
      { width: 1200, height: 800 }, // Desktop
      { width: 768, height: 1024 }, // Tablet
      { width: 375, height: 667 }, // Mobile
    ];

    for (const size of viewportSizes) {
      await page.setViewportSize(size);
      await page.waitForTimeout(100); // Wait for resize to complete

      const svgContainer = await page
        .locator('[data-testid="garment-image-section"] .MuiBox-root:has(svg)')
        .first();

      const containerStyles = await svgContainer.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          alignItems: computed.alignItems,
          justifyContent: computed.justifyContent,
        };
      });

      expect(containerStyles.display).toBe('flex');
      expect(containerStyles.alignItems).toBe('center');
      expect(containerStyles.justifyContent).toBe('center');
    }
  });
});
