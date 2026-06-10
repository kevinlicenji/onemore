import { expect, test } from '@playwright/test';

/**
 * E2E smoke — verifies the app shell loads in both locales.
 */
test.describe('smoke: web', () => {
  test('italian home page renders', async ({ page }) => {
    await page.goto('/it');
    await expect(page.getByRole('heading', { name: 'OneMore' })).toBeVisible();
  });

  test('english home page renders', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByRole('heading', { name: 'OneMore' })).toBeVisible();
  });
});
