import { test, expect } from '@playwright/test';
// import { signInWithTestUser } from './helpers/clerk-auth.helper';

test.describe('Order Cancellation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // await signInWithTestUser(page);
  });

  test('should successfully cancel an order with work in progress', async ({
    page,
  }) => {
    // Navigate to orders page
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    // Find an order that can be cancelled (not completed)
    const orderCard = page.locator('[data-testid="order-card"]').first();
    await expect(orderCard).toBeVisible();

    // Click on the order to go to detail page
    await orderCard.click();
    await page.waitForLoadState('networkidle');

    // Verify we're on the order detail page
    await expect(page.locator('h1')).toContainText('Order');

    // Look for the Cancel Order button in the Order Management section
    const cancelButton = page.getByText('Cancel Order');

    // If the order is already cancelled or completed, skip this test
    const isCancelButtonVisible = await cancelButton.isVisible();
    test.skip(
      !isCancelButtonVisible,
      'Order cannot be cancelled (already cancelled or completed)'
    );

    // Click Cancel Order button
    await cancelButton.click();

    // Verify the cancel dialog opens
    await expect(page.getByText('Cancel Order')).toBeVisible();
    await expect(page.getByText('Confirm Cancel')).toBeVisible();

    // Add a cancellation reason
    const reasonInput = page.getByLabel('Cancellation Reason (Optional)');
    await reasonInput.fill('E2E Test Cancellation');

    // Confirm cancellation
    await page.getByText('Confirm Cancel').click();

    // Wait for the action to complete and page to refresh
    await page.waitForLoadState('networkidle');

    // Verify the order is now cancelled
    await expect(page.getByText('CANCELLED')).toBeVisible();
    await expect(page.getByText('Restore Order')).toBeVisible();

    // Verify services are disabled
    const servicesSection = page
      .locator('text=Services')
      .locator('..')
      .locator('..');
    await expect(
      servicesSection.getByText('Order cancelled - services frozen')
    ).toBeVisible();

    // Verify Add Service button is disabled
    const addServiceButton = page.getByText('Add Service');
    if (await addServiceButton.isVisible()) {
      await expect(addServiceButton).toBeDisabled();
    }
  });

  test('should successfully restore a cancelled order', async ({ page }) => {
    // First, we need to find or create a cancelled order
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    // Filter to show cancelled orders
    const statusFilter = page.getByLabel('Order Status');
    await statusFilter.click();
    await page.getByText('Cancelled').click();
    await page.waitForLoadState('networkidle');

    // Find a cancelled order
    const cancelledOrderCard = page
      .locator('[data-testid="order-card"]')
      .first();
    const hasCancelledOrders = await cancelledOrderCard.isVisible();

    test.skip(!hasCancelledOrders, 'No cancelled orders available for testing');

    // Click on the cancelled order
    await cancelledOrderCard.click();
    await page.waitForLoadState('networkidle');

    // Verify we're on a cancelled order detail page
    await expect(page.getByText('CANCELLED')).toBeVisible();
    await expect(page.getByText('Restore Order')).toBeVisible();

    // Click Restore Order button
    await page.getByText('Restore Order').click();

    // Wait for the action to complete and page to refresh
    await page.waitForLoadState('networkidle');

    // Verify the order is no longer cancelled
    await expect(page.getByText('CANCELLED')).not.toBeVisible();
    await expect(page.getByText('Restore Order')).not.toBeVisible();

    // Verify services are now enabled
    const addServiceButton = page.getByText('Add Service');
    if (await addServiceButton.isVisible()) {
      await expect(addServiceButton).not.toBeDisabled();
    }

    // Verify the cancelled info banner is gone
    await expect(
      page.getByText('Order cancelled - services frozen')
    ).not.toBeVisible();
  });

  test('should prevent service modifications on cancelled orders', async ({
    page,
  }) => {
    // Navigate to orders and filter for cancelled orders
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    const statusFilter = page.getByLabel('Order Status');
    await statusFilter.click();
    await page.getByText('Cancelled').click();
    await page.waitForLoadState('networkidle');

    const cancelledOrderCard = page
      .locator('[data-testid="order-card"]')
      .first();
    const hasCancelledOrders = await cancelledOrderCard.isVisible();

    test.skip(!hasCancelledOrders, 'No cancelled orders available for testing');

    await cancelledOrderCard.click();
    await page.waitForLoadState('networkidle');

    // Navigate to a garment detail page
    const garmentLink = page.locator('a[href*="/garments/"]').first();
    const hasGarments = await garmentLink.isVisible();

    if (hasGarments) {
      await garmentLink.click();
      await page.waitForLoadState('networkidle');

      // Verify service modification is prevented
      await expect(
        page.getByText('Order cancelled - services frozen')
      ).toBeVisible();

      // Verify Add Service button is disabled
      const addServiceButton = page.getByText('Add Service');
      if (await addServiceButton.isVisible()) {
        await expect(addServiceButton).toBeDisabled();
      }

      // Verify service completion buttons are disabled
      const completeButtons = page.locator(
        'button:has-text("Mark as Complete")'
      );
      const completeButtonCount = await completeButtons.count();

      for (let i = 0; i < completeButtonCount; i++) {
        await expect(completeButtons.nth(i)).toBeDisabled();
      }
    }
  });

  test('should show cancelled orders with visual indicators in list view', async ({
    page,
  }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    // Filter to show all orders including cancelled
    const statusFilter = page.getByLabel('Order Status');
    await statusFilter.click();
    await page.getByText('All Order Statuses').click();
    await page.waitForLoadState('networkidle');

    // Look for cancelled order cards
    const cancelledChips = page.locator('text=CANCELLED');
    const hasCancelledOrders = await cancelledChips.first().isVisible();

    if (hasCancelledOrders) {
      // Verify cancelled orders have visual treatment
      const cancelledOrderCard = cancelledChips
        .first()
        .locator('..')
        .locator('..');

      // Check for reduced opacity (cancelled styling)
      const opacity = await cancelledOrderCard.evaluate(
        (el) => window.getComputedStyle(el).opacity
      );
      expect(parseFloat(opacity)).toBeLessThan(1);

      // Verify CANCELLED chip is visible
      await expect(cancelledChips.first()).toBeVisible();
    }
  });

  test('should not allow cancelling completed orders', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    // Filter for completed orders
    const statusFilter = page.getByLabel('Order Status');
    await statusFilter.click();
    await page.getByText('Completed').click();
    await page.waitForLoadState('networkidle');

    const completedOrderCard = page
      .locator('[data-testid="order-card"]')
      .first();
    const hasCompletedOrders = await completedOrderCard.isVisible();

    if (hasCompletedOrders) {
      await completedOrderCard.click();
      await page.waitForLoadState('networkidle');

      // Verify no Cancel Order button is shown for completed orders
      await expect(page.getByText('Cancel Order')).not.toBeVisible();

      // The Order Management section should not appear for completed orders
      const orderManagementSection = page.locator('text=Order Management');
      const isOrderManagementVisible = await orderManagementSection.isVisible();

      if (isOrderManagementVisible) {
        // If it is visible, it should not have a cancel button
        const cancelButtonInSection = orderManagementSection
          .locator('..')
          .getByText('Cancel Order');
        await expect(cancelButtonInSection).not.toBeVisible();
      }
    }
  });

  test('should handle cancellation errors gracefully', async ({ page }) => {
    // This test would need to be implemented with network mocking
    // to simulate server errors during cancellation
    test.skip(true, 'Error simulation requires network mocking setup');
  });

  test('should maintain cancelled status after page refresh', async ({
    page,
  }) => {
    // Navigate to a cancelled order
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');

    const statusFilter = page.getByLabel('Order Status');
    await statusFilter.click();
    await page.getByText('Cancelled').click();
    await page.waitForLoadState('networkidle');

    const cancelledOrderCard = page
      .locator('[data-testid="order-card"]')
      .first();
    const hasCancelledOrders = await cancelledOrderCard.isVisible();

    if (hasCancelledOrders) {
      await cancelledOrderCard.click();
      await page.waitForLoadState('networkidle');

      // Verify cancelled state
      await expect(page.getByText('CANCELLED')).toBeVisible();

      // Refresh the page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify cancelled state persists
      await expect(page.getByText('CANCELLED')).toBeVisible();
      await expect(page.getByText('Restore Order')).toBeVisible();
    }
  });
});
