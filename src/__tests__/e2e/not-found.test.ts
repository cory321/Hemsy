import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('unknown route shows custom 404 page', async ({ page }) => {
  const response = await page.goto('/this-route-does-not-exist-xyz');
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole('heading', { name: /page not found/i })
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /go home/i })).toBeVisible();
  await expect(
    page.getByRole('link', { name: /go to dashboard/i })
  ).toBeVisible();
});

test('@accessibility 404 page has no critical a11y violations', async ({
  page,
}) => {
  await page.goto('/this-route-does-not-exist-xyz');
  const results = await new AxeBuilder({ page })
    .disableRules(['meta-viewport', 'color-contrast'])
    .analyze();
  expect(results.violations.filter((v) => v.impact === 'critical')).toEqual([]);
});
