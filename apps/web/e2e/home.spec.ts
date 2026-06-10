import { expect, test } from '@playwright/test';

/**
 * E2E — home page interactions and API status panel.
 */
test.describe('home page', () => {
  test('shows api status section', async ({ page }) => {
    await page.goto('/it');
    await expect(page.getByText('Stato API')).toBeVisible();
  });

  test('locale switch link navigates to english', async ({ page }) => {
    await page.goto('/it');
    await page.getByRole('link', { name: /Cambia lingua/i }).click();
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByText('API status')).toBeVisible();
  });
});
