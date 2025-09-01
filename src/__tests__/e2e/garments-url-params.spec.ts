import { test, expect } from '@playwright/test';
import { authenticateUser } from './helpers/clerk-auth.helper';

test.describe('Garments Page - URL Parameter Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate the user before each test
    await authenticateUser(page);
  });

  test('should navigate directly to New stage via URL', async ({ page }) => {
    await page.goto('/garments?stage=new');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that the New stage is selected
    const newStageBox = page.locator('[data-testid="stage-box-new"]');
    await expect(newStageBox).toHaveAttribute('data-selected', 'true');

    // Verify URL is preserved
    expect(page.url()).toContain('stage=new');
  });

  test('should navigate directly to In Progress stage via URL', async ({
    page,
  }) => {
    await page.goto('/garments?stage=in-progress');

    await page.waitForLoadState('networkidle');

    const inProgressStageBox = page.locator(
      '[data-testid="stage-box-in-progress"]'
    );
    await expect(inProgressStageBox).toHaveAttribute('data-selected', 'true');

    expect(page.url()).toContain('stage=in-progress');
  });

  test('should navigate directly to Ready For Pickup stage via URL', async ({
    page,
  }) => {
    await page.goto('/garments?stage=ready-for-pickup');

    await page.waitForLoadState('networkidle');

    const readyStageBox = page.locator(
      '[data-testid="stage-box-ready-for-pickup"]'
    );
    await expect(readyStageBox).toHaveAttribute('data-selected', 'true');

    expect(page.url()).toContain('stage=ready-for-pickup');
  });

  test('should navigate directly to Done stage via URL', async ({ page }) => {
    await page.goto('/garments?stage=done');

    await page.waitForLoadState('networkidle');

    const doneStageBox = page.locator('[data-testid="stage-box-done"]');
    await expect(doneStageBox).toHaveAttribute('data-selected', 'true');

    expect(page.url()).toContain('stage=done');
  });

  test('should update URL when clicking stage boxes', async ({ page }) => {
    await page.goto('/garments');
    await page.waitForLoadState('networkidle');

    // Click on New stage
    await page.click('[data-testid="stage-box-new"]');
    await expect(page).toHaveURL(/stage=new/);

    // Click on In Progress stage
    await page.click('[data-testid="stage-box-in-progress"]');
    await expect(page).toHaveURL(/stage=in-progress/);

    // Click on Ready For Pickup stage
    await page.click('[data-testid="stage-box-ready-for-pickup"]');
    await expect(page).toHaveURL(/stage=ready-for-pickup/);

    // Click on Done stage
    await page.click('[data-testid="stage-box-done"]');
    await expect(page).toHaveURL(/stage=done/);

    // Click on View All to clear stage
    await page.click('[data-testid="stage-box-view-all"]');
    await expect(page).not.toHaveURL(/stage=/);
  });

  test('should handle invalid stage parameter gracefully', async ({ page }) => {
    await page.goto('/garments?stage=invalid-stage');

    await page.waitForLoadState('networkidle');

    // Should default to View All when invalid stage is provided
    const viewAllBox = page.locator('[data-testid="stage-box-view-all"]');
    await expect(viewAllBox).toHaveAttribute('data-selected', 'true');
  });

  test('should preserve stage filter when navigating back', async ({
    page,
  }) => {
    // Navigate to In Progress stage
    await page.goto('/garments?stage=in-progress');
    await page.waitForLoadState('networkidle');

    // Navigate to another page
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate back using browser back button
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Check that In Progress stage is still selected
    const inProgressStageBox = page.locator(
      '[data-testid="stage-box-in-progress"]'
    );
    await expect(inProgressStageBox).toHaveAttribute('data-selected', 'true');
    expect(page.url()).toContain('stage=in-progress');
  });

  test('should clear search when changing stage', async ({ page }) => {
    await page.goto('/garments');
    await page.waitForLoadState('networkidle');

    // Enter search term
    const searchInput = page.locator('input[placeholder*="Search garments"]');
    await searchInput.fill('test search');
    await searchInput.press('Enter');

    // Click on a stage
    await page.click('[data-testid="stage-box-new"]');

    // Check that search is cleared
    await expect(searchInput).toHaveValue('');
  });

  test.describe('Mobile View', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should update URL when selecting stage from dropdown', async ({
      page,
    }) => {
      await page.goto('/garments');
      await page.waitForLoadState('networkidle');

      // Open the stage dropdown
      const stageSelect = page
        .locator('label:has-text("Stage")')
        .locator('..')
        .locator('select, [role="button"]');
      await stageSelect.click();

      // Select In Progress option
      await page.click('text="In Progress"');

      // Check URL is updated
      await expect(page).toHaveURL(/stage=in-progress/);
    });
  });

  test('should bookmarkable URLs work correctly', async ({ page, context }) => {
    // Create a bookmarkable URL
    const bookmarkedUrl = '/garments?stage=ready-for-pickup';

    // Open in a new tab (simulating bookmark click)
    const newPage = await context.newPage();
    await authenticateUser(newPage);
    await newPage.goto(bookmarkedUrl);
    await newPage.waitForLoadState('networkidle');

    // Verify the correct stage is selected
    const readyStageBox = newPage.locator(
      '[data-testid="stage-box-ready-for-pickup"]'
    );
    await expect(readyStageBox).toHaveAttribute('data-selected', 'true');

    await newPage.close();
  });

  test('should allow sharing stage-filtered URLs', async ({
    page,
    context,
  }) => {
    // User 1 creates a filtered view
    await page.goto('/garments');
    await page.waitForLoadState('networkidle');
    await page.click('[data-testid="stage-box-done"]');

    // Get the URL
    const sharedUrl = page.url();
    expect(sharedUrl).toContain('stage=done');

    // User 2 opens the shared URL
    const newPage = await context.newPage();
    await authenticateUser(newPage);
    await newPage.goto(sharedUrl);
    await newPage.waitForLoadState('networkidle');

    // Verify they see the same filtered view
    const doneStageBox = newPage.locator('[data-testid="stage-box-done"]');
    await expect(doneStageBox).toHaveAttribute('data-selected', 'true');

    await newPage.close();
  });
});
