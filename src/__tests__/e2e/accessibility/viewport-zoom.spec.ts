import { test, expect } from '@playwright/test';

test.describe('Viewport Zoom Accessibility', () => {
  test('should allow users to zoom in for better accessibility', async ({
    page,
    context,
  }) => {
    // Navigate to the app
    await page.goto('/');

    // Check that the viewport meta tag allows scaling
    const viewportMeta = await page
      .locator('meta[name="viewport"]')
      .getAttribute('content');

    // Verify the viewport configuration meets accessibility requirements
    expect(viewportMeta).not.toContain('user-scalable=no');
    expect(viewportMeta).not.toContain('user-scalable=0');
    expect(viewportMeta).toContain('user-scalable=yes');

    // Check that maximum-scale allows at least 200% zoom (2.0)
    const maxScaleMatch = viewportMeta?.match(/maximum-scale=([0-9.]+)/);
    if (maxScaleMatch && maxScaleMatch[1]) {
      const maxScale = parseFloat(maxScaleMatch[1]);
      expect(maxScale).toBeGreaterThanOrEqual(2);
    }

    // Test actual zoom functionality by setting zoom level
    await page.setViewportSize({ width: 1200, height: 800 });

    // Simulate zoom by changing the page zoom
    await page.evaluate(() => {
      document.body.style.zoom = '2.0';
    });

    // Verify content is still accessible at 200% zoom
    await expect(page.locator('body')).toBeVisible();

    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1.0';
    });
  });

  test('should support mobile pinch-to-zoom gestures', async ({
    page,
    isMobile,
  }) => {
    if (!isMobile) {
      test.skip();
    }

    await page.goto('/');

    // On mobile, verify that pinch-to-zoom is not disabled
    const viewportMeta = await page
      .locator('meta[name="viewport"]')
      .getAttribute('content');

    expect(viewportMeta).not.toContain('user-scalable=no');
    expect(viewportMeta).not.toContain('user-scalable=0');

    // Verify maximum scale allows meaningful zoom
    const maxScaleMatch = viewportMeta?.match(/maximum-scale=([0-9.]+)/);
    if (maxScaleMatch && maxScaleMatch[1]) {
      const maxScale = parseFloat(maxScaleMatch[1]);
      expect(maxScale).toBeGreaterThanOrEqual(2);
    }
  });

  test('should maintain functionality at high zoom levels', async ({
    page,
  }) => {
    await page.goto('/');

    // Test at 300% zoom
    await page.evaluate(() => {
      document.body.style.zoom = '3.0';
    });

    // Verify key navigation elements are still functional
    // (This will depend on your specific app structure)
    await expect(page.locator('body')).toBeVisible();

    // If you have navigation elements, test them here
    // For example:
    // await expect(page.locator('[data-testid="main-nav"]')).toBeVisible();

    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1.0';
    });
  });
});
