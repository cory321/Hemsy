import { test, expect } from '@playwright/test';

test.describe('Garment Edit with Optimistic Updates', () => {
  // Mock data
  const garmentId = 'test-garment-123';
  const originalName = 'Test Garment';
  const updatedName = 'Updated Garment Name';

  test.beforeEach(async ({ page }) => {
    // Navigate to a garment detail page
    // In a real test, you'd need to set up authentication and navigate to an actual garment
    await page.goto(`/garments/${garmentId}`);
  });

  test('updates garment name with optimistic UI', async ({ page }) => {
    // Click the Edit button
    await page.getByRole('button', { name: /edit/i }).click();

    // Wait for dialog to open
    await expect(
      page.getByRole('dialog', { name: /edit garment/i })
    ).toBeVisible();

    // Get the name input and clear it
    const nameInput = page.getByRole('textbox', { name: /garment name/i });
    await nameInput.clear();
    await nameInput.fill(updatedName);

    // Click Save Changes
    await page.getByRole('button', { name: /save changes/i }).click();

    // Dialog should close immediately (optimistic)
    await expect(
      page.getByRole('dialog', { name: /edit garment/i })
    ).not.toBeVisible();

    // The name should update immediately in the UI
    await expect(
      page.getByRole('heading', { name: updatedName })
    ).toBeVisible();

    // No success toast should appear (only errors show toasts)
    await expect(page.getByText(/success/i)).not.toBeVisible();
  });

  test('shows date pickers with formatted dates', async ({ page }) => {
    // Click the Edit button
    await page.getByRole('button', { name: /edit/i }).click();

    // Check that date pickers show formatted dates
    const datePickers = page.getByPlaceholder(/EEEE, MMMM/i);

    // Should have at least the due date picker
    await expect(datePickers.first()).toBeVisible();

    // Check Special Event checkbox to show event date picker
    const specialEventCheckbox = page.getByRole('checkbox', {
      name: /special event/i,
    });

    // If not checked, check it
    const isChecked = await specialEventCheckbox.isChecked();
    if (!isChecked) {
      await specialEventCheckbox.click();
    }

    // Now we should have 2 date pickers
    await expect(datePickers).toHaveCount(2);

    // Close dialog
    await page.getByRole('button', { name: /cancel/i }).click();
  });

  test('updates services with optimistic UI', async ({ page }) => {
    // Click Add Service button
    await page.getByRole('button', { name: /add service/i }).click();

    // Wait for service dialog
    await expect(
      page.getByRole('dialog', { name: /add service/i })
    ).toBeVisible();

    // Choose custom service
    await page.getByRole('button', { name: /custom service/i }).click();

    // Fill in service details
    await page.getByRole('textbox', { name: /service name/i }).fill('Hemming');
    await page.getByRole('spinbutton', { name: /quantity/i }).fill('1');
    await page.getByRole('spinbutton', { name: /unit price/i }).fill('25.00');

    // Click Add Service
    await page
      .getByRole('button', { name: /add service/i })
      .last()
      .click();

    // Dialog should close immediately
    await expect(
      page.getByRole('dialog', { name: /add service/i })
    ).not.toBeVisible();

    // Service should appear immediately in the list
    await expect(page.getByText('Hemming')).toBeVisible();
    await expect(page.getByText('$25.00')).toBeVisible();
  });

  test('handles errors gracefully', async ({ page }) => {
    // Mock a network error for the update request
    await page.route('**/api/garments/*', (route) => {
      route.abort('failed');
    });

    // Click the Edit button
    await page.getByRole('button', { name: /edit/i }).click();

    // Change the name
    const nameInput = page.getByRole('textbox', { name: /garment name/i });
    await nameInput.clear();
    await nameInput.fill('This will fail');

    // Click Save Changes
    await page.getByRole('button', { name: /save changes/i }).click();

    // Should show error toast
    await expect(page.getByText(/error|failed/i)).toBeVisible();

    // The UI should revert to the original value
    await expect(
      page.getByRole('heading', { name: originalName })
    ).toBeVisible();
  });
});
