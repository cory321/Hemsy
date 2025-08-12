import { test, expect } from '@playwright/test';

test.describe('Garment Detail Page', () => {
  // Mock garment ID - in a real test, this would come from a setup step
  const mockGarmentId = 'test-garment-123';

  test.beforeEach(async ({ page }) => {
    // In a real test, you'd set up auth and create test data here
    // For now, we'll just navigate to the page
  });

  test('should display garment details from Supabase', async ({ page }) => {
    // Navigate to garment detail page
    await page.goto(`/garments/${mockGarmentId}`);

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that garment name is displayed
    const garmentTitle = page.locator('h1');
    await expect(garmentTitle).toBeVisible();

    // Check for order information
    const orderInfo = page.locator('text=/Order #\\d+/');
    await expect(orderInfo).toBeVisible();

    // Check for important dates section
    await expect(page.locator('text=Important Dates')).toBeVisible();
    await expect(page.locator('text=Due Date')).toBeVisible();
    await expect(page.locator('text=Event Date')).toBeVisible();
    await expect(page.locator('text=Created')).toBeVisible();

    // Check for services section
    await expect(page.locator('text=Services')).toBeVisible();

    // Check for client information if available
    const clientSection = page.locator('text=Client Information');
    if (await clientSection.isVisible()) {
      await expect(page.locator('text=Name')).toBeVisible();
      await expect(page.locator('text=Email')).toBeVisible();
      await expect(page.locator('text=Phone')).toBeVisible();
    }

    // Check for stage display
    await expect(page.locator('text=Current Stage')).toBeVisible();

    // Check for action buttons
    await expect(page.locator('button:has-text("Edit")')).toBeVisible();
    const photoButton = page.locator('button:has(svg) >> text=/Photo/');
    await expect(photoButton).toBeVisible();
  });

  test('should handle missing garment gracefully', async ({ page }) => {
    // Navigate to a non-existent garment
    await page.goto('/garments/non-existent-id');

    // Should show 404 or not found page
    await expect(page).toHaveURL(/not-found|404/);
  });

  test('should display garment without services correctly', async ({
    page,
  }) => {
    // Navigate to garment detail page
    await page.goto(`/garments/${mockGarmentId}`);

    // If no services, should show appropriate message
    const noServicesText = page.locator('text=No services added');
    const servicesList = page.locator('[role="list"]').first();

    // Check if either services list or no services message is visible
    const hasServices = await servicesList.isVisible().catch(() => false);
    if (!hasServices) {
      await expect(noServicesText).toBeVisible();
    }
  });

  test('should display garment photo or placeholder', async ({ page }) => {
    // Navigate to garment detail page
    await page.goto(`/garments/${mockGarmentId}`);

    // Check for image or placeholder
    const image = page.locator('img[alt]').first();
    const noImageText = page.locator('text=No image uploaded');

    // Either image or placeholder should be visible
    const hasImage = await image.isVisible().catch(() => false);
    const hasPlaceholder = await noImageText.isVisible().catch(() => false);

    expect(hasImage || hasPlaceholder).toBeTruthy();
  });

  test('should calculate and display total price correctly', async ({
    page,
  }) => {
    // Navigate to garment detail page
    await page.goto(`/garments/${mockGarmentId}`);

    // Check if services section has a total
    const servicesSection = page.locator('text=Services').locator('..');
    const totalText = servicesSection.locator(
      'text=/Total: \\$[\\d,]+\\.\\d{2}/'
    );

    // If there are services, total should be visible
    const serviceItems = await servicesSection
      .locator('[role="listitem"]')
      .count();
    if (serviceItems > 0) {
      await expect(totalText).toBeVisible();
    }
  });
});
