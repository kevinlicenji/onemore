import { expect, test } from '@playwright/test';

/**
 * E2E — public landing page and locale switch.
 */
test.describe('home page', () => {
  test('shows sign-up and login entry points', async ({ page }) => {
    await page.goto('/it');
    await expect(page.getByRole('link', { name: 'Inizia gratis' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Accedi' })).toBeVisible();
  });

  test('locale switch link navigates to english', async ({ page }) => {
    await page.goto('/it');
    await page.getByRole('link', { name: /Cambia lingua/i }).click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByRole('link', { name: 'Get started free' })).toBeVisible();
  });
});
